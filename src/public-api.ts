/**
 * ngx-datatable 公共 API
 */

// 模块
export { DataTableModule } from './datatable.module';

// 组件
export { DataTableComponent } from './datatable.component';
export type {
  ColumnConfig, TableConfig, TableState, ToolbarAction, RowAction,
  ChangeEvent, ExportConfig, ColumnFilterEvent, SortEvent,
  RowClickEvent, ToolbarEvent
} from './models';

// 服务
export { DataTableService } from './datatable.service';
export type { DataTableOptions } from './datatable.service';

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
} from './datastore';

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
} from './offline';
