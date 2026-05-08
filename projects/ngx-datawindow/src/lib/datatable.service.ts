/**
 * DataTableService - Angular 服务
 * 封装 DataStore 引擎，提供响应式表格数据管理
 */

import { Injectable, signal, computed, OnDestroy } from '@angular/core';
import { Subscription, timer, Subject } from 'rxjs';
import { buffer, filter } from 'rxjs/operators';
import {
  DataStoreImpl, DataStoreConfig, DataStoreEvent, DataStoreEventType,
  FieldDefinition, FilterCondition, SortRule, AggregationFormula,
  AggregationResult, ValidationResult, UpdateData, QueryOptions,
  DataRow, RowId, RawValue, BufferType
} from './datastore';
import { ColumnConfig, TableState, ToolbarAction, RowAction, ChangeEvent, ExportConfig, DataFeedConfig, HighlightCell } from './models';

export interface DataTableOptions {
  /** DataStore 配置 */
  datastore: DataStoreConfig;
  /** 列配置 */
  columns: ColumnConfig[];
  /** 初始数据 */
  initialData?: Record<string, RawValue>[];
  /** 默认每页数量 */
  defaultPageSize?: number;
  /** 是否自动初始化 */
  autoInit?: boolean;
}

@Injectable({ providedIn: 'root' })
export class DataTableService {
  private _ds!: DataStoreImpl;
  private _columns: ColumnConfig[] = [];
  private _state = signal<TableState>({
    pageIndex: 0,
    pageSize: 10,
    sortField: undefined,
    sortDirection: undefined,
    globalSearch: '',
    columnFilters: {},
    selectedRows: new Set(),
    loading: false,
  });

  // ── 响应式信号 ─────────────────────────────────────────────────────────────

  readonly state = this._state.asReadonly();

  readonly rows = computed(() => {
    const s = this._state();
    const opts: QueryOptions = {
      skip: s.pageIndex * s.pageSize,
      take: s.pageSize,
    };
    if (s.sortField) {
      opts.sort = [{ field: s.sortField, direction: s.sortDirection ?? 'asc' }];
    }
    if (s.globalSearch) {
      const cols = this._columns.filter(c => c.filterable !== false);
      if (cols.length) {
        opts.filter = {
          connector: 'or',
          children: cols.map(c => ({
            field: c.field,
            operator: 'contains' as const,
            value: s.globalSearch,
          })),
        };
      }
    }
    if (Object.keys(s.columnFilters).length) {
      const children: FilterCondition[] = [];
      for (const [field, value] of Object.entries(s.columnFilters)) {
        if (value !== undefined && value !== null && value !== '') {
          children.push({
            field,
            operator: Array.isArray(value) ? 'in' : 'eq',
            value: value as RawValue,
          });
        }
      }
      if (children.length) {
        opts.filter = children.length === 1
          ? children[0]
          : { connector: 'and', children };
      }
    }
    return this._ds?.query(opts) ?? { rows: [], total: 0, hasMore: false };
  });

  readonly totalRows = computed(() => {
    const s = this._state();
    // 获取过滤后的总数（不加分页）
    const opts: QueryOptions = { take: 999999 };
    if (s.sortField) {
      opts.sort = [{ field: s.sortField, direction: s.sortDirection ?? 'asc' }];
    }
    if (s.globalSearch) {
      const cols = this._columns.filter(c => c.filterable !== false);
      if (cols.length) {
        opts.filter = {
          connector: 'or',
          children: cols.map(c => ({
            field: c.field,
            operator: 'contains' as const,
            value: s.globalSearch,
          })),
        };
      }
    }
    if (Object.keys(s.columnFilters).length) {
      const children: FilterCondition[] = [];
      for (const [field, value] of Object.entries(s.columnFilters)) {
        if (value !== undefined && value !== null && value !== '') {
          children.push({
            field,
            operator: Array.isArray(value) ? 'in' : 'eq',
            value: value as RawValue,
          });
        }
      }
      if (children.length) {
        opts.filter = children.length === 1
          ? children[0]
          : { connector: 'and', children };
      }
    }
    return this._ds?.query(opts)?.total ?? 0;
  });
  readonly pageSize = computed(() => this._state().pageSize);
  readonly pageIndex = computed(() => this._state().pageIndex);
  readonly selectedIds = computed(() => [...this._state().selectedRows]);

  readonly hasSelection = computed(() => this._state().selectedRows.size > 0);
  readonly selectionCount = computed(() => this._state().selectedRows.size);

  // 聚合结果
  private _aggregations = signal<Record<string, AggregationResult>>({});
  readonly aggregations = this._aggregations.asReadonly();

  // 校验结果
  private _validation = signal<ValidationResult>({ valid: true, errors: [] });
  readonly validation = this._validation.asReadonly();

  // ── 初始化 ──────────────────────────────────────────────────────────────────

  initialize(options: DataTableOptions): void {
    this._ds = new DataStoreImpl(options.datastore);
    this._columns = options.columns;

    // 监听事件
    this._ds.on('rowAdded', () => this._refresh());
    this._ds.on('rowUpdated', () => this._refresh());
    this._ds.on('rowRemoved', () => this._refresh());
    this._ds.on('bufferChanged', () => this._refresh());

    // 加载初始数据
    if (options.initialData?.length) {
      this._ds.setData(options.initialData);
    }

    // 设置分页
    if (options.defaultPageSize) {
      this._state.update(s => ({ ...s, pageSize: options.defaultPageSize! }));
    }
  }

  // ── 分页与排序 ────────────────────────────────────────────────────────────

  setPage(index: number): void {
    this._state.update(s => ({ ...s, pageIndex: index }));
  }

  setPageSize(size: number): void {
    this._state.update(s => ({ ...s, pageSize: size, pageIndex: 0 }));
  }

  setSort(field: string, direction: '' | 'asc' | 'desc'): void {
    if (direction === '') {
      this._state.update(s => ({ ...s, sortField: undefined, sortDirection: undefined }));
    } else {
      this._state.update(s => ({ ...s, sortField: field, sortDirection: direction }));
    }
    this._notifyDataChange();
  }

  /** 按字段排序（仅用于多字段排序场景） */
  sort(field: string, direction: 'asc' | 'desc'): void {
    this._state.update(s => ({ ...s, sortField: field, sortDirection: direction }));
    this._notifyDataChange();
  }

  /** 清除所有排序 */
  clearSort(): void {
    this._state.update(s => ({ ...s, sortField: undefined, sortDirection: undefined }));
    this._notifyDataChange();
  }

  // ── 过滤 ──────────────────────────────────────────────────────────────────

  setGlobalSearch(query: string): void {
    this._state.update(s => ({ ...s, globalSearch: query, pageIndex: 0 }));
  }

  setColumnFilter(field: string, value: unknown): void {
    this._state.update(s => ({
      ...s,
      columnFilters: { ...s.columnFilters, [field]: value },
      pageIndex: 0,
    }));
  }

  clearColumnFilter(field: string): void {
    this._state.update(s => {
      const f = { ...s.columnFilters };
      delete f[field];
      return { ...s, columnFilters: f };
    });
  }

  clearAllFilters(): void {
    this._state.update(s => ({
      ...s,
      globalSearch: '',
      columnFilters: {},
      pageIndex: 0,
    }));
  }

  // ── 增删改 ────────────────────────────────────────────────────────────────

  addRow(data: Record<string, RawValue>, buffer: BufferType = 'main'): DataRow {
    const row = this._ds.addRow(data, buffer);
    this._notifyDataChange();
    return row;
  }

  addRows(data: Record<string, RawValue>[]): DataRow[] {
    const rows = this._ds.addRows(data);
    this._notifyDataChange();
    return rows;
  }

  updateRow(rowId: RowId, data: Partial<Record<string, RawValue>>): Promise<boolean> {
    return this._ds.updateRow(rowId, data).then(r => {
      if (r.success) this._notifyDataChange();
      return r.success;
    });
  }

  deleteRow(rowId: RowId): boolean {
    const ok = this._ds.deleteRow(rowId);
    if (ok) this._notifyDataChange();
    return ok;
  }

  deleteSelected(): number {
    const ids = [...this._state().selectedRows];
    let count = 0;
    for (const id of ids) {
      if (this._ds.deleteRow(id)) count++;
    }
    this._state.update(s => ({ ...s, selectedRows: new Set() }));
    return count;
  }

  restoreRow(rowId: RowId): boolean {
    const ok = this._ds.restoreRow(rowId);
    if (ok) this._notifyDataChange();
    return ok;
  }

  permanentDelete(rowId: RowId): boolean {
    const ok = this._ds.permanentDelete(rowId);
    if (ok) this._notifyDataChange();
    return ok;
  }

  // ── 选择 ──────────────────────────────────────────────────────────────────

  selectRow(rowId: RowId, selected: boolean): void {
    this._state.update(s => {
      const sel = new Set(s.selectedRows);
      if (selected) sel.add(rowId); else sel.delete(rowId);
      return { ...s, selectedRows: sel };
    });
  }

  selectAll(selected: boolean): void {
    if (selected) {
      const allIds = this._ds.query({}).rows.map(r => r.id);
      this._state.update(s => ({ ...s, selectedRows: new Set(allIds) }));
    } else {
      this._state.update(s => ({ ...s, selectedRows: new Set() }));
    }
  }

  isSelected(rowId: RowId): boolean {
    return this._state().selectedRows.has(rowId);
  }

  // ── 聚合 ──────────────────────────────────────────────────────────────────

  registerAggregation(formula: AggregationFormula): void {
    this._ds.registerAggregation(formula);
  }

  computeAggregation(formulaId: string): AggregationResult | undefined {
    const result = this._ds.aggregate(formulaId);
    if (result) {
      this._aggregations.update(a => ({ ...a, [formulaId]: result }));
    }
    return result;
  }

  computeAllAggregations(): Record<string, AggregationResult> {
    const results = this._ds.aggregateAll();
    this._aggregations.set(results);
    return results;
  }

  // ── 校验 ──────────────────────────────────────────────────────────────────

  validate(): ValidationResult {
    const result = this._ds.validate();
    this._validation.set(result);
    return result;
  }

  // ── 导出 ──────────────────────────────────────────────────────────────────

  exportToCSV(config: ExportConfig = { format: 'csv' }): string {
    const opts: QueryOptions = {};
    if (config.exportSelectedOnly) {
      const ids = this._state().selectedRows;
      opts.filter = {
        children: [...ids].map(id => ({ field: 'id', operator: 'eq', value: id })),
        connector: 'or',
      } as FilterCondition;
    }
    const result = this._ds.query(opts);
    const cols = this._columns.filter(c => c.visible !== false);

    const header = cols.map(c => c.header).join(',');
    const lines = result.rows.map(row => {
      return cols.map(c => {
        const v = row.raw[c.field];
        const formatted = c.format ? c.format(v as any, row.raw as any) : String(v ?? '');
        return `"${formatted.replace(/"/g, '""')}"`;
      }).join(',');
    });

    return [header, ...lines].join('\n');
  }

  exportToJSON(config: ExportConfig = { format: 'json' }): string {
    const opts: QueryOptions = {};
    if (config.exportSelectedOnly) {
      const ids = this._state().selectedRows;
      opts.filter = {
        children: [...ids].map(id => ({ field: 'id', operator: 'eq', value: id })),
        connector: 'or',
      } as FilterCondition;
    }
    const result = this._ds.query(opts);
    const cols = this._columns.filter(c => c.visible !== false);
    const data = result.rows.map(row => {
      const obj: Record<string, unknown> = {};
      for (const c of cols) {
        obj[c.field] = c.format ? c.format(row.raw[c.field] as any, row.raw as any) : row.raw[c.field];
      }
      return obj;
    });
    return JSON.stringify(config.exportSelectedOnly && config.format === 'json'
      ? data
      : { data, total: result.total, exportedAt: new Date().toISOString() }, null, 2);
  }

  // ── 数据操作 ──────────────────────────────────────────────────────────────

  setData(data: Record<string, RawValue>[]): void {
    if (!this._ds) { return; }
    this._ds.setData(data);
    this._state.update(s => ({ ...s, pageIndex: 0, selectedRows: new Set() }));
  }

  /** 触发状态更新以通知 computed signal 重新计算 */
  private _notifyDataChange(): void {
    this._state.update(s => ({ ...s }));
  }

  // ── 实时数据接入 ─────────────────────────────────────────────────────────

  /**
   * 处理实时数据更新
   * @param mode replace（全量替换）| merge（按 keyField 合并）| append（追加）
   * @param items 变更的数据行
   * @param keyField merge 模式的主键字段，默认 id
   * @param highlightDuration 高亮持续时间(ms)
   */
  feedUpdate(
    mode: 'replace' | 'merge' | 'append',
    items: Record<string, RawValue>[],
    keyField = 'id',
    highlightDuration = 500
  ): void {
    if (!this._ds || !items.length) return;

    if (mode === 'replace') {
      this._ds.setData(items);

    } else if (mode === 'merge') {
      for (const item of items) {
        const key = item[keyField] as string | number;
        const existing = this._ds.getRowById(key as number);
        if (existing) {
          // 记录变更字段并高亮
          for (const [field, value] of Object.entries(item)) {
            if (field === keyField) continue;
            if (existing.raw[field] !== value) {
              this.setHighlight(key as number, field, value, highlightDuration);
            }
          }
          this._ds.updateRow(key as number, item);
        } else {
          this._ds.addRow(item);
        }
      }

    } else {
      // append — 追加新行
      const newRows = this._ds.addRows(items);
      // 新行全部高亮
      for (const row of newRows) {
        for (const col of this._columns) {
          if (col.field !== keyField) {
            this.setHighlight(row.id, col.field, row.raw[col.field], highlightDuration);
          }
        }
      }
    }
  }

  /** 批量合并缓冲区（用于高频数据） */
  private _feedBatch: Record<string, RawValue>[] = [];
  private _feedBatchTimer: ReturnType<typeof setTimeout> | null = null;
  private _feedBatchFn: (() => void) | null = null;

  /**
   * 启动批量合并模式
   * @param interval 合并间隔(ms)
   * @param mode replace | merge | append
   * @param keyField merge 模式的主键
   */
  startFeedBatch(interval = 100, mode: 'replace' | 'merge' | 'append' = 'merge', keyField = 'id'): void {
    this._feedBatchFn = () => {
      if (!this._feedBatch.length) return;
      const items = this._feedBatch.splice(0, this._feedBatch.length);
      this.feedUpdate(mode, items, keyField);
    };
  }

  /** 添加到批量缓冲区（需先调用 startFeedBatch） */
  addToFeedBatch(item: Record<string, RawValue>): void {
    this._feedBatch.push(item);
    if (!this._feedBatchTimer) {
      this._feedBatchTimer = setTimeout(() => {
        this._feedBatchFn?.();
        this._feedBatchTimer = null;
      }, 100);
    }
  }

  /** 刷新显示（用于追加模式滚动到底部） */
  refreshFeed(): void {
    this._refresh();
  }

  // ── 高亮状态 ─────────────────────────────────────────────────────────────

  /** 标记单元格高亮 */
  private _highlightCells = signal<Map<string, HighlightCell>>(new Map());

  /** 高亮单元格（rowId_field 格式 key） */
  setHighlight(rowId: number, field: string, value: RawValue, duration = 500): void {
    const key = `${rowId}_${field}`;
    const ts = Date.now();
    this._highlightCells.update(m => {
      const next = new Map(m);
      next.set(key, { rowId, field, timestamp: ts, value });
      return next;
    });
    setTimeout(() => {
      this._highlightCells.update(m => {
        const next = new Map(m);
        next.delete(key);
        return next;
      });
    }, duration);
  }

  /** 检查单元格是否高亮中 */
  isHighlighted(rowId: number, field: string): boolean {
    return this._highlightCells().has(`${rowId}_${field}`);
  }

  reset(): void {
    this._ds.reset();
    this._state.update(s => ({
      ...s,
      pageIndex: 0,
      sortField: undefined,
      sortDirection: undefined,
      globalSearch: '',
      columnFilters: {},
      selectedRows: new Set(),
    }));
    this._aggregations.set({});
    this._validation.set({ valid: true, errors: [] });
  }

  // ── 内部 ──────────────────────────────────────────────────────────────────

  private _refresh(): void {
    // 触发信号更新（Angular 会自动检测）
    this._state.update(s => ({ ...s }));
  }

  getDataStore(): DataStoreImpl {
    return this._ds;
  }

  getColumns(): ColumnConfig[] {
    return this._columns;
  }

  generateUpdates(): UpdateData[] {
    return this._ds.generateDiffUpdates();
  }

  commit(): void {
    this._ds.clearUpdates();
  }

  getStats() {
    return this._ds.getStats();
  }
}
