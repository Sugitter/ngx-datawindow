/**
 * DataTableComponent - 主表格组件
 * 封装 Angular Material Table + DataStore 引擎
 */

import {
  Component, Input, Output, EventEmitter, ViewChild, ChangeDetectionStrategy,
  inject, signal, computed, OnInit, OnDestroy, ChangeDetectorRef, ContentChild,
  TemplateRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { SelectionModel } from '@angular/cdk/collections';

import { DataTableService } from './datatable.service';
import {
  ColumnConfig, TableConfig, TableState, ToolbarAction, RowAction,
  ChangeEvent, ExportConfig
} from './models';
import { DataRow, RawValue, DataStoreConfig } from './datastore';

export interface ColumnFilterEvent { field: string; value: unknown; }
export interface SortEvent { field: string; direction: 'asc' | 'desc'; }
export interface RowClickEvent { row: DataRow; event: MouseEvent; }
export interface ToolbarEvent { action: ToolbarAction; }

@Component({
  selector: 'ngx-datatable',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatCheckboxModule, MatInputModule, MatFormFieldModule,
    MatSelectModule, MatButtonModule, MatIconModule,
    MatTooltipModule, MatSnackBarModule, MatDialogModule,
  ],
  providers: [DataTableService],
  template: `
    <div class="dt-container" [class.dt-loading]="loading()">
      <!-- 标题栏 -->
      @if (config?.showTitle !== false && config?.title) {
        <div class="dt-title-bar">
          <span class="dt-title">{{ config.title }}</span>
        </div>
      }

      <!-- 工具栏 -->
      @if (config?.showToolbar !== false) {
        <div class="dt-toolbar">
          <!-- 全局搜索 -->
          @if (config?.showGlobalSearch !== false) {
            <mat-form-field appearance="outline" class="dt-search">
              <mat-label>搜索</mat-label>
              <input matInput [value]="searchQuery()"
                (input)="onSearchChange($event)"
                placeholder="全局搜索...">
              @if (searchQuery()) {
                <button matSuffix mat-icon-button (click)="clearSearch()">
                  <mat-icon>close</mat-icon>
                </button>
              }
            </mat-form-field>
          }

          <span class="dt-toolbar-spacer"></span>

          <!-- 工具栏按钮 -->
          @if (toolbarActions?.add) {
            <button mat-flat-button color="primary" (click)="onAdd()"
              [disabled]="loading()">
              <mat-icon>add</mat-icon>
              {{ getActionLabel(toolbarActions.add, '新增') }}
            </button>
          }

          @if (toolbarActions?.delete) {
            <button mat-stroked-button color="warn" (click)="onDeleteSelected()"
              [disabled]="!hasSelection() || loading()">
              <mat-icon>delete</mat-icon>
              {{ getActionLabel(toolbarActions.delete, '删除') }}
              @if (selectionCount() > 0) {
                <span class="dt-badge">{{ selectionCount() }}</span>
              }
            </button>
          }

          @if (toolbarActions?.refresh) {
            <button mat-icon-button (click)="onRefresh()" [disabled]="loading()"
              matTooltip="刷新">
              <mat-icon>refresh</mat-icon>
            </button>
          }

          @if (toolbarActions?.export) {
            <button mat-icon-button [matMenuTriggerFor]="exportMenu"
              [disabled]="loading()" matTooltip="导出">
              <mat-icon>download</mat-icon>
            </button>
            <mat-menu #exportMenu="matMenu">
              <button mat-menu-item (click)="exportData('csv')">
                <mat-icon>table_chart</mat-icon>
                <span>导出 CSV</span>
              </button>
              <button mat-menu-item (click)="exportData('json')">
                <mat-icon>code</mat-icon>
                <span>导出 JSON</span>
              </button>
            </mat-menu>
          }

          @for (btn of toolbarActions?.custom || []; track btn.id) {
            <button mat-stroked-button (click)="onCustomAction(btn)">
              <mat-icon>{{ btn.icon }}</mat-icon>
              {{ btn.label }}
            </button>
          }
        </div>
      }

      <!-- 列过滤行 -->
      @if (config?.showColumnFilter) {
        <div class="dt-column-filters">
          @for (col of visibleColumns(); track col.field) {
            @if (col.filterable !== false) {
              <div class="dt-filter-cell" [style.width]="col.width || 'auto'">
                @switch (col.filterType) {
                  @case ('select') {
                    <mat-form-field appearance="outline" class="dt-filter-input">
                      <mat-label>{{ col.header }}</mat-label>
                      <mat-select [value]="getColumnFilter(col.field)"
                        (selectionChange)="onColumnFilter(col.field, $event.value)">
                        <mat-option [value]="null">全部</mat-option>
                        @for (opt of col.filterOptions; track opt.value) {
                          <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                  }
                  @default {
                    <mat-form-field appearance="outline" class="dt-filter-input">
                      <mat-label>{{ col.header }}</mat-label>
                      <input matInput [value]="getColumnFilter(col.field)"
                        (input)="onColumnFilter(col.field, $event)"
                        [placeholder]="col.header">
                    </mat-form-field>
                  }
                }
              </div>
            }
          }
        </div>
      }

      <!-- 表格主体 -->
      <div class="dt-table-wrapper">
        <table mat-table [dataSource]="dataSource()" class="dt-table">

          <!-- 选择列 -->
          @if (selectionMode() !== 'none') {
            <ng-container matColumnDef="select">
              <th mat-header-cell *matHeaderCellDef>
                <mat-checkbox
                  [checked]="isAllSelected()"
                  [indeterminate]="isIndeterminate()"
                  (change)="toggleSelectAll($event.checked)">
                </mat-checkbox>
              </th>
              <td mat-cell *matCellDef="let row">
                <mat-checkbox
                  [checked]="isRowSelected(row.id)"
                  (change)="toggleRowSelect(row.id, $event.checked)"
                  (click)="$event.stopPropagation()">
                </mat-checkbox>
              </td>
            </ng-container>
          }

          <!-- 数据列 -->
          @for (col of visibleColumns(); track col.field) {
            <ng-container [matColumnDef]="col.field">
              <th mat-header-cell *matHeaderCellDef
                [style.textAlign]="col.align || 'left'"
                [style.width]="col.width"
                [mat-sort-header]="col.sortable !== false ? col.field : ''"
                [disabled]="col.sortable === false">
                {{ col.header }}
                @if (col.aggregate) {
                  <span class="dt-agg-badge">{{ col.aggregate.type.toUpperCase() }}</span>
                }
              </th>
              <td mat-cell *matCellDef="let row"
                [style.textAlign]="col.align || 'left'">
                @if (col.editable) {
                  <ng-container *ngTemplateOutlet="editCell; context: { $implicit: row, col: col }">
                  </ng-container>
                } @else {
                  {{ formatCell(row, col) }}
                }
              </td>
            </ng-container>
          }

          <!-- 操作列 -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef style="width: 120px">操作</th>
            <td mat-cell *matCellDef="let row">
              @if (rowStatus(row) === 'deleted') {
                <button mat-button color="primary" (click)="restoreRow(row.id); $event.stopPropagation()">
                  恢复
                </button>
              } @else {
                <button mat-icon-button matTooltip="编辑"
                  (click)="editRow(row); $event.stopPropagation()">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button matTooltip="删除" color="warn"
                  (click)="deleteRow(row.id); $event.stopPropagation()">
                  <mat-icon>delete</mat-icon>
                </button>
              }
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns(); sticky: true"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns()"
            [class.dt-row-selected]="isRowSelected(row.id)"
            [class.dt-row-new]="row.status === 'new'"
            [class.dt-row-modified]="row.status === 'modified'"
            [class.dt-row-deleted]="row.status === 'deleted'"
            [class.dt-clickable]="config?.rowClick"
            (click)="onRowClick(row, $event)"
            (dblclick)="onRowDoubleClick(row, $event)">
          </tr>

          <!-- 空状态 -->
          <tr class="mat-row" *matNoDataRow>
            <td class="mat-cell dt-empty" [attr.colspan]="displayedColumns().length">
              {{ config?.emptyMessage || '暂无数据' }}
            </td>
          </tr>
        </table>
      </div>

      <!-- 分页器 -->
      @if (config?.showPaginator !== false) {
        <mat-paginator
          [pageIndex]="pageIndex()"
          [pageSize]="pageSize()"
          [pageSizeOptions]="paginationConfig?.pageSizeOptions || [10, 25, 50, 100]"
          [showFirstLastButtons]="true"
          (page)="onPageChange($event)">
        </mat-paginator>
      }

      <!-- 加载遮罩 -->
      @if (loading()) {
        <div class="dt-overlay">
          <mat-spinner diameter="40"></mat-spinner>
          <span>{{ config?.loadingMessage || '加载中...' }}</span>
        </div>
      }
    </div>

    <!-- 编辑单元格模板（默认内联编辑） -->
    <ng-template #editCell let-row let-col="col">
      @if (isEditing(row.id, col.field)) {
        <input class="dt-edit-input" [(ngModel)]="editValue"
          (blur)="saveEdit(row.id, col.field)"
          (keydown.enter)="saveEdit(row.id, col.field)"
          (keydown.escape)="cancelEdit()"
          [type]="col.editType === 'number' ? 'number' : 'text'"
          [value]="row.raw[col.field]">
      } @else {
        <span class="dt-cell-editable" (dblclick)="startEdit(row.id, col.field, row.raw[col.field])">
          {{ formatCell(row, col) }}
        </span>
      }
    </ng-template>
  `,
  styles: [`
    .dt-container {
      display: flex;
      flex-direction: column;
      position: relative;
      font-family: Roboto, "Helvetica Neue", sans-serif;
      background: #fff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .dt-title-bar {
      padding: 16px 24px;
      border-bottom: 1px solid #e0e0e0;
      background: #fafafa;
    }

    .dt-title {
      font-size: 18px;
      font-weight: 500;
    }

    .dt-toolbar {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: #fff;
      border-bottom: 1px solid #e0e0e0;
      flex-wrap: wrap;
    }

    .dt-toolbar-spacer { flex: 1; }

    .dt-search {
      width: 280px;
      font-size: 14px;
    }

    .dt-search .mat-mdc-form-field-subscript-wrapper { display: none; }

    .dt-badge {
      margin-left: 4px;
      background: #f44336;
      color: #fff;
      border-radius: 10px;
      padding: 2px 6px;
      font-size: 12px;
    }

    .dt-column-filters {
      display: flex;
      gap: 8px;
      padding: 8px 16px;
      background: #f5f5f5;
      overflow-x: auto;
      flex-wrap: wrap;
    }

    .dt-filter-cell { flex-shrink: 0; }

    .dt-filter-input {
      width: 140px;
      font-size: 13px;
    }

    .dt-filter-input .mat-mdc-form-field-subscript-wrapper { display: none; }
    .dt-filter-input .mat-mdc-text-field-wrapper { padding: 0 8px !important; }
    .dt-filter-input .mat-mdc-form-field-infix { min-height: 36px; padding: 6px 0; }

    .dt-table-wrapper {
      overflow: auto;
      max-height: 500px;
    }

    .dt-table {
      width: 100%;
      min-width: 600px;
    }

    .dt-table th.mat-mdc-header-cell {
      font-weight: 600;
      background: #fafafa;
      color: rgba(0,0,0,0.87);
    }

    .dt-table td.mat-mdc-cell {
      padding: 0 8px;
    }

    .dt-row-selected { background: #e3f2fd !important; }
    .dt-row-new { background: #e8f5e9 !important; }
    .dt-row-modified { background: #fff8e1 !important; }
    .dt-row-deleted { background: #ffebee !important; opacity: 0.7; }
    .dt-clickable { cursor: pointer; }

    .dt-agg-badge {
      display: inline-block;
      margin-left: 4px;
      font-size: 9px;
      background: #1976d2;
      color: #fff;
      border-radius: 4px;
      padding: 1px 4px;
      font-weight: 400;
    }

    .dt-empty {
      text-align: center;
      padding: 48px !important;
      color: #999;
    }

    .dt-cell-editable { cursor: text; }
    .dt-cell-editable:hover { background: #f5f5f5; border-radius: 4px; padding: 2px 4px; }

    .dt-edit-input {
      width: 100%;
      border: 1px solid #1976d2;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: inherit;
      outline: none;
    }

    .dt-overlay {
      position: absolute;
      inset: 0;
      background: rgba(255,255,255,0.85);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      z-index: 10;
    }

    .dt-loading .dt-table-wrapper { filter: blur(2px); pointer-events: none; }

    /* Material 覆盖 */
    ::ng-deep .dt-container .mat-mdc-form-field-appearance-outline .mat-mdc-floating-label {
      top: 18px;
    }
    ::ng-deep .dt-container .mat-mdc-paginator {
      background: transparent;
      border-top: 1px solid #e0e0e0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableComponent implements OnInit {
  private _service = inject(DataTableService);
  private _snackBar = inject(MatSnackBar);

  // ── 输入 ──────────────────────────────────────────────────────────────────

  @Input() set datastoreConfig(v: DataStoreConfig) { this._datastoreConfig = v; }
  @Input() set columns(v: ColumnConfig[]) { this._columns = v; }
  @Input() set data(v: Record<string, RawValue>[]) { if (v) this._service.setData(v); }
  @Input() set tableConfig(v: TableConfig) { this._tableConfig = v; }
  @Input() set loading(v: boolean) { this._loading.set(v ?? false); }

  // ── 输出 ──────────────────────────────────────────────────────────────────

  @Output() readonly rowAdded = new EventEmitter<DataRow>();
  @Output() readonly rowUpdated = new EventEmitter<{ row: DataRow; changes: Record<string, unknown> }>();
  @Output() readonly rowDeleted = new EventEmitter<RowId>();
  @Output() readonly rowClicked = new EventEmitter<RowClickEvent>();
  @Output() readonly rowDoubleClicked = new EventEmitter<RowClickEvent>();
  @Output() readonly selectionChanged = new EventEmitter<Set<RowId>>();
  @Output() readonly toolbarAction = new EventEmitter<ToolbarEvent>();
  @Output() readonly pageChanged = new EventEmitter<PageEvent>();

  // ── 内部状态 ───────────────────────────────────────────────────────────────

  private _datastoreConfig: DataStoreConfig = { name: 'default', fields: [] };
  private _columns: ColumnConfig[] = [];
  private _tableConfig: TableConfig = {};
  private _loading = signal(false);
  private _editingCell = signal<{ rowId: number; field: string } | null>(null);
  private _editValue: unknown = null;

  // ── 响应式 ────────────────────────────────────────────────────────────────

  readonly loading = this._loading.asReadonly();
  readonly searchQuery = () => this._service.state().globalSearch;
  readonly pageIndex = () => this._service.state().pageIndex;
  readonly pageSize = () => this._service.state().pageSize;
  readonly hasSelection = this._service.hasSelection;
  readonly selectionCount = this._service.selectionCount;

  readonly selectionMode = computed(() => this._tableConfig?.selectionMode ?? 'none');
  readonly toolbarActions = computed(() => this._tableConfig?.toolbarActions);
  readonly paginationConfig = computed(() => this._tableConfig?.pagination);

  readonly config = computed(() => this._tableConfig);
  readonly visibleColumns = computed(() => this._columns.filter(c => c.visible !== false));

  readonly displayedColumns = computed(() => {
    const cols = this.visibleColumns();
    const result: string[] = [];
    if (this.selectionMode() !== 'none') result.push('select');
    result.push(...cols.map(c => c.field));
    result.push('actions');
    return result;
  });

  readonly dataSource = computed(() => {
    const result = this._service.rows();
    return result.rows.map(r => ({ ...r.raw, _id: r.id, _status: r.status }));
  });

  // ── 生命周期 ───────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this._service.initialize({
      datastore: this._datastoreConfig,
      columns: this._columns,
      initialData: [],
      defaultPageSize: this.paginationConfig()?.defaultPageSize ?? 10,
    });
  }

  // ── 工具栏操作 ────────────────────────────────────────────────────────────

  onAdd(): void {
    this.toolbarAction.emit({ action: { type: 'add' } });
  }

  onDeleteSelected(): void {
    const count = this._service.deleteSelected();
    this._snackBar.open(`已删除 ${count} 行`, '关闭', { duration: 2000 });
    this.toolbarAction.emit({ action: { type: 'delete' } });
  }

  onRefresh(): void {
    this._service.reset();
    this._service.setData([]);
    this._snackBar.open('已刷新', '', { duration: 1000 });
    this.toolbarAction.emit({ action: { type: 'refresh' } });
  }

  onCustomAction(btn: { id: string }): void {
    this.toolbarAction.emit({ action: { type: 'custom', id: btn.id } });
  }

  // ── 搜索与过滤 ────────────────────────────────────────────────────────────

  onSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this._service.setGlobalSearch(value);
  }

  clearSearch(): void {
    this._service.setGlobalSearch('');
  }

  onColumnFilter(field: string, value: unknown): void {
    this._service.setColumnFilter(field, value);
  }

  getColumnFilter(field: string): unknown {
    return this._service.state().columnFilters[field];
  }

  // ── 选择 ──────────────────────────────────────────────────────────────────

  toggleSelectAll(checked: boolean): void {
    this._service.selectAll(checked);
  }

  toggleRowSelect(rowId: number, checked: boolean): void {
    this._service.selectRow(rowId, checked);
    this.selectionChanged.emit(this._service.state().selectedRows);
  }

  isRowSelected(rowId: number): boolean {
    return this._service.isSelected(rowId);
  }

  isAllSelected(): boolean {
    const all = this._service.rows().rows;
    return all.length > 0 && all.every(r => this._service.isSelected(r.id));
  }

  isIndeterminate(): boolean {
    const sel = this._service.state().selectedRows.size;
    return sel > 0 && sel < this._service.rows().rows.length;
  }

  // ── 行操作 ────────────────────────────────────────────────────────────────

  editRow(row: DataRow): void {
    this.rowUpdated.emit({ row, changes: row.changes });
  }

  deleteRow(rowId: number): void {
    if (confirm('确认删除?')) {
      this._service.deleteRow(rowId);
      this.rowDeleted.emit(rowId);
    }
  }

  restoreRow(rowId: number): void {
    this._service.restoreRow(rowId);
  }

  rowStatus(row: DataRow | any): string {
    return row._status || (row as DataRow).status || 'normal';
  }

  onRowClick(row: any, event: MouseEvent): void {
    const dr = this._service.getDataStore().getRowById(row._id);
    if (dr) {
      this.rowClicked.emit({ row: dr, event });
    }
    if (this._tableConfig?.rowClick) {
      (this._tableConfig.rowClick as Function)?.(row, event);
    }
  }

  onRowDoubleClick(row: any, event: MouseEvent): void {
    const dr = this._service.getDataStore().getRowById(row._id);
    if (dr) {
      this.rowDoubleClicked.emit({ row: dr, event });
    }
    if (this._tableConfig?.rowDoubleClick) {
      (this._tableConfig.rowDoubleClick as Function)?.(row, event);
    }
  }

  // ── 编辑 ──────────────────────────────────────────────────────────────────

  isEditing(rowId: number, field: string): boolean {
    const e = this._editingCell();
    return e?.rowId === rowId && e?.field === field;
  }

  startEdit(rowId: number, field: string, value: unknown): void {
    this._editingCell.set({ rowId, field });
    this._editValue = value;
  }

  saveEdit(rowId: number, field: string): void {
    if (this._editValue !== null) {
      this._service.updateRow(rowId, { [field]: this._editValue as RawValue });
    }
    this.cancelEdit();
  }

  cancelEdit(): void {
    this._editingCell.set(null);
    this._editValue = null;
  }

  // ── 分页 ──────────────────────────────────────────────────────────────────

  onPageChange(event: PageEvent): void {
    this._service.setPage(event.pageIndex);
    this._service.setPageSize(event.pageSize);
    this.pageChanged.emit(event);
  }

  // ── 格式化 ──────────────────────────────────────────────────────────────────

  formatCell(row: any, col: ColumnConfig): string {
    const val = row[col.field];
    if (col.format) return col.format(val, row);
    if (val === null || val === undefined) return '';
    return String(val);
  }

  // ── 导出 ──────────────────────────────────────────────────────────────────

  exportData(format: 'csv' | 'json'): void {
    if (format === 'csv') {
      const csv = this._service.exportToCSV({ format: 'csv' });
      this._downloadFile(csv, 'export.csv', 'text/csv');
    } else {
      const json = this._service.exportToJSON({ format: 'json' });
      this._downloadFile(json, 'export.json', 'application/json');
    }
  }

  private _downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── 辅助 ──────────────────────────────────────────────────────────────────

  getActionLabel(action: boolean | { label?: string }, fallback: string): string {
    if (typeof action === 'object') return action.label ?? fallback;
    return fallback;
  }

  // ── 公共 API ──────────────────────────────────────────────────────────────

  getService(): DataTableService { return this._service; }

  setData(data: Record<string, RawValue>[]): void { this._service.setData(data); }
  addRow(data: Record<string, RawValue>): DataRow { return this._service.addRow(data); }
  updateRow(rowId: number, data: Partial<Record<string, RawValue>>): boolean {
    return this._service.updateRow(rowId, data);
  }
  deleteRow(rowId: number): boolean { return this._service.deleteRow(rowId); }
  validate() { return this._service.validate(); }
  generateUpdates() { return this._service.generateUpdates(); }
  commit() { this._service.commit(); }
}
