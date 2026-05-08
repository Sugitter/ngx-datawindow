/**
 * ngx-datawindow 库主入口
 * 提供所有公开 API 的统一导出
 *
 * 使用方式：
 * import { DataTableComponent } from 'ngx-datawindow';
 * import { DataStoreImpl } from 'ngx-datawindow';
 */
export * from './datatable.component';
export * from './datatable.service';
export * from './datastore';
export * from './models';
export * from './adapter';
export * from './virtual-scroll-strategy';
export * from './offline';
export * from './renderer';

// ── 补充导出 renderer 模块 ──────────────────────────────────────────────────
export {
  DataWindowRenderer,
  DisplayMode,
  DataWindowView,
  RendererState,
  ViewRow,
  ViewCell,
  RowType,
  RowStatus,
  ColumnConfig as RendererColumnConfig,
} from './renderer/renderer';

export { GridRenderer } from './renderer/grid-renderer';
export { GroupRenderer } from './renderer/group-renderer';
export { TreeRenderer } from './renderer/tree-renderer';
export { createRenderer } from './renderer/index';

// ── Report Designer ────────────────────────────────────────────────────────
// ⚠️ 依赖 Angular Material（需在宿主项目中安装 @angular/material + @angular/cdk）
export * from './report-designer';
