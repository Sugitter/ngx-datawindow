/**
 * 离线存储适配器
 * 将 DataStore 数据持久化到 IndexedDB
 */

import { IndexedDBManager, defaultDB } from './idb-manager';
import { STORE_CONFIG } from './schema';
import type { DataRow, DataStoreEvent } from '../datastore';

/** 行数据 + 元数据 */
export interface PersistedRow {
  id: number;
  rowNumber: number;
  bufferType: 'main' | 'filtered' | 'deleted';
  status: 'new' | 'normal' | 'modified' | 'deleted';
  raw: Record<string, unknown>;
  computed: Record<string, unknown>;
  changes: Record<string, unknown>;
  _version: number;
  _checksum: string;
}

/** DataStore 元数据 */
export interface PersistedMeta {
  datastoreId: string;
  version: number;
  rowCount: number;
  lastModified: number;
  checksum: string;
}

/** 同步状态 */
export interface SyncStatus {
  isOnline: boolean;
  pendingCount: number;
  lastSyncTime: number | null;
  syncError?: string;
}

/** 变更记录 */
export interface ChangeLog {
  operationId: string;
  datastoreId: string;
  operationType: 'insert' | 'update' | 'delete';
  rowId: number;
  oldData?: Record<string, unknown>;
  newData: Record<string, unknown>;
  timestamp: number;
  status: 'pending' | 'synced' | 'failed';
  retryCount: number;
  error?: string;
}

/** 持久化结果 */
export interface PersistResult {
  success: boolean;
  rowsAffected: number;
  error?: string;
}

/**
 * OfflineStorageAdapter
 * 管理 DataStore 的离线持久化
 */
export class OfflineStorageAdapter {
  private db: IndexedDBManager;
  private datastoreId: string;
  private syncQueue: ChangeLog[] = [];
  private isOnline: boolean = navigator.onLine;

  constructor(datastoreId: string, db?: IndexedDBManager) {
    this.datastoreId = datastoreId;
    this.db = db ?? defaultDB;

    // 监听网络状态
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.triggerSync();
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /** 获取当前同步状态 */
  getSyncStatus(): SyncStatus {
    return {
      isOnline: this.isOnline,
      pendingCount: this.syncQueue.length,
      lastSyncTime: this.syncQueue.length > 0
        ? Math.max(...this.syncQueue.map(c => c.timestamp))
        : null
    };
  }

  /** 检查是否在线 */
  checkOnline(): boolean {
    return this.isOnline;
  }

  /** 保存数据（完整替换） */
  async saveAll(rows: DataRow[]): Promise<PersistResult> {
    const result = await this.db.open();
    if (!result.success) {
      return { success: false, rowsAffected: 0, error: result.error };
    }

    const persistedRows: PersistedRow[] = rows.map(row => {
      const rawCopy = JSON.parse(JSON.stringify(row.raw));
      return {
        id: row.id,
        rowNumber: row.rowNumber,
        bufferType: row.bufferType,
        status: row.status,
        raw: rawCopy,
        computed: JSON.parse(JSON.stringify(row.computed)),
        changes: JSON.parse(JSON.stringify(Object.entries(row.changes))),
        _version: 1,
        _checksum: this.computeChecksum(row.raw)
      };
    });

    const batchResult = await this.db.batchOperate(
      STORE_CONFIG.main,
      persistedRows.map(row => ({
        type: 'put' as const,
        data: row
      }))
    );

    if (batchResult.success) {
      await this.saveMeta({
        datastoreId: this.datastoreId,
        version: 1,
        rowCount: persistedRows.length,
        lastModified: Date.now(),
        checksum: this.computeChecksum(persistedRows)
      });
    }

    return {
      success: batchResult.success ?? false,
      rowsAffected: batchResult.data ?? 0,
      error: batchResult.error
    };
  }

  /** 增量保存变更行 */
  async saveChanges(rows: DataRow[]): Promise<PersistResult> {
    const result = await this.db.open();
    if (!result.success) {
      return { success: false, rowsAffected: 0, error: result.error };
    }

    const changes = rows.filter(r => r.status !== 'normal');

    const batchResult = await this.db.batchOperate(
      STORE_CONFIG.main,
      changes.map(row => ({
        type: 'put' as const,
        data: {
          id: row.id,
          rowNumber: row.rowNumber,
          bufferType: row.bufferType,
          status: row.status,
          raw: JSON.parse(JSON.stringify(row.raw)),
          computed: JSON.parse(JSON.stringify(row.computed)),
          changes: JSON.parse(JSON.stringify(Object.entries(row.changes))),
          _version: 1,
          _checksum: this.computeChecksum(row.raw)
        }
      }))
    );

    return {
      success: batchResult.success ?? false,
      rowsAffected: batchResult.data ?? 0,
      error: batchResult.error
    };
  }

  /** 加载数据 */
  async loadAll(): Promise<PersistResult & { rows?: DataRow[] }> {
    const result = await this.db.open();
    if (!result.success) {
      return { success: false, rowsAffected: 0, error: result.error };
    }

    const allResult = await this.db.operate<PersistedRow[]>(STORE_CONFIG.main, 'getAll');

    if (!allResult.success || !allResult.data) {
      return { success: false, rowsAffected: 0, error: allResult.error };
    }

    const rows: DataRow[] = allResult.data.map((p: any) => ({
      id: p.id,
      rowNumber: p.rowNumber ?? p._rowNumber,
      bufferType: p.bufferType ?? 'main',
      status: p.status ?? 'normal',
      raw: p.raw,
      computed: p.computed ?? {},
      changes: p.changes ?? {}
    }));

    return { success: true, rowsAffected: rows.length, rows };
  }

  /** 保存元数据 */
  async saveMeta(meta: PersistedMeta): Promise<PersistResult> {
    const result = await this.db.open();
    if (!result.success) {
      return { success: false, rowsAffected: 0, error: result.error };
    }

    const opResult = await this.db.operate(STORE_CONFIG.meta, 'put', meta);
    return {
      success: opResult.success,
      rowsAffected: opResult.success ? 1 : 0,
      error: opResult.error
    };
  }

  /** 加载元数据 */
  async loadMeta(): Promise<PersistResult & { meta?: PersistedMeta }> {
    const result = await this.db.open();
    if (!result.success) {
      return { success: false, rowsAffected: 0, error: result.error };
    }

    const opResult = await this.db.operate<PersistedMeta>(STORE_CONFIG.meta, 'get', this.datastoreId);
    return {
      success: opResult.success,
      rowsAffected: opResult.success ? 1 : 0,
      meta: opResult.data
    };
  }

  /** 记录变更到同步队列 */
  async logChange(change: Omit<ChangeLog, 'operationId' | 'datastoreId' | 'timestamp' | 'status' | 'retryCount'>): Promise<void> {
    const changeLog: ChangeLog = {
      operationId: `${this.datastoreId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      datastoreId: this.datastoreId,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
      ...change
    };

    await this.db.open();
    await this.db.operate(STORE_CONFIG.pending, 'add', changeLog);

    this.syncQueue.push(changeLog);
  }

  /** 获取待同步队列 */
  async getPendingChanges(): Promise<ChangeLog[]> {
    await this.db.open();
    const result = await this.db.operate<ChangeLog[]>(STORE_CONFIG.pending, 'getAll');
    return result.data ?? [];
  }

  /** 标记变更已同步 */
  async markSynced(operationId: string): Promise<void> {
    await this.db.open();

    // 从 pending 移除
    await this.db.operate(STORE_CONFIG.pending, 'delete', operationId);

    // 从内存队列移除
    this.syncQueue = this.syncQueue.filter(c => c.operationId !== operationId);
  }

  /** 触发同步 */
  async triggerSync(): Promise<void> {
    if (!this.isOnline) {
      console.log('[OfflineStorage] Offline, skipping sync');
      return;
    }

    const pending = await this.getPendingChanges();
    if (pending.length === 0) {
      console.log('[OfflineStorage] No pending changes');
      return;
    }

    console.log(`[OfflineStorage] Syncing ${pending.length} changes...`);

    for (const change of pending) {
      try {
        // 实际同步逻辑由外部实现
        // 这里只负责标记
        await this.markSynced(change.operationId);
        console.log(`[OfflineStorage] Synced: ${change.operationId}`);
      } catch (error) {
        console.error(`[OfflineStorage] Sync failed for ${change.operationId}:`, error);
      }
    }
  }

  /** 清除本地数据 */
  async clear(): Promise<PersistResult> {
    const result = await this.db.open();
    if (!result.success) {
      return { success: false, rowsAffected: 0, error: result.error };
    }

    // 清除主数据
    await this.db.batchOperate(
      STORE_CONFIG.main,
      [{ type: 'clear' as const }]
    );

    // 清除元数据
    await this.db.operate(STORE_CONFIG.meta, 'delete', this.datastoreId);

    // 清除同步队列
    await this.db.batchOperate(STORE_CONFIG.pending, [{ type: 'clear' as const }]);

    this.syncQueue = [];

    return { success: true, rowsAffected: 0 };
  }

  /** 计算数据校验和 */
  private computeChecksum(data: unknown): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
}
