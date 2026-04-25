/**
 * 离线模块公共 API
 */

// Schema
export {
  DB_CONFIG,
  STORE_CONFIG,
  MAIN_STORE_INDEXES,
  PENDING_STORE_INDEXES,
  META_STORE_INDEXES,
  DB_UPGRADE_PLANS,
  type StoreIndex,
  type DBUpgradePlan
} from './schema';

// IDB Manager
export {
  IndexedDBManager,
  defaultDB,
  type DBState,
  type IDBResult,
  type TransactionMode
} from './idb-manager';

// Offline Storage
export {
  OfflineStorageAdapter,
  type PersistedRow,
  type PersistedMeta,
  type SyncStatus,
  type ChangeLog,
  type PersistResult,
  type RowVersionInfo
} from './offline-storage';

// Offline Service
export {
  OfflineService,
  type SyncCallback,
  type ConflictStrategy,
  type ConflictInfo,
  type ConflictResolver,
  type OfflineServiceConfig,
  type OfflineServiceEvents,
  type SyncResult
} from './offline-service';
