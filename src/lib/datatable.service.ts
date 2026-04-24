/**
 * DataTableService - Angular 服务
 * 封装 DataStore 引擎，提供响应式表格数据管理
 */

import { Injectable, signal, computed } from '@angular/core';
import {
  DataStoreImpl, DataStoreConfig, DataStoreEvent, DataStoreEventType,
  FieldDefinition, FilterCondition, SortRule, AggregationFormula,
  AggregationResult, ValidationResult, UpdateData, QueryOptions,
  DataRow, RowId, RawValue, BufferType
} from './datastore';
import { ColumnConfig, TableState, ToolbarAction, RowAction, ChangeEvent, ExportConfig } from './models';

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
            value,
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

  readonly totalRows = computed(() => this._ds?.getRowCount() ?? 0);
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

  sort(field: string, direction: 'asc' | 'desc'): void {
    this._state.update(s => ({ ...s, sortField: field, sortDirection: direction }));
  }

  clearSort(): void {
    this._state.update(s => ({ ...s, sortField: undefined, sortDirection: undefined }));
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
    return this._ds.addRow(data, buffer);
  }

  addRows(data: Record<string, RawValue>[]): DataRow[] {
    return this._ds.addRows(data);
  }

  updateRow(rowId: RowId, data: Partial<Record<string, RawValue>>): boolean {
    return this._ds.updateRow(rowId, data);
  }

  deleteRow(rowId: RowId): boolean {
    return this._ds.deleteRow(rowId);
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
    return this._ds.restoreRow(rowId);
  }

  permanentDelete(rowId: RowId): boolean {
    return this._ds.permanentDelete(rowId);
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
    this._ds.setData(data);
    this._state.update(s => ({ ...s, pageIndex: 0, selectedRows: new Set() }));
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
}
