/**
 * ngx-datawindow Report Designer - 报表模板 Schema
 * 报表模板是声明式的 JSON，描述报表的布局、数据源、样式
 *
 * 架构理念：
 * 1. 报表由多个 Band（带区）组成，每个 Band 有固定高度和内容
 * 2. Band 内可以放置 ReportItem（报表项）
 * 3. ReportItem 支持 Expression（表达式）进行数据绑定和计算
 * 4. 框架无关：纯 TypeScript，无 Angular 依赖
 */

// ══════════════════════════════════════════════════════════════
// 报表模板根对象
// ══════════════════════════════════════════════════════════════

export interface ReportTemplate {
  /** 模板版本，用于未来兼容性升级 */
  version: string;

  /** 模板元信息 */
  meta: ReportMeta;

  /** 数据源配置 */
  dataSource: ReportDataSourceConfig;

  /** 页面设置 */
  page: ReportPageConfig;

  /** 报表带区列表（按渲染顺序排列） */
  bands: ReportBand[];

  /** 样式定义表（CSS-like named styles） */
  styles: Record<string, ReportStyle>;

  /** 报表参数（运行时可动态传入） */
  parameters: ReportParameter[];

  /** 分组配置 */
  groups: ReportGroup[];

  /** 排序配置 */
  sort: ReportSort[];
}

// ══════════════════════════════════════════════════════════════
// 元信息
// ══════════════════════════════════════════════════════════════

export interface ReportMeta {
  id?: string;
  name: string;
  description?: string;
  author?: string;
  createdAt?: string;   // ISO 8601
  updatedAt?: string;
  tags?: string[];
}

// ══════════════════════════════════════════════════════════════
// 数据源配置
// ══════════════════════════════════════════════════════════════

export interface ReportDataSourceConfig {
  /** 数据源名称（模板内唯一） */
  name: string;

  /** 数据源类型 */
  type: 'datastore' | 'api' | 'static';

  /** 字段列表（从 DataStore columns 自动推断，也可手动定义） */
  fields: ReportField[];

  /** 是否自动加载 DataStore 当前数据 */
  autoLoadData: boolean;

  /** 数据范围 */
  dataScope: 'all' | 'selected' | 'page';

  /** 预过滤表达式（Where 子句风格） */
  filter?: string;

  /** 默认聚合字段（可被 ReportItem 覆盖） */
  defaultAggregations?: Record<string, AggregationType>;
}

// ══════════════════════════════════════════════════════════════
// 字段定义
// ══════════════════════════════════════════════════════════════

export interface ReportField {
  /** 字段名（对应 DataStore column name） */
  name: string;

  /** 显示名称 */
  label?: string;

  /** 数据类型（用于格式化） */
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'currency';

  /** 数字/日期格式化模式 */
  format?: string;

  /** 默认对齐方式 */
  align?: 'left' | 'center' | 'right';

  /** 是否可为空 */
  nullable?: boolean;
}

// ══════════════════════════════════════════════════════════════
// 页面设置
// ══════════════════════════════════════════════════════════════

export interface ReportPageConfig {
  /** 纸张尺寸 */
  paperSize: 'A4' | 'A3' | 'A5' | 'Letter' | 'Legal' | 'Custom';

  /** 横向还是纵向 */
  orientation: 'portrait' | 'landscape';

  /** 纸张宽度（毫米，Custom 时使用） */
  paperWidth?: number;

  /** 纸张高度（毫米，Custom 时使用） */
  paperHeight?: number;

  /** 页边距 */
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
    /** 页眉边距 */
    header?: number;
    /** 页脚边距 */
    footer?: number;
  };

  /** 列数（用于多栏报表） */
  columns?: number;

  /** 列间距（毫米） */
  columnGap?: number;

  /** 是否打印页码 */
  printPageNumber?: boolean;

  /** 页码格式，例如 "第 {page} 页，共 {total} 页" */
  pageNumberFormat?: string;

  /** 是否打印创建时间 */
  printTimestamp?: boolean;
}

// ══════════════════════════════════════════════════════════════
// 带区（Band）
// ══════════════════════════════════════════════════════════════

export type BandType =
  | 'page-header'    // 每页顶部（列标题放这里）
  | 'report-header'   // 报表开头（只出现一次）
  | 'group-header'   // 分组头部（每组开始时出现）
  | 'data'            // 数据带（每行数据重复一次）
  | 'group-footer'   // 分组底部（每组结束时出现，可放小计）
  | 'report-footer'   // 报表末尾（只出现一次，可放总计）
  | 'page-footer';   // 每页底部（页码/版权放这里）

export interface ReportBand {
  /** 唯一 ID */
  id: string;

  /** 带区类型 */
  type: BandType;

  /** 显示名称（设计器中可见） */
  label?: string;

  /** 带区高度（像素，0 = 自动） */
  height: number;

  /** 是否打印在第一页 */
  printOnFirstPage?: boolean;

  /** 是否打印在最后一页 */
  printOnLastPage?: boolean;

  /** 是否可见 */
  visible?: boolean;

  /** 关联的分组 ID（type=group-header/group-footer 时必填） */
  groupId?: string;

  /** 带区内报表项 */
  items: ReportItem[];

  /** 是否显示分隔线 */
  separatorLine?: boolean;
}

// ══════════════════════════════════════════════════════════════
// 报表项（ReportItem）
// 放在 Band 内的所有元素都叫 ReportItem
// ══════════════════════════════════════════════════════════════

export type ReportItemType =
  | 'text'           // 静态文本
  | 'field'          // 数据字段（绑定到 DataStore 列）
  | 'computed'       // 计算字段（表达式）
  | 'image'          // 图片
  | 'line'           // 线条
  | 'rectangle'      // 矩形/边框
  | 'barcode'        // 条形码
  | 'qrcode'         // 二维码
  | 'chart'          // 图表
  | 'table'          // 表格（交叉表/矩阵）
  | 'subreport'       // 子报表
  | 'page-break';    // 分页符

export interface ReportItem {
  /** 唯一 ID */
  id: string;

  /** 报表项类型 */
  type: ReportItemType;

  /** 名称（用户友好，用于属性面板定位） */
  name?: string;

  /** 绝对位置（像素） */
  x: number;
  y: number;

  /** 尺寸（像素） */
  width: number;
  height: number;

  /** Z 层级（越大越在前） */
  zIndex?: number;

  /** 是否可见 */
  visible?: boolean;

  /** 所属带区 ID */
  bandId?: string;

  /** 样式名称（引用 styles{}） */
  style?: string;

  /** 内联样式（优先级高于 style） */
  styleInline?: ReportStyle;

  /** 类型特定配置 */
  config: ReportItemConfig;
}

// ══════════════════════════════════════════════════════════════
// 报表项配置（联合类型，根据 type 确定具体类型）
// ══════════════════════════════════════════════════════════════

export type ReportItemConfig =
  | TextItemConfig
  | FieldItemConfig
  | ComputedItemConfig
  | ImageItemConfig
  | LineItemConfig
  | RectangleItemConfig
  | BarcodeItemConfig
  | QrCodeItemConfig
  | ChartItemConfig
  | TableItemConfig
  | SubReportItemConfig
  | PageBreakItemConfig;

// ── 静态文本 ────────────────────────────────────────────────

export interface TextItemConfig {
  type: 'text';
  /** 文本内容（支持多行） */
  text: string;
  /** 富文本（HTML子集） */
  html?: string;
  /** 字号 */
  fontSize?: number;
  /** 字重 */
  fontWeight?: 'normal' | 'bold';
  /** 字体 */
  fontFamily?: string;
  /** 颜色 */
  color?: string;
  /** 对齐方式 */
  align?: 'left' | 'center' | 'right' | 'justify';
  /** 垂直对齐 */
  verticalAlign?: 'top' | 'middle' | 'bottom';
  /** 行高 */
  lineHeight?: number;
}

// ── 数据字段 ────────────────────────────────────────────────

export interface FieldItemConfig {
  type: 'field';
  /** 绑定的字段名 */
  field: string;
  /** 格式化模式（用于 number/date） */
  format?: string;
  /** 显示空值时的占位文本 */
  nullText?: string;
  /** 对齐方式 */
  align?: 'left' | 'center' | 'right';
  /** 颜色（可使用表达式动态指定） */
  color?: string;
  /** 背景色（可使用表达式动态指定） */
  backgroundColor?: string;
  /** 字体 */
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  fontFamily?: string;
}

// ── 计算字段 ────────────────────────────────────────────────

export interface ComputedItemConfig {
  type: 'computed';
  /** 表达式（见 expression-evaluator.ts 语法） */
  expression: string;
  /** 结果格式化 */
  format?: string;
  /** 数据类型（用于决定格式化） */
  dataType?: 'string' | 'number' | 'boolean' | 'date' | 'currency';
  /** 精度（number 类型） */
  precision?: number;
  /** 对齐方式 */
  align?: 'left' | 'center' | 'right';
  /** 字体样式 */
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  fontFamily?: string;
  color?: string;
  /** 空值处理 */
  nullText?: string;
}

// ── 图片 ─────────────────────────────────────────────────

export interface ImageItemConfig {
  type: 'image';
  /**图片来源 */
  source: 'url' | 'base64' | 'field' | 'embedded';
  /** 图片地址（source=url 时） */
  url?: string;
  /** Base64 字符串（source=base64 时） */
  base64?: string;
  /** 绑定的字段名（source=field 时，字段值是 URL 或 base64） */
  field?: string;
  /** 内嵌图片（source=embedded 时） */
  embedded?: string;  // data:image/png;base64,xxxxx
  /** 图片适应方式 */
  fit?: 'contain' | 'cover' | 'fill' | 'none';
  /** 水平对齐 */
  hAlign?: 'left' | 'center' | 'right';
  /** 垂直对齐 */
  vAlign?: 'top' | 'middle' | 'bottom';
  /** 圆角 */
  borderRadius?: number;
}

// ── 线条 ─────────────────────────────────────────────────

export interface LineItemConfig {
  type: 'line';
  /** 线方向 */
  direction: 'horizontal' | 'vertical';
  /** 线粗细 */
  thickness: number;
  /** 线条样式 */
  style: 'solid' | 'dashed' | 'dotted';
  /** 颜色 */
  color: string;
  /** 起点偏移（相对于 x） */
  startPadding?: number;
  /** 终点偏移（相对于 width） */
  endPadding?: number;
}

// ── 矩形 ─────────────────────────────────────────────────

export interface RectangleItemConfig {
  type: 'rectangle';
  /** 边框样式 */
  border?: {
    width?: number;
    color?: string;
    style?: 'solid' | 'dashed' | 'dotted';
    radius?: number;  // 圆角
  };
  /** 填充色 */
  fill?: string;
  /** 背景色（同 fill 别名） */
  backgroundColor?: string;
  /** 阴影 */
  shadow?: {
    offsetX?: number;
    offsetY?: number;
    blur?: number;
    color?: string;
  };
}

// ── 条形码 ────────────────────────────────────────────────

export type BarcodeFormat = 'CODE128' | 'CODE39' | 'EAN13' | 'EAN8' | 'UPC' | 'ITF' | 'CODABAR' | 'CODE93';

export interface BarcodeItemConfig {
  type: 'barcode';
  /** 条形码格式 */
  format: BarcodeFormat;
  /** 绑定的字段名或静态值 */
  value: string | { type: 'field'; field: string } | { type: 'expression'; expr: string };
  /** 条形码高度 */
  height?: number;
  /** 是否显示文字 */
  showText?: boolean;
  /** 背景色 */
  backgroundColor?: string;
  /** 条形码颜色 */
  barColor?: string;
}

// ── 二维码 ────────────────────────────────────────────────

export interface QrCodeItemConfig {
  type: 'qrcode';
  /** 内容来源 */
  value: string | { type: 'field'; field: string } | { type: 'expression'; expr: string };
  /** 纠错级别 */
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  /** 版本/尺寸 */
  version?: number;
  /** 是否显示文字 */
  showText?: boolean;
  backgroundColor?: string;
  barColor?: string;
}

// ── 图表 ─────────────────────────────────────────────────

export interface ChartItemConfig {
  type: 'chart';
  /** 图表类型 */
  chartType: 'bar' | 'line' | 'pie' | 'doughnut' | 'radar' | 'polarArea' | 'scatter' | 'bubble';

  /** X 轴字段 */
  xField: string;

  /** Y 轴字段（支持多系列） */
  yFields: string[];

  /** 系列名称映射 */
  seriesLabels?: Record<string, string>;

  /** 聚合方式 */
  aggregation?: AggregationType;

  /** 分组字段（用于分组柱状图等） */
  groupField?: string;

  /** 是否显示图例 */
  showLegend?: boolean;

  /** 图例位置 */
  legendPosition?: 'top' | 'bottom' | 'left' | 'right';

  /** 是否显示数据标签 */
  showDataLabels?: boolean;

  /** 是否 3D（如果图表库支持） */
  threeDimensional?: boolean;

  /** 配色方案 */
  colorScheme?: string[];

  /** 图表标题 */
  title?: string;

  /** X 轴标题 */
  xAxisTitle?: string;

  /** Y 轴标题 */
  yAxisTitle?: string;

  /** 高度（像素） */
  height?: number;
}

// ── 表格（交叉表/矩阵）─────────────────────────────────────

export interface TableItemConfig {
  type: 'table';
  /** 列定义 */
  columns: TableColumn[];

  /** 表头行配置 */
  headerRow?: {
    visible?: boolean;
    height?: number;
    style?: string;
  };

  /** 数据行配置 */
  dataRow?: {
    height?: number;
    alternatingColors?: boolean;   // 斑马纹
    alternatingColor?: string;       // 斑马纹颜色
  };

  /** 合计行 */
  summaryRow?: {
    visible?: boolean;
    height?: number;
    /** 合计方式 */
    aggregation: Record<string, AggregationType>;
    label?: string;
  };

  /** 边框样式 */
  border?: {
    outer?: { width?: number; color?: string; style?: 'solid' | 'dashed' };
    inner?: { width?: number; color?: string; style?: 'solid' | 'dashed' };
  };

  /** 高度（0=自动） */
  height?: number;

  /** 最大行数（0=不限制） */
  maxRows?: number;
}

export interface TableColumn {
  /** 字段名 */
  field: string;
  /** 列标题 */
  header: string;
  /** 列宽（像素或百分比） */
  width: string | number;
  /** 文本对齐 */
  align?: 'left' | 'center' | 'right';
  /** 格式化 */
  format?: string;
  /** 聚合类型 */
  aggregate?: AggregationType;
  /** 是否可排序（预览时） */
  sortable?: boolean;
  /** 可见性 */
  visible?: boolean;
}

// ── 子报表 ────────────────────────────────────────────────

export interface SubReportItemConfig {
  type: 'subreport';
  /** 引用的子报表模板 ID */
  templateId?: string;
  /** 子报表模板 JSON（内联时使用） */
  template?: ReportTemplate;
  /** 数据源字段（用于传参给子报表） */
  dataField?: string;
  /** 子报表参数 */
  parameters?: Record<string, string | { type: 'field'; field: string } | { type: 'expression'; expr: string }>;
  /** 高度（0=自动） */
  height?: number;
}

// ── 分页符 ────────────────────────────────────────────────

export interface PageBreakItemConfig {
  type: 'page-break';
  /** 条件分页（表达式为 true 时分页） */
  condition?: { type: 'expression'; expr: string };
}

// ══════════════════════════════════════════════════════════════
// 样式定义
// ══════════════════════════════════════════════════════════════

export interface ReportStyle {
  name: string;
  /** 字体 */
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  /** 颜色 */
  color?: string;
  backgroundColor?: string;
  /** 对齐 */
  align?: 'left' | 'center' | 'right' | 'justify';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  /** 边框 */
  border?: {
    top?: { width?: number; color?: string; style?: 'solid' | 'dashed' | 'dotted' };
    right?: { width?: number; color?: string; style?: 'solid' | 'dashed' | 'dotted' };
    bottom?: { width?: number; color?: string; style?: 'solid' | 'dashed' | 'dotted' };
    left?: { width?: number; color?: string; style?: 'solid' | 'dashed' | 'dotted' };
  };
  /** 内边距 */
  padding?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  /** 行高 */
  lineHeight?: number;
  /** 文字装饰 */
  textDecoration?: 'none' | 'underline' | 'line-through';
}

// ══════════════════════════════════════════════════════════════
// 报表参数
// ══════════════════════════════════════════════════════════════

export interface ReportParameter {
  name: string;
  label?: string;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'select';
  /** 默认值（支持表达式） */
  defaultValue?: string | number | boolean | { type: 'expression'; expr: string };
  /** 提示文本 */
  placeholder?: string;
  /** 可选值列表（dataType=select 时使用） */
  options?: { value: string; label: string }[];
  /** 是否必填 */
  required?: boolean;
}

// ══════════════════════════════════════════════════════════════
// 分组配置
// ══════════════════════════════════════════════════════════════

export interface ReportGroup {
  id: string;
  /** 分组字段 */
  field: string;
  /** 显示名称（用作分组头文本） */
  label?: string;
  /** 是否默认折叠 */
  defaultCollapsed?: boolean;
  /** 是否显示分组计数 */
  showCount?: boolean;
  /** 计数文本模板，例如 "{count} 条记录" */
  countTemplate?: string;
  /** 分组排序（asc | desc | none） */
  sort?: 'asc' | 'desc' | 'none';
}

// ══════════════════════════════════════════════════════════════
// 排序配置
// ══════════════════════════════════════════════════════════════

export interface ReportSort {
  field: string;
  direction: 'asc' | 'desc';
}

// ══════════════════════════════════════════════════════════════
// 聚合类型
// ══════════════════════════════════════════════════════════════

export type AggregationType = 'sum' | 'avg' | 'count' | 'count-distinct' | 'min' | 'max' | 'first' | 'last' | 'median' | 'stddev';

// ══════════════════════════════════════════════════════════════
// 辅助工具函数
// ══════════════════════════════════════════════════════════════

/** 创建空白报表模板 */
export function createEmptyTemplate(name: string): ReportTemplate {
  return {
    version: '1.0.0',
    meta: {
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    dataSource: {
      name: 'DataSource1',
      type: 'datastore',
      fields: [],
      autoLoadData: true,
      dataScope: 'all',
    },
    page: {
      paperSize: 'A4',
      orientation: 'portrait',
      margin: { top: 20, right: 20, bottom: 20, left: 20 },
      printPageNumber: true,
      pageNumberFormat: '第 {page} 页，共 {total} 页',
      printTimestamp: false,
    },
    bands: [
      {
        id: 'report-header-1',
        type: 'report-header',
        label: '报表标题',
        height: 60,
        visible: true,
        items: [],
      },
      {
        id: 'page-header-1',
        type: 'page-header',
        label: '列标题',
        height: 40,
        visible: true,
        items: [],
      },
      {
        id: 'data-1',
        type: 'data',
        label: '数据明细',
        height: 30,
        visible: true,
        items: [],
      },
      {
        id: 'report-footer-1',
        type: 'report-footer',
        label: '报表汇总',
        height: 40,
        visible: true,
        items: [],
      },
      {
        id: 'page-footer-1',
        type: 'page-footer',
        label: '页脚',
        height: 30,
        visible: true,
        items: [],
      },
    ],
    styles: {
      'default': {
        name: 'default',
        fontFamily: 'Microsoft YaHei, sans-serif',
        fontSize: 12,
        color: '#000000',
        align: 'left',
      },
      'title': {
        name: 'title',
        fontFamily: 'Microsoft YaHei, sans-serif',
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a1a1a',
        align: 'center',
      },
      'header': {
        name: 'header',
        fontFamily: 'Microsoft YaHei, sans-serif',
        fontSize: 12,
        fontWeight: 'bold',
        color: '#ffffff',
        backgroundColor: '#3f51b5',
        align: 'center',
      },
      'money': {
        name: 'money',
        fontSize: 12,
        align: 'right',
      },
    },
    parameters: [],
    groups: [],
    sort: [],
  };
}

/** 从 DataStore columns 生成字段定义 */
export function fieldsFromColumns(columns: { field: string; header?: string; dataType?: string }[]): ReportField[] {
  return columns.map(col => ({
    name: col.field,
    label: col.header ?? col.field,
    dataType: (col.dataType as ReportField['dataType']) ?? 'string',
  }));
}
