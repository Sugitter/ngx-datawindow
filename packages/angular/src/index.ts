/**
 * @ngx-datawindow/angular
 *
 * Angular UI 组件和指令
 * 依赖 @angular/core, @angular/material, @angular/cdk
 */

// 导出主要组件
export {
  DataTableComponent,
  DataTableService,
  DataTableOptions,
  ColumnFilterEvent,
  SortEvent,
  RowClickEvent,
  ToolbarEvent,
} from '../../ngx-datawindow/src/lib/datatable.component';

// 导出配置类型
export {
  ColumnConfig,
  TableConfig,
  TableState,
  ToolbarAction,
  RowAction,
  ChangeEvent,
  ExportConfig,
  DataFeedConfig,
  HighlightCell,
  EditState,
} from '../../ngx-datawindow/src/lib/models';

// 导出渲染器
export {
  DataWindowRenderer,
  DisplayMode,
  DataWindowView,
  RendererState,
  ViewRow,
  ViewCell,
  RowType,
  RowStatus,
  createRenderer,
} from '../../ngx-datawindow/src/lib/renderer';

// 导出虚拟滚动策略
export {
  DataWindowVirtualScrollStrategy,
  dataWindowVirtualScrollStrategy,
} from '../../ngx-datawindow/src/lib/virtual-scroll-strategy';

// 重新导出核心类型供便捷访问
export {
  DataStoreImpl,
  DataStoreConfig,
  DataRow,
  RawValue,
} from '../../ngx-datawindow/src/lib/datastore';
