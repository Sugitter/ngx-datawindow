/**
 * @ngx-datawindow/core
 *
 * 核心数据引擎，无 Angular 依赖
 * 适用于非 Angular 项目或服务端渲染
 */

// 从主库重新导出核心类型和引擎
export {
  // DataStore 引擎
  DataStoreImpl,
  DataStoreConfig,
  DataStoreEvent,
  DataStoreEventType,
  DataRow,
  RowId,
  RawValue,
  BufferType,
  
  // 类型定义
  FieldDefinition,
  FilterCondition,
  SortRule,
  GroupRule,
  QueryOptions,
  QueryResult,
  AggregationFormula,
  AggregationResult,
  ValidationResult,
  UpdateData,
  
  // 事件类型
  ItemChangedEvent,
  ItemChangedAction,
  ItemChangedReason,
  SaveStartEvent,
  SaveEndEvent,
  
  // 工具类
  UndoStackManager,
  AggregatorImpl,
  FilterEvaluator,
  Sorter,
  
  // 命令类型
  Command,
  CommandType,
  UndoStack,
} from '../../ngx-datawindow/src/lib/datastore';

// 导出离线存储 API
export {
  OfflineService,
  IndexedDBManager,
  OfflineServiceConfig,
  OfflineServiceEvents,
  SyncResult,
  ConflictInfo,
  ConflictStrategy,
} from '../../ngx-datawindow/src/lib/offline';
