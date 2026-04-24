/**
 * IndexedDB Schema Definitions
 * 数据库架构定义 — 每个 DataStore 对应一个 ObjectStore
 */

// 数据库配置
export const DB_CONFIG = {
  name: 'ngx_datatable_offline',
  version: 1
};

// ObjectStore 配置
export const STORE_CONFIG = {
  main: 'datastore_main',
  pending: 'pending_operations',
  meta: 'datastore_meta',
  sync_queue: 'sync_queue'
} as const;

// 索引定义
export interface StoreIndex {
  name: string;
  keyPath: string;
  unique?: boolean;
  multiEntry?: boolean;
}

// 主数据 ObjectStore 索引
export const MAIN_STORE_INDEXES: StoreIndex[] = [
  { name: 'idx_id', keyPath: 'id', unique: true },
  { name: 'idx_status', keyPath: 'status' },
  { name: 'idx_modified_at', keyPath: '_modifiedAt' }
];

// 待同步操作 ObjectStore 索引
export const PENDING_STORE_INDEXES: StoreIndex[] = [
  { name: 'idx_operation_id', keyPath: 'operationId', unique: true },
  { name: 'idx_timestamp', keyPath: 'timestamp' },
  { name: 'idx_status', keyPath: 'status' }
];

// 元数据 ObjectStore 索引
export const META_STORE_INDEXES: StoreIndex[] = [
  { name: 'idx_datastore_id', keyPath: 'datastoreId', unique: true }
];

// 数据库升级计划
export interface DBUpgradePlan {
  version: number;
  upgrades: Array<{
    fromVersion: number;
    toVersion: number;
    createStores?: Array<{
      name: string;
      keyPath: string;
      autoIncrement?: boolean;
      indexes?: StoreIndex[];
    }>;
    deleteStores?: string[];
  }>;
}

// 默认升级计划
export const DB_UPGRADE_PLANS: DBUpgradePlan[] = [
  {
    version: 1,
    upgrades: [{
      fromVersion: 0,
      toVersion: 1,
      createStores: [
        {
          name: STORE_CONFIG.main,
          keyPath: 'id',
          indexes: MAIN_STORE_INDEXES
        },
        {
          name: STORE_CONFIG.pending,
          keyPath: 'operationId',
          autoIncrement: false,
          indexes: PENDING_STORE_INDEXES
        },
        {
          name: STORE_CONFIG.meta,
          keyPath: 'datastoreId',
          indexes: META_STORE_INDEXES
        },
        {
          name: STORE_CONFIG.sync_queue,
          keyPath: 'queueId',
          autoIncrement: true
        }
      ]
    }]
  },
  {
    version: 2,
    upgrades: [{
      fromVersion: 1,
      toVersion: 2,
      // 未来版本升级
    }]
  }
];
