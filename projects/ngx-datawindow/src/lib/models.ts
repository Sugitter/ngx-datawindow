import { Observable } from 'rxjs';
import { RawValue } from './datastore';

/**
 * 列配置模型
 * 用于配置表格列的显示和行为
 */

export interface ColumnConfig<T = unknown> {
  /** 字段名（对应数据对象的属性） */
  field: string;

  /** 显示名称 */
  header: string;

  /** 列宽度 */
  width?: string;

  /** 最小宽度 */
  minWidth?: string;

  /** 排序字段（可以为表达式） */
  sortField?: string;

  /** 格式化函数 */
  format?: (value: T, row: T) => string;

  /** 自定义单元格模板 */
  cellTemplate?: string;

  /** 是否可排序 */
  sortable?: boolean;

  /** 是否可过滤 */
  filterable?: boolean;

  /** 过滤类型 */
  filterType?: 'text' | 'number' | 'select' | 'date' | 'boolean';

  /** 过滤选项（用于 select 类型） */
  filterOptions?: { value: unknown; label: string }[];

  /** 是否可编辑 */
  editable?: boolean;

  /** 编辑类型 */
  editType?: 'text' | 'number' | 'select' | 'date' | 'checkbox' | 'textarea';

  /** 编辑选项（用于 select 类型） */
  editOptions?: { value: unknown; label: string }[];

  /** 是否显示 */
  visible?: boolean;

  /** 列对齐方式 */
  align?: 'left' | 'center' | 'right';

  /** 固定列（start | end | null） — 实现 sticky 冻结列 */
  sticky?: 'start' | 'end' | null;

  /** 固定位置索引 */
  stickyIndex?: number;

  /** 虚拟列（不实际存储，只计算显示） */
  virtual?: boolean;

  /** 聚合显示 */
  aggregate?: {
    /** 聚合类型 */
    type: 'sum' | 'avg' | 'count' | 'min' | 'max';
    /** 精度（用于 number 类型） */
    precision?: number;
  };

  /** 元数据 */
  metadata?: Record<string, unknown>;

  /** 自定义单元格 HTML 渲染器，返回 HTML 字符串（会通过 innerHTML 渲染） */
  cellRenderer?: (value: any, row: any) => string;

  /** 自定义单元格样式，返回 CSS 样式对象 */
  cellStyle?: (value: any, row: any) => Record<string, string>;

  /** 自定义单元格 CSS 类 */
  cellClass?: (value: any, row: any) => string;
}

/** 表格配置 */
export interface TableConfig {
  /** 表格 ID */
  id?: string;

  /** 表格标题 */
  title?: string;

  /** 是否显示标题栏 */
  showTitle?: boolean;

  /** 是否显示工具栏 */
  showToolbar?: boolean;

  /** 是否显示分页器 */
  showPaginator?: boolean;

  /** 是否显示列过滤 */
  showColumnFilter?: boolean;

  /** 是否显示全局搜索 */
  showGlobalSearch?: boolean;

  /** 工具栏按钮配置 */
  toolbarActions?: {
    /** 新增按钮 */
    add?: boolean | { icon?: string; label?: string };
    /** 删除按钮 */
    delete?: boolean | { icon?: string; label?: string };
    /** 刷新按钮 */
    refresh?: boolean | { icon?: string; label?: string };
    /** 导出按钮 */
    export?: boolean | { icon?: string; label?: string; formats?: string[] };
    /** 导入按钮 */
    import?: boolean | { icon?: string; label?: string };
    /** 自定义按钮 */
    custom?: Array<{ id: string; icon?: string; label: string; action: string }>;
  };

  /** 行选择模式 */
  selectionMode?: 'none' | 'single' | 'multiple';

  /** 多选模式下是否启用点击选中（点击行直接切换选中状态）*/
  multiClick?: boolean;

  /** 多选模式下是否启用范围选择（Shift+点击选中两个行之间的所有行）*/
  rangeSelect?: boolean;

  /** 是否启用键盘导航（ArrowUp/Down 移动焦点，Enter 编辑，Tab 切换字段，Ctrl+A 全选），默认 true */
  keyboardNavigation?: boolean;

  /** 行分组配置（按字段分组显示） */
  groupBy?: {
    /** 分组字段 */
    field: string;
    /** 分组标题模板 */
    titleTemplate?: (groupValue: any, count: number) => string;
    /** 是否默认折叠 */
    collapsed?: boolean;
  };

  /** 树形展示配置（树状数据展开/折叠） */
  treeField?: {
    /** 树层级字段（如 children） */
    childrenField: string;
    /** 树层级缩进宽度（px） */
    indentWidth?: number;
    /** 是否默认展开所有 */
    expandAll?: boolean;
    /** 展开/折叠图标 */
    expandIcon?: string;
    /** 折叠/展开图标 */
    collapseIcon?: string;
  };

  /** 行样式函数 */
  rowClass?: (row: unknown) => string | Record<string, boolean>;

  /** 行点击事件 */
  rowClick?: boolean | ((row: unknown, event: Event) => void);

  /** 行双击事件 */
  rowDoubleClick?: boolean | ((row: unknown, event: Event) => void);

  /** 空数据提示 */
  emptyMessage?: string;

  /** 加载状态提示 */
  loadingMessage?: string;

  /** 分页配置 */
  pagination?: {
    /** 每页选项 */
    pageSizeOptions?: number[];
    /** 默认每页数量 */
    defaultPageSize?: number;
    /** 是否显示每页数量选择器 */
    showPageSizeSelector?: boolean;
    /** 是否显示总数 */
    showTotalCount?: boolean;
  };

  /** 工具栏高度 */
  toolbarHeight?: string;

  /** 表头高度 */
  headerHeight?: string;

  /** 行高度 */
  rowHeight?: string;

  /** 虚拟滚动配置 */
  virtualScroll?: {
    /** 是否启用虚拟滚动 */
    enabled: boolean;
    /** 估算行高（px），用于计算缓冲区大小 */
    rowHeight?: number;
    /** 缓冲区行数（上下各渲染多少额外行） */
    bufferSize?: number;
    /** 最小渲染行数 */
    minBufferSize?: number;
    /** 最大渲染行数（防止一次渲染过多） */
    maxBufferSize?: number;
  };

  /** 响应式配置 */
  responsive?: {
    /** 响应式断点 */
    breakpoints?: { [key: string]: { visibleColumns: string[]; priority: number[] } };
  };

  /** 自适应高度（不限制最大高度，表格按内容撑开） */
  autoHeight?: boolean;

  /** 固定最大高度（仅 autoHeight=false 时生效，默认 480px） */
  maxHeight?: string;
}

/** 编辑状态 */
export interface EditState {
  rowId: number;
  field: string;
  originalValue: unknown;
  newValue: unknown;
}

/** 表格状态 */
export interface TableState {
  /** 当前页码 */
  pageIndex: number;

  /** 每页数量 */
  pageSize: number;

  /** 排序字段 */
  sortField?: string;

  /** 排序方向 */
  sortDirection?: 'asc' | 'desc';

  /** 全局搜索关键词 */
  globalSearch?: string;

  /** 焦点行 ID */
  focusedRowId?: number | null;

  /** 列过滤条件 */
  columnFilters: Record<string, unknown>;

  /** 选中的行 */
  selectedRows: Set<number>;

  /** 当前编辑状态 */
  editingCell?: EditState;

  /** 是否加载中 */
  loading: boolean;
}

/** 工具栏事件 */
export interface ToolbarAction {
  type: 'add' | 'delete' | 'refresh' | 'export' | 'custom';
  id?: string;
  payload?: unknown;
}

/** 行事件 */
export interface RowAction<T = unknown> {
  type: 'click' | 'doubleClick' | 'edit' | 'delete';
  row: T;
  rowId: number;
  field?: string;
}

/** 变更事件 */
export interface ChangeEvent<T = unknown> {
  type: 'add' | 'update' | 'delete' | 'bulk';
  rows: T[];
  fields?: string[];
}

/** 导出配置 */
export interface ExportConfig {
  format: 'csv' | 'xlsx' | 'json' | 'xml';
  filename?: string;
  sheetName?: string;
  includeHeaders?: boolean;
  includeFilters?: boolean;
  exportSelectedOnly?: boolean;
}

/**
 * 实时数据接入配置
 * 支持 WebSocket/SSE/Observable 数据源
 */
export interface DataFeedConfig<T = unknown> {
  /** 数据源 Observable */
  source: Observable<T>;

  /** 更新模式 */
  mode: 'replace' | 'merge' | 'append';

  /** 唯一标识字段（merge/append 模式必需） */
  keyField?: string;

  /** 高亮时长(ms)，默认 500 */
  highlightDuration?: number;

  /** 批量合并间隔(ms)，默认 100，高频推送时合并 */
  batchInterval?: number;

  /** 是否自动滚动到底部（append 模式） */
  autoScroll?: boolean;

  /** 数据转换函数（可选） */
  transform?: (data: T) => Record<string, RawValue>[] | null;
}

/** 实时数据更新事件 */
export interface DataUpdateEvent {
  /** 更新模式 */
  mode: 'replace' | 'merge' | 'append';
  /** 新增行数组 */
  rows: Record<string, RawValue>[];
  /** 更新的行 IDs（merge 模式） */
  updatedIds?: number[];
  /** 是否首次加载 */
  initial?: boolean;
}

/** 高亮单元格状态 */
export interface HighlightCell {
  rowId: number;
  field: string;
  timestamp: number;
  value: RawValue;
}