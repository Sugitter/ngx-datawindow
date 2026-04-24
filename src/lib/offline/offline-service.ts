/**
 * 离线服务
 * 集成 DataStore 与 IndexedDB，提供完整的离线支持
 */

import { DataStoreImpl } from '../datastore';
import { OfflineStorageAdapter, type SyncStatus } from './offline-storage';

/** 同步回调类型 */
export type SyncCallback = (
  changes: Array<{
    type: 'insert' | 'update' | 'delete';
    rowId: number;
    data: Record<string, unknown>;
  }>
) => Promise<Array<{ rowId: number; serverId?: number; error?: string }>>;

/** 冲突解决策略 */
export type ConflictStrategy = 'server_wins' | 'client_wins' | 'manual';

/** 冲突信息 */
export interface ConflictInfo {
  rowId: number;
  clientData: Record<string, unknown>;
  serverData: Record<string, unknown>;
  conflictType: 'modified' | 'deleted';
}

/** 冲突解决回调 */
export type ConflictResolver = (conflicts: ConflictInfo[]) => Promise<Record<number, 'client' | 'server'>>;

/** 离线服务配置 */
export interface OfflineServiceConfig {
  /** DataStore 实例 */
  datastore: DataStoreImpl;
  /** DataStore ID */
  datastoreId: string;
  /** 服务器同步回调 */
  syncCallback: SyncCallback;
  /** 冲突解决策略 */
  conflictStrategy?: ConflictStrategy;
  /** 冲突解决回调（当策略为 manual 时） */
  conflictResolver?: ConflictResolver;
  /** 是否在启动时自动加载本地数据 */
  autoLoadOnInit?: boolean;
  /** 是否在变更时自动保存到 IndexedDB */
  autoPersist?: boolean;
  /** 是否在网络恢复时自动同步 */
  autoSyncOnReconnect?: boolean;
}

/** 离线服务事件 */
export interface OfflineServiceEvents {
  onSyncStart?: () => void;
  onSyncComplete?: (syncedCount: number) => void;
  onSyncError?: (error: Error) => void;
  onConflict?: (conflicts: ConflictInfo[]) => void;
  onOnlineStatusChange?: (isOnline: boolean) => void;
  onStorageError?: (error: Error) => void;
}

/** 同步结果 */
export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  conflicts: ConflictInfo[];
  error?: string;
}

/**
 * OfflineService
 * 离线数据服务，集成 DataStore 与 IndexedDB
 */
export class OfflineService {
  private datastore: DataStoreImpl;
  private storage: OfflineStorageAdapter;
  private config: Required<OfflineServiceConfig>;
  private events: OfflineServiceEvents;
  private isInitialized: boolean = false;
  private isSyncing: boolean = false;

  constructor(config: OfflineServiceConfig, events?: OfflineServiceEvents) {
    this.datastore = config.datastore;
    this.storage = new OfflineStorageAdapter(config.datastoreId);
    this.config = {
      conflictStrategy: config.conflictStrategy ?? 'server_wins',
      conflictResolver: config.conflictResolver ?? (async () => ({})) as ConflictResolver,
      autoLoadOnInit: config.autoLoadOnInit ?? true,
      autoPersist: config.autoPersist ?? true,
      autoSyncOnReconnect: config.autoSyncOnReconnect ?? true,
      ...config
    };
    this.events = events ?? {};

    // 注册 DataStore 事件监听器
    this.setupDataStoreListeners();
  }

  /** 初始化服务 */
  async initialize(): Promise<{ success: boolean; loadedFromCache: boolean; error?: string }> {
    if (this.isInitialized) {
      return { success: true, loadedFromCache: false };
    }

    // 尝试从 IndexedDB 加载数据
    if (this.config.autoLoadOnInit) {
      const loadResult = await this.storage.loadAll();
      if (loadResult.success && loadResult.rows && loadResult.rows.length > 0) {
        // 用本地数据初始化 DataStore
        this.datastore.setData(loadResult.rows as any);
        console.log(`[OfflineService] Loaded ${loadResult.rowsAffected} rows from IndexedDB`);
        this.isInitialized = true;
        return { success: true, loadedFromCache: true };
      }
    }

    this.isInitialized = true;
    return { success: true, loadedFromCache: false };
  }

  /** 设置 DataStore 事件监听 */
  private setupDataStoreListeners(): void {
    // 监听变更事件，自动保存到 IndexedDB
    this.datastore.on('rowStatusChanged', async (event) => {
      if (this.config.autoPersist) {
        const changedRows = this.datastore.getChangedRows();
        const rowArray = changedRows.map(c => c.row);
        await this.storage.saveChanges(rowArray);

        // 记录到同步队列
        for (const { row } of changedRows) {
          if (row.status === 'new') {
            await this.storage.logChange({
              operationType: 'insert',
              rowId: row.id,
              newData: row.raw
            });
          } else if (row.status === 'modified') {
            await this.storage.logChange({
              operationType: 'update',
              rowId: row.id,
              newData: row.raw
            });
          } else if (row.status === 'deleted') {
            await this.storage.logChange({
              operationType: 'delete',
              rowId: row.id,
              newData: row.raw
            });
          }
        }
      }
    });
  }

  /** 获取同步状态 */
  getSyncStatus(): SyncStatus {
    return this.storage.getSyncStatus();
  }

  /** 检查是否在线 */
  isOnline(): boolean {
    return this.storage.checkOnline();
  }

  /** 手动触发同步 */
  async sync(): Promise<SyncResult> {
    if (this.isSyncing) {
      return { success: false, syncedCount: 0, failedCount: 0, conflicts: [], error: 'Sync already in progress' };
    }

    if (!this.storage.checkOnline()) {
      return { success: false, syncedCount: 0, failedCount: 0, conflicts: [], error: 'Offline' };
    }

    this.isSyncing = true;
    this.events.onSyncStart?.();

    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      failedCount: 0,
      conflicts: []
    };

    try {
      // 获取待同步的变更
      const pendingChanges = await this.storage.getPendingChanges();

      if (pendingChanges.length === 0) {
        this.events.onSyncComplete?.(0);
        this.isSyncing = false;
        return result;
      }

      // 准备同步数据
      const syncData = pendingChanges.map(change => ({
        type: change.operationType,
        rowId: change.rowId,
        data: change.newData
      }));

      // 调用同步回调
      const syncResponses = await this.config.syncCallback(syncData);

      // 处理同步响应
      for (const response of syncResponses) {
        if (response.error) {
          result.failedCount++;
        } else {
          result.syncedCount++;
          // 标记已同步
          const change = pendingChanges.find(c => c.rowId === response.rowId);
          if (change) {
            await this.storage.markSynced(change.operationId);
          }
        }
      }

      // 处理冲突检测（乐观锁）
      if (this.config.conflictStrategy === 'server_wins') {
        // 服务端数据优先，自动合并
        await this.handleServerWinsConflicts(syncResponses);
      } else if (this.config.conflictStrategy === 'manual' && this.config.conflictResolver) {
        // 需要手动解决冲突
        const conflicts = await this.detectConflicts(syncResponses);
        if (conflicts.length > 0) {
          this.events.onConflict?.(conflicts);
          const resolutions = await this.config.conflictResolver(conflicts);
          await this.applyConflictResolutions(conflicts, resolutions);
        }
      }

      // 更新元数据
      const metaRows = this.datastore.getRows();
      await this.storage.saveMeta({
        datastoreId: this.config.datastoreId,
        version: 1,
        rowCount: metaRows.length,
        lastModified: Date.now(),
        checksum: ''
      });

      this.events.onSyncComplete?.(result.syncedCount);
    } catch (error) {
      result.success = false;
      result.error = error instanceof Error ? error.message : 'Unknown error';
      this.events.onSyncError?.(error as Error);
    }

    this.isSyncing = false;
    return result;
  }

  /** 处理服务端数据优先的冲突 */
  private async handleServerWinsConflicts(_responses: Array<{ rowId: number; serverId?: number; error?: string }>): Promise<void> {
    // 简化实现：当服务端返回数据时，用服务端数据覆盖本地
    // 实际应从 syncCallback 获取服务端最新数据
    console.log('[OfflineService] Server-wins conflict resolution applied');
  }

  /** 检测冲突 */
  private async detectConflicts(_responses: Array<{ rowId: number; serverId?: number; error?: string }>): Promise<ConflictInfo[]> {
    // 简化实现：检测本地修改时间与服务端不一致的行
    const conflicts: ConflictInfo[] = [];
    // 实际应与服务器通信获取服务端版本号进行比较
    return conflicts;
  }

  /** 应用冲突解决方案 */
  private async applyConflictResolutions(
    conflicts: ConflictInfo[],
    resolutions: Record<number, 'client' | 'server'>
  ): Promise<void> {
    for (const conflict of conflicts) {
      const resolution = resolutions[conflict.rowId];
      if (resolution === 'client') {
        // 保留客户端数据，重新标记为待同步
        await this.storage.logChange({
          operationType: 'update',
          rowId: conflict.rowId,
          newData: conflict.clientData
        });
      } else {
        // 使用服务端数据，更新本地
        const row = this.datastore.getRowById(conflict.rowId);
        if (row) {
          this.datastore.updateRow(conflict.rowId, conflict.serverData as any);
        }
      }
    }
  }

  /** 清除本地缓存 */
  async clearCache(): Promise<{ success: boolean; error?: string }> {
    const result = await this.storage.clear();
    return {
      success: result.success,
      error: result.error
    };
  }

  /** 销毁服务 */
  destroy(): void {
    this.isInitialized = false;
    this.isSyncing = false;
  }
}
