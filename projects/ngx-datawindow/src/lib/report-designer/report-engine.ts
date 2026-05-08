/**
 * 报表渲染引擎 — ngx-datawindow Report Designer
 *
 * 框架无关的纯 TypeScript 引擎
 * 接收 ReportTemplate + DataStore 数据，输出分层渲染树
 *
 * 渲染管线：
 *   ReportTemplate ──→ ReportEngine ──→ ReportPages ──→ ReportPage ──→ ReportSection ──→ ReportRow ──→ ReportCell
 *                            ↑                                        ↑
 *                       DataStore 数据                              渲染器适配器
 */

import {
  ReportTemplate, ReportBand, ReportItem, ReportStyle,
  ReportGroup, AggregationType,
} from './report-template.model';
import { expressionEvaluator, EvalContext } from './expression-evaluator';
import { DataStoreImpl } from '../datastore';

// ══════════════════════════════════════════════════════════════
// 渲染上下文（一次性报表渲染的状态）
// ══════════════════════════════════════════════════════════════

export interface RenderContext {
  /** 当前报表模板 */
  template: ReportTemplate;
  /** DataStore 实例（用于读取数据） */
  store: DataStoreImpl;
  /** 报表参数（用户运行时输入） */
  params: Record<string, unknown>;
  /** 页面宽度（像素） */
  pageWidth: number;
  /** 页面高度（像素） */
  pageHeight: number;
  /** 当前页码 */
  pageNumber: number;
  /** 总页数（渲染完才知道） */
  totalPages: number;
  /** 渲染时间戳 */
  timestamp: Date;
  /** 表达式格式化器 */
  formatFn?: (value: unknown, pattern?: string, dataType?: string) => string;
}

export interface BandContext {
  /** 当前 Band */
  band: ReportBand;
  /** 当前行数据（Data Band 中为当前行） */
  row?: Record<string, unknown>;
  /** 当前行索引 */
  rowIndex: number;
  /** 当前分组键值 */
  groupKey?: string;
  /** 聚合缓存（当前分组内所有行） */
  groupRows?: Record<string, unknown>[];
  /** 是否是第一个分组 */
  isFirstGroup?: boolean;
  /** 是否是最后一个分组 */
  isLastGroup?: boolean;
}

// ══════════════════════════════════════════════════════════════
// 输出模型
// ══════════════════════════════════════════════════════════════

/** 渲染结果：多页报表 */
export interface ReportPages {
  pages: ReportPage[];
  totalPages: number;
  totalRows: number;
  renderTime: number;
  pageWidth: number;
  pageHeight: number;
}

/** 单页报表 */
export interface ReportPage {
  pageNumber: number;
  sections: ReportSection[];
  pageNumberText: string;
  timestampText: string;
}

/** 带区节 */
export interface ReportSection {
  band: ReportBand;
  bandType: string;
  rows: ReportRow[];
  height: number;
  isPageBreakBefore: boolean;
}

/** 报表行 */
export interface ReportRow {
  index: number;
  type: 'header' | 'data' | 'summary' | 'separator';
  cells: ReportCell[];
  height: number;
  rowIndex?: number;
  groupKey?: string;
  raw?: Record<string, unknown>;
}

/** 报表单元格 */
export interface ReportCell {
  item: ReportItem;
  /** 计算后的文本值 */
  text: string;
  /** 原始值 */
  value: unknown;
  /** 样式（合并后） */
  style: ResolvedStyle;
  /** 是否高亮 */
  highlighted: boolean;
  /** 合并列数 */
  colspan: number;
  /** 绑定到哪个字段 */
  binding?: string;
  /** 图表数据（chart 类型） */
  chartData?: ChartRenderData;
}

/** 计算后的样式 */
export interface ResolvedStyle {
  name: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  color: string;
  backgroundColor: string;
  align: string;
  verticalAlign: string;
  padding: { top: number; right: number; bottom: number; left: number };
  border: {
    top: { width: number; color: string; style: 'solid' | 'dashed' | 'dotted' | string };
    right: { width: number; color: string; style: 'solid' | 'dashed' | 'dotted' | string };
    bottom: { width: number; color: string; style: 'solid' | 'dashed' | 'dotted' | string };
    left: { width: number; color: string; style: 'solid' | 'dashed' | 'dotted' | string };
  };
}

/** 图表渲染数据 */
export interface ChartRenderData {
  chartType: string;
  labels: string[];
  datasets: { label: string; data: number[]; backgroundColor?: string[] }[];
  title?: string;
}

// ══════════════════════════════════════════════════════════════
// 核心引擎
// ══════════════════════════════════════════════════════════════

export class ReportEngine {
  private _ctx!: RenderContext;
  private _aggregations: Map<string, Map<string, number>> = new Map(); // field → groupKey → value

  /**
   * 渲染报表
   * @param template 报表模板
   * @param store DataStore 实例（从中获取数据）
   * @param params 运行时参数
   */
  render(template: ReportTemplate, store: DataStoreImpl, params: Record<string, unknown> = {}): ReportPages {
    const start = performance.now();

    // 计算页面尺寸（毫米转像素，假设 96 DPI）
    const dpi = 96;
    const mmToPx = (mm: number) => Math.round(mm / 25.4 * dpi);

    const paperSize = template.page.paperSize;
    let pageWidth = mmToPx(paperSize === 'A4' ? 210 :
      paperSize === 'A3' ? 297 :
      paperSize === 'A5' ? 148 :
      paperSize === 'Letter' ? 215.9 :
      paperSize === 'Legal' ? 355.6 : 210);
    let pageHeight = mmToPx(paperSize === 'A4' ? 297 :
      paperSize === 'A3' ? 420 :
      paperSize === 'A5' ? 210 :
      paperSize === 'Letter' ? 279.4 :
      paperSize === 'Legal' ? 431.8 : 297);

    if (template.page.orientation === 'landscape') {
      [pageWidth, pageHeight] = [pageHeight, pageWidth];
    }

    const m = template.page.margin;
    const innerWidth = pageWidth - mmToPx(m.left + m.right);

    this._ctx = {
      template,
      store,
      params,
      pageWidth,
      pageHeight,
      pageNumber: 0,
      totalPages: 0,
      timestamp: new Date(),
      formatFn: undefined,
    };

    // 预计算所有聚合
    this._precomputeAggregations(store, template);

    // 收集全部页面节（分组 + 数据行分页）
    const allSections = this._buildAllSections();

    // 按页分割
    const pages = this._paginate(allSections, innerWidth);

    const totalPages = pages.length;

    // 填充总页数
    for (let i = 0; i < pages.length; i++) {
      pages[i].pageNumber = i + 1;
    }

    this._ctx.totalPages = totalPages;

    // 生成页码文本
    for (const page of pages) {
      page.pageNumberText = this._formatPageNumber(page.pageNumber, totalPages);
      page.timestampText = this._ctx.timestamp.toLocaleString('zh-CN');
    }

    return {
      pages,
      totalPages,
      totalRows: store.getRows().length,
      renderTime: performance.now() - start,
      pageWidth,
      pageHeight,
    };
  }

  // ══════════════════════════════════════════════════════════════
  // 聚合预计算（只算一次）
  // ══════════════════════════════════════════════════════════════

  private _precomputeAggregations(store: DataStoreImpl, template: ReportTemplate): void {
    const allRows: Record<string, unknown>[] = store.getRows().map(r => (r as any).raw ?? r);

    // 全局聚合
    const globalKey = '__global__';
    this._aggregations.set(globalKey, new Map());

    const fields = new Set<string>();
    for (const row of allRows) {
      for (const key of Object.keys(row)) {
        fields.add(key);
      }
    }

    for (const field of fields) {
      const vals = allRows.map((r: any) => Number(r[field]) || 0);
      const sum = vals.reduce((a: number, b: number) => a + b, 0);
      const count = vals.filter((v: number) => !isNaN(v)).length;
      const min = Math.min(...vals.filter((v: number) => !isNaN(v)));
      const max = Math.max(...vals.filter((v: number) => !isNaN(v)));

      this._aggregations.get(globalKey)!.set(`${field}_sum`, sum);
      this._aggregations.get(globalKey)!.set(`${field}_avg`, count > 0 ? sum / count : 0);
      this._aggregations.get(globalKey)!.set(`${field}_count`, count);
      this._aggregations.get(globalKey)!.set(`${field}_min`, min);
      this._aggregations.get(globalKey)!.set(`${field}_max`, max);
      this._aggregations.get(globalKey)!.set(`${field}_first`, vals[0] ?? 0);
      this._aggregations.get(globalKey)!.set(`${field}_last`, vals[vals.length - 1] ?? 0);
    }

    // 分组聚合
    for (const group of template.groups) {
      const grouped = this._groupRows(allRows, group.field);
      for (const [key, groupRows] of Object.entries(grouped)) {
        this._aggregations.set(key, new Map());

        for (const field of fields) {
          const vals: number[] = (groupRows as Record<string, unknown>[]).map((r: any) => Number(r[field]) || 0);
          const sum = vals.reduce((a: number, b: number) => a + b, 0);
          const count = vals.filter((v: number) => !isNaN(v)).length;
          this._aggregations.get(key)!.set(`${field}_sum`, sum);
          this._aggregations.get(key)!.set(`${field}_avg`, count > 0 ? sum / count : 0);
          this._aggregations.get(key)!.set(`${field}_count`, count);
        }
      }
    }
  }

  private _groupRows(rows: Record<string, unknown>[], field: string): Record<string, Record<string, unknown>[]> {
    const groups: Record<string, Record<string, unknown>[]> = {};
    for (const row of rows) {
      const key = String(row[field] ?? '(null)');
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    }
    return groups;
  }

  // ══════════════════════════════════════════════════════════════
  // 构建全部节（展开分组 + 数据行）
  // ══════════════════════════════════════════════════════════════

  private _buildAllSections(): ReportSection[] {
    const template = this._ctx.template;
    const store = this._ctx.store;
    const allRows: Record<string, unknown>[] = store.getRows().map((r: any) => (r as any).raw ?? r);
    const sections: ReportSection[] = [];

    // 报表头部
    const reportHeader = template.bands.find(b => b.type === 'report-header');
    if (reportHeader) {
      sections.push(this._buildBandSection(reportHeader, {}));
    }

    // 分组处理
    if (template.groups.length > 0) {
      // 简化处理：只支持单层分组
      const group = template.groups[0];
      const grouped = this._groupRows(allRows, group.field);
      const keys = Object.keys(grouped).sort();

      for (let gi = 0; gi < keys.length; gi++) {
        const groupKey = keys[gi];
        const groupRows = grouped[groupKey];

        // 分组头
        const groupHeader = template.bands.find(b => b.type === 'group-header' && b.groupId === group.id);
        if (groupHeader) {
          const section = this._buildBandSection(groupHeader, {}, groupKey, groupRows, gi === 0);
          sections.push(section);
        }

        // 数据行
        const dataBand = template.bands.find(b => b.type === 'data');
        if (dataBand) {
          for (let ri = 0; ri < groupRows.length; ri++) {
            const section = this._buildBandSection(dataBand, groupRows[ri], groupKey, groupRows);
            section.rows[0].rowIndex = ri;
            sections.push(section);
          }
        }

        // 分组尾
        const groupFooter = template.bands.find(b => b.type === 'group-footer' && b.groupId === group.id);
        if (groupFooter) {
          const section = this._buildBandSection(groupFooter, {}, groupKey, groupRows, false, gi === keys.length - 1);
          sections.push(section);
        }
      }
    } else {
      // 无分组：直接渲染数据行
      const dataBand = template.bands.find(b => b.type === 'data');
      if (dataBand) {
        for (let ri = 0; ri < allRows.length; ri++) {
          const section = this._buildBandSection(dataBand, allRows[ri], undefined, allRows);
          section.rows[0].rowIndex = ri;
          sections.push(section);
        }
      }
    }

    // 报表尾部
    const reportFooter = template.bands.find(b => b.type === 'report-footer');
    if (reportFooter) {
      sections.push(this._buildBandSection(reportFooter, {}, undefined, allRows));
    }

    return sections;
  }

  private _buildBandSection(
    band: ReportBand,
    row: Record<string, unknown>,
    groupKey?: string,
    groupRows?: Record<string, unknown>[],
    isFirstGroup?: boolean,
    isLastGroup?: boolean,
  ): ReportSection {
    const sections: ReportSection = {
      band,
      bandType: band.type,
      rows: [],
      height: band.height,
      isPageBreakBefore: false,
    };

    // 分隔线行
    if (band.separatorLine) {
      sections.rows.push({
        index: 0,
        type: 'separator',
        cells: [],
        height: 1,
      });
    }

    // 报表项行（所有项排成一行）
    if (band.items.length > 0) {
      const rowCells = band.items
        .filter(item => item.visible !== false)
        .map(item => this._resolveItem(item, row, groupKey, groupRows));

      const dataRow: ReportRow = {
        index: sections.rows.length,
        type: band.type === 'report-footer' || band.type === 'group-footer' ? 'summary' : 'data',
        cells: rowCells,
        height: band.height,
        groupKey,
        raw: row,
      };

      sections.rows.push(dataRow);
    }

    return sections;
  }

  // ══════════════════════════════════════════════════════════════
  // 解析单个报表项
  // ══════════════════════════════════════════════════════════════

  private _resolveItem(
    item: ReportItem,
    row: Record<string, unknown>,
    groupKey?: string,
    groupRows?: Record<string, unknown>[],
  ): ReportCell {
    const evalCtx: EvalContext = {
      row,
      rows: groupRows ?? this._ctx.store.getRows().map((r: any) => (r as any).raw ?? r),
      rowIndex: 0,
      params: this._ctx.params,
      format: this._ctx.formatFn,
    };

    let text = '';
    let value: unknown = null;
    let binding: string | undefined;

    switch (item.type) {
      case 'text': {
        const config = item.config as any;
        text = config.text ?? '';
        value = config.text;
        break;
      }

      case 'field': {
        const config = item.config as any;
        binding = config.field;
        value = row ? row[config.field] : undefined;
        text = value == null
          ? (config.nullText ?? '')
          : this._ctx.formatFn
            ? this._ctx.formatFn(value, config.format)
            : String(value);
        break;
      }

      case 'computed': {
        const config = item.config as any;
        value = expressionEvaluator.evaluate(config.expression, evalCtx);
        text = this._ctx.formatFn
          ? this._ctx.formatFn(value, config.format, config.dataType)
          : String(value ?? '');
        break;
      }

      case 'line':
      case 'rectangle':
      case 'image':
      case 'barcode':
      case 'qrcode':
      case 'page-break':
        // 这些类型不需要文本计算
        text = '';
        value = null;
        break;

      case 'chart': {
        const config = item.config as any;
        value = null;
        text = '[图表]';
        const chartData = this._buildChartData(config, evalCtx.rows ?? []);
        return {
          item,
          text,
          value,
          style: this._resolveStyle(item),
          highlighted: false,
          colspan: 1,
          binding,
          chartData,
        };
      }

      case 'table': {
        text = '[表格]';
        value = null;
        break;
      }

      default:
        text = '';
        value = null;
    }

    return {
      item,
      text,
      value,
      style: this._resolveStyle(item),
      highlighted: false,
      colspan: 1,
      binding,
    };
  }

  private _buildChartData(config: any, rows: Record<string, unknown>[]): ChartRenderData {
    const labels = rows.map((r, i) => String(r[config.xField] ?? i + 1));
    const datasets = config.yFields.map((yField: string, i: number) => {
      const colors = ['#3f51b5', '#e91e63', '#4caf50', '#ff9800', '#9c27b0', '#00bcd4'];
      return {
        label: config.seriesLabels?.[yField] ?? yField,
        data: rows.map(r => Number(r[yField]) || 0),
        backgroundColor: colors[i % colors.length],
      };
    });

    return {
      chartType: config.chartType ?? 'bar',
      labels,
      datasets,
      title: config.title,
    };
  }

  // ══════════════════════════════════════════════════════════════
  // 样式解析（合并 style + styleInline）
  // ══════════════════════════════════════════════════════════════

  private _resolveStyle(item: ReportItem): ResolvedStyle {
    const template = this._ctx.template;
    const defaults: ResolvedStyle = {
      name: 'resolved',
      fontSize: 12,
      fontFamily: 'Microsoft YaHei, sans-serif',
      fontWeight: 'normal',
      color: '#000000',
      backgroundColor: 'transparent',
      align: 'left',
      verticalAlign: 'top',
      padding: { top: 4, right: 4, bottom: 4, left: 4 },
      border: {
        top: { width: 0, color: 'transparent', style: 'solid' },
        right: { width: 0, color: 'transparent', style: 'solid' },
        bottom: { width: 0, color: 'transparent', style: 'solid' },
        left: { width: 0, color: 'transparent', style: 'solid' },
      },
    };

    const base = template.styles?.[item.style ?? 'default'] ?? {};

    return {
      ...defaults,
      ...base,
      ...item.styleInline,
      padding: { ...defaults.padding, ...base.padding, ...item.styleInline?.padding },
      border: {
        ...defaults.border,
        ...base.border,
        ...item.styleInline?.border,
      },
    } as ResolvedStyle;
  }

  // ══════════════════════════════════════════════════════════════
  // 分页逻辑
  // ══════════════════════════════════════════════════════════════

  private _paginate(sections: ReportSection[], innerWidth: number): ReportPage[] {
    const pages: ReportPage[] = [];
    let currentPage: ReportPage = this._newPage();
    let currentHeight = 0;
    let pageIndex = 0;

    for (let si = 0; si < sections.length; si++) {
      const section = sections[si];
      const sectionHeight = this._calcSectionHeight(section);

      // 检查页头和页脚
      const pageHeaderBand = this._ctx.template.bands.find(b => b.type === 'page-header');
      const pageFooterBand = this._ctx.template.bands.find(b => b.type === 'page-footer');
      const headerHeight = pageHeaderBand?.height ?? 0;
      const footerHeight = pageFooterBand?.height ?? 0;
      const pageFooterReserved = pageIndex === 0 ? headerHeight + footerHeight : footerHeight;

      // 如果当前节加上页脚会超出页面高度，先放页脚，再开新页
      if (currentHeight + sectionHeight > this._ctx.pageHeight - pageFooterReserved) {
        // 先加入页脚
        if (pageFooterBand && currentHeight > 0) {
          const footerSection = this._buildBandSection(pageFooterBand, {});
          currentPage.sections.push(footerSection);
          currentHeight += footerSection.height;
        }

        // 新页
        pages.push(currentPage);
        currentPage = this._newPage();
        currentHeight = 0;
        pageIndex++;
      }

      // 添加页头（仅首页或需要重复的带区）
      if (pageIndex === 0 && pageHeaderBand && sections[0]?.band.type !== 'page-header') {
        const headerSection = this._buildBandSection(pageHeaderBand, {});
        currentPage.sections.unshift(headerSection);
        currentHeight += headerSection.height;
      }

      currentPage.sections.push(section);
      currentHeight += sectionHeight;
    }

    // 最后加上页脚
    const pageFooterBand = this._ctx.template.bands.find(b => b.type === 'page-footer');
    if (pageFooterBand) {
      currentPage.sections.push(this._buildBandSection(pageFooterBand, {}));
    }

    pages.push(currentPage);
    return pages;
  }

  private _newPage(): ReportPage {
    return { pageNumber: 0, sections: [], pageNumberText: '', timestampText: '' };
  }

  private _calcSectionHeight(section: ReportSection): number {
    if (section.rows.length === 0) return section.height || 30;
    return section.rows.reduce((s, r) => s + r.height, section.height);
  }

  private _formatPageNumber(page: number, total: number): string {
    const fmt = this._ctx.template.page.pageNumberFormat ?? '第 {page} 页，共 {total} 页';
    return fmt.replace('{page}', String(page)).replace('{total}', String(total));
  }

  // ══════════════════════════════════════════════════════════════
  // 工具方法：获取指定字段的聚合值
  // ══════════════════════════════════════════════════════════════

  getAggregation(field: string, groupKey = '__global__', aggType: AggregationType = 'sum'): number {
    const aggMap = this._aggregations.get(groupKey);
    if (!aggMap) return 0;
    return aggMap.get(`${field}_${aggType.replace('-', '_')}`) ?? 0;
  }
}
