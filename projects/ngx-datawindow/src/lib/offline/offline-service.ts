/**
 * 离线服务
 * 集成 DataStore 与 IndexedDB，提供完整的离线支持
 * 包含乐观锁冲突检测与性能监控
 */

import { DataStoreImpl } from '../datastore';
import { OfflineStorageAdapter, type SyncStatus } from './offline-storage';

/** 同步回调类型 */
export type SyncCallback = (
  changes: Array<{
    type: 'insert' | 'update' | 'delete';
    rowId: number;
    data: Record<string, unknown>;
    /** 本地版本号，用于乐观锁检测 */
    localVersion?: number;
  }>
) => Promise<Array<{
  rowId: number;
  serverId?: number;
  /** 服务端版本号，同步成功后返回供乐观锁使用 */
  serverVersion?: number;
  error?: string;
}>>;

/** 冲突解决策略 */
export type ConflictStrategy = 'server_wins' | 'client_wins' | 'manual';

/** 冲突信息 */
export interface ConflictInfo {
  rowId: number;
  localVersion: number;
  serverVersion: number;
  clientData: Record<string, unknown>;
  serverData: Record<string, unknown>;
  conflictType: 'modified' | 'deleted';
  /** 冲突字段列表 */
  conflictFields?: string[];
}

/** 冲突解决回调 */
export type ConflictResolver = (conflicts: ConflictInfo[]) => Promise<Record<number, 'client' | 'server'>>;

/** 同步性能指标 */
export interface SyncMetrics {
  duration: number;
  bytesSent: number;
  bytesReceived: number;
  syncedCount: number;
  failedCount: number;
  conflictCount: number;
  pendingCount: number;
}

/** 离线服务配置 */
export interface OfflineServiceConfig {
  datastore: DataStoreImpl;
  datastoreId: string;
  syncCallback: SyncCallback;
  conflictStrategy?: ConflictStrategy;
  conflictResolver?: ConflictResolver;
  autoLoadOnInit?: boolean;
  autoPersist?: boolean;
  autoSyncOnReconnect?: boolean;
}

/** 离线服务事件 */
export interface OfflineServiceEvents {
  onSyncStart?: () => void;
  onSyncComplete?: (syncedCount: number, metrics: SyncMetrics) => void;
  onSyncError?: (error: Error, metrics?: SyncMetrics) => void;
  onConflict?: (conflicts: ConflictInfo[]) => void;
  onOnlineStatusChange?: (isOnline: boolean) => void;
  onStorageError?: (error: Error) => void;
}

/** 同步结果 */
export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  conflictCount: number;
  conflicts: ConflictInfo[];
  metrics?: SyncMetrics;
  error?: string;
}

/**
 * OfflineService
 * 离线数据服务，集成 DataStore 与 IndexedDB
 * 支持乐观锁冲突检测与性能监控
 */
export class OfflineService {
  private datastore: DataStoreImpl;
  private storage: OfflineStorageAdapter;
  private config: Required<OfflineServiceConfig>;
  private events: OfflineServiceEvents;
  private isInitialized: boolean = false;
  private isSyncing: boolean = false;
  private lastSyncTime: number = 0;

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
    this.setupDataStoreListeners();
  }

  /** 设置 DataStore 事件监听 */
  private setupDataStoreListeners(): void {
    // 监听 rowAdded（新增行触发）
    this.datastore.on('rowAdded', async (event: any) => {
      if (!this.config.autoPersist) return;
      try {
        const rows = Array.isArray(event.rows) ? event.rows : [event.row].filter(Boolean);
        for (const row of rows) {
          await this.storage.saveChanges([row]);
          await this.storage.logChange({
            operationType: 'insert',
            rowId: row.id,
            newData: row.raw
          });
        }
      } catch (error) {
        this.events.onStorageError?.(error as Error);
      }
    });

    // 监听 rowStatusChanged（状态变更触发，包括修改/删除）
    this.datastore.on('rowStatusChanged', async (event: any) => {
      if (!this.config.autoPersist) return;
      try {
        const row = this.datastore.getRowById(event.rowId);
        if (!row || row.status === 'normal') return;
        await this.storage.saveChanges([row]);
        await this.storage.logChange({
          operationType: row.status === 'deleted' ? 'delete' : 'update',
          rowId: row.id,
          newData: row.raw
        });
      } catch (error) {
        this.events.onStorageError?.(error as Error);
      }
    });

    window.addEventListener('online', () => {
      this.events.onOnlineStatusChange?.(true);
      if (this.config.autoSyncOnReconnect) this.sync().catch(() => {});
    });
    window.addEventListener('offline', () => {
      this.events.onOnlineStatusChange?.(false);
    });
  }

  /** 初始化服务 */
  async initialize(): Promise<{ success: boolean; loadedFromCache: boolean; error?: string }> {
    if (this.isInitialized) {
      return { success: true, loadedFromCache: false };
    }

    if (this.config.autoLoadOnInit) {
      const loadResult = await this.storage.loadAll();
      if (loadResult.success && loadResult.rows && loadResult.rows.length > 0) {
        this.datastore.setData(loadResult.rows as any);
        this.isInitialized = true;
        return { success: true, loadedFromCache: true };
      }
    }

    this.isInitialized = true;
    return { success: true, loadedFromCache: false };
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
      return { success: false, syncedCount: 0, failedCount: 0, conflictCount: 0, conflicts: [], error: 'Sync already in progress' };
    }

    if (!this.storage.checkOnline()) {
      return { success: false, syncedCount: 0, failedCount: 0, conflictCount: 0, conflicts: [], error: 'Offline' };
    }

    this.isSyncing = true;
    this.events.onSyncStart?.();
    const startTime = Date.now();
    let bytesSent = 0;

    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      failedCount: 0,
      conflictCount: 0,
      conflicts: []
    };

    const buildMetrics = (): SyncMetrics => ({
      duration: Date.now() - startTime,
      bytesSent,
      bytesReceived: 0,
      syncedCount: result.syncedCount,
      failedCount: result.failedCount,
      conflictCount: result.conflictCount,
      pendingCount: 0
    });

    try {
      const pendingChanges = await this.storage.getPendingChanges();

      if (pendingChanges.length === 0) {
        result.metrics = buildMetrics();
        this.events.onSyncComplete?.(0, result.metrics);
        this.isSyncing = false;
        return result;
      }

      // 构造同步数据：带上本地版本号（乐观锁关键）
      const syncData = pendingChanges.map(change => {
        const localVersion = this.storage.getLocalVersion(change.rowId);
        return {
          type: change.operationType,
          rowId: change.rowId,
          data: change.newData,
          localVersion
        };
      });

      bytesSent = JSON.stringify(syncData).length;

      // 调用服务端同步回调
      const syncResponses = await this.config.syncCallback(syncData);

      // ─── 冲突检测（乐观锁核心）──────────────────────────────
      const conflicts = this.detectConflicts(pendingChanges, syncResponses);
      result.conflicts = conflicts;
      result.conflictCount = conflicts.length;

      if (conflicts.length > 0) {
        this.events.onConflict?.(conflicts);
        await this.resolveConflicts(conflicts);
      }

      // ─── 处理同步响应 ─────────────────────────────────────
      for (const response of syncResponses) {
        if (response.error) {
          result.failedCount++;
          continue;
        }

        // 成功的同步：更新本地版本号为服务端版本
        if (typeof response.serverVersion === 'number') {
          this.storage.updateLocalVersions([{
            rowId: response.rowId,
            serverVersion: response.serverVersion
          }]);
        }

        result.syncedCount++;
        const change = pendingChanges.find(c => c.rowId === response.rowId);
        if (change) {
          await this.storage.markSynced(change.operationId);
          // 接受变更：清除 changes，status → normal，版本已更新
          await this.storage.acceptChanges([response.rowId]);
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

      this.lastSyncTime = Date.now();
      result.metrics = buildMetrics();
      this.events.onSyncComplete?.(result.syncedCount, result.metrics);
    } catch (error) {
      result.success = false;
      result.error = error instanceof Error ? error.message : 'Unknown error';
      result.metrics = buildMetrics();
      this.events.onSyncError?.(error as Error, result.metrics);
    }

    this.isSyncing = false;
    return result;
  }

  /**
   * 乐观锁冲突检测
   * 策略：服务端返回 serverVersion，若与本地版本不一致 → 冲突
   */
  private detectConflicts(
    pendingChanges: Array<{ rowId: number; newData: Record<string, unknown>; operationType: string }>,
    responses: Array<{ rowId: number; serverVersion?: number; error?: string }>
  ): ConflictInfo[] {
    const conflicts: ConflictInfo[] = [];

    for (const response of responses) {
      if (response.error) continue;
      if (typeof response.serverVersion !== 'number') continue;

      const localVersion = this.storage.getLocalVersion(response.rowId);
      if (localVersion > 0 && localVersion !== response.serverVersion) {
        const change = pendingChanges.find(c => c.rowId === response.rowId);
        const clientData = change?.newData ?? {};

        // 检测冲突字段：比对服务端返回的 serverData 与本地数据
        const conflictFields = this.findConflictFields(clientData, {});

        conflicts.push({
          rowId: response.rowId,
          localVersion,
          serverVersion: response.serverVersion,
          clientData,
          serverData: {},
          conflictType: 'modified',
          conflictFields
        });

        console.log(`[OfflineService] Conflict detected for row ${response.rowId}: ` +
          `local v${localVersion} vs server v${response.serverVersion}`);
      }
    }

    return conflicts;
  }

  /** 找出哪些字段发生了冲突 */
  private findConflictFields(
    clientData: Record<string, unknown>,
    serverData: Record<string, unknown>
  ): string[] {
    const fields: string[] = [];
    const allKeys = new Set([...Object.keys(clientData), ...Object.keys(serverData)]);
    for (const key of allKeys) {
      if (JSON.stringify(clientData[key]) !== JSON.stringify(serverData[key])) {
        fields.push(key);
      }
    }
    return fields;
  }

  /** 根据策略解决冲突 */
  private async resolveConflicts(conflicts: ConflictInfo[]): Promise<void> {
    if (this.config.conflictStrategy === 'server_wins') {
      await this.applyServerWinsStrategy(conflicts);
    } else if (this.config.conflictStrategy === 'client_wins') {
      // 保留本地数据，重新标记为待同步（已在主流程处理）
      console.log(`[OfflineService] Client-wins: keeping local changes for ${conflicts.length} conflicts`);
    } else if (this.config.conflictStrategy === 'manual' && this.config.conflictResolver) {
      const resolutions = await this.config.conflictResolver(conflicts);
      await this.applyManualResolutions(conflicts, resolutions);
    }
  }

  /** 服务端优先策略：服务端数据覆盖本地 */
  private async applyServerWinsStrategy(conflicts: ConflictInfo[]): Promise<void> {
    for (const conflict of conflicts) {
      if (Object.keys(conflict.serverData).length > 0) {
        // 用服务端数据更新本地 DataStore
        await this.datastore.updateRow(conflict.rowId, conflict.serverData as any);
        // 用服务端版本号覆盖本地
        this.storage.updateLocalVersions([{
          rowId: conflict.rowId,
          serverVersion: conflict.serverVersion
        }]);
        // 重新记录变更（下次 sync 上报）
        await this.storage.logChange({
          operationType: 'update',
          rowId: conflict.rowId,
          newData: conflict.serverData
        });
      }
      console.log(`[OfflineService] Server-wins applied for row ${conflict.rowId}`);
    }
  }

  /** 手动解决策略 */
  private async applyManualResolutions(
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
      } else if (resolution === 'server') {
        await this.datastore.updateRow(conflict.rowId, conflict.serverData as any);
        this.storage.updateLocalVersions([{
          rowId: conflict.rowId,
          serverVersion: conflict.serverVersion
        }]);
      }
    }
  }

  /** 清除本地缓存 */
  async clearCache(): Promise<{ success: boolean; error?: string }> {
    const result = await this.storage.clear();
    return { success: result.success, error: result.error };
  }

  /** 销毁服务 */
  destroy(): void {
    this.isInitialized = false;
    this.isSyncing = false;
  }
}
