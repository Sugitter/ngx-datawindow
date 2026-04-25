/**
 * ngx-datatable 公共 API
 */

// 模块
export { DataTableModule } from './lib/datatable.module';

// 组件
export { DataTableComponent } from './lib/datatable.component';
export type {
  ColumnFilterEvent, SortEvent, RowClickEvent, ToolbarEvent
} from './lib/datatable.component';
export type {
  ColumnConfig, TableConfig, TableState, ToolbarAction, RowAction,
  ChangeEvent, ExportConfig
} from './lib/models';

// 服务
export { DataTableService } from './lib/datatable.service';
export type { DataTableOptions } from './lib/datatable.service';

// DataStore 引擎
export {
  DataStoreImpl, DataStoreEngine, DataStoreConfig, DataStoreEvent,
  DataStoreEventType, FieldDefinition,
  FilterCondition, SortRule, GroupRule, DuplicateRule,
  AggregationFormula, AggregationResult,
  AggregationType, FilterOperator, FilterEvaluator,
  QueryOptions, QueryResult, ValidationResult, ValidationError,
  UpdateData, BufferStats, BufferType, RowStatus,
  DataRow, RawValue, RowId, RowNumber, FieldName,
  globalEngine, createDataStore
} from './lib/datastore';

// 离线持久化（Phase 2）
export {
  IndexedDBManager, defaultDB,
  OfflineStorageAdapter,
  OfflineService,
  DB_CONFIG, STORE_CONFIG,
  type DBState, type IDBResult, type TransactionMode,
  type PersistedRow, type PersistedMeta, type SyncStatus,
  type ChangeLog, type PersistResult,
  type SyncCallback, type ConflictStrategy, type ConflictInfo,
  type ConflictResolver, type OfflineServiceConfig,
  type OfflineServiceEvents, type SyncResult
} from './lib/offline';
