/**
 * DataTableComponent - 主表格组件
 * 封装 Angular Material Table + DataStore 引擎
 */

import {
  Component, Input, Output, EventEmitter, ViewChild, ChangeDetectionStrategy, HostListener,
  signal, computed, OnInit, OnDestroy, OnChanges, ChangeDetectorRef,
  ContentChild, TemplateRef, Inject
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Observable, Subscription } from 'rxjs';
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
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SelectionModel } from '@angular/cdk/collections';
import { ScrollingModule } from '@angular/cdk/scrolling';

import { DataTableService } from './datatable.service';
import {
  ColumnConfig, TableConfig, TableState, ToolbarAction, RowAction,
  ChangeEvent, ExportConfig, DataFeedConfig, HighlightCell
} from './models';
import { DataRow, RowId, RawValue, DataStoreConfig } from './datastore';
import { DataWindowVirtualScrollStrategy, dataWindowVirtualScrollStrategy } from './virtual-scroll-strategy';
import { VIRTUAL_SCROLL_STRATEGY } from '@angular/cdk/scrolling';

export interface ColumnFilterEvent { field: string; value: unknown; }
export interface SortEvent { field: string; direction: 'asc' | 'desc'; }
export interface RowClickEvent { row: DataRow; event: MouseEvent; }
export interface ToolbarEvent { action: ToolbarAction; }

@Component({
  selector: 'ngx-datawindow',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatCheckboxModule, MatInputModule, MatFormFieldModule,
    MatSelectModule, MatButtonModule, MatIconModule,
    MatTooltipModule, ScrollingModule, MatMenuModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="dt-container" [class.dt-loading]="loading()">
      <!-- 标题栏 -->
      @if (config().showTitle !== false && config().title) {
        <div class="dt-title-bar">
          <span class="dt-title">{{ config().title }}</span>
        </div>
      }

      <!-- 工具栏 -->
      @if (config().showToolbar !== false) {
        <div class="dt-toolbar">
          <!-- 全局搜索 -->
          @if (config().showGlobalSearch !== false) {
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
          @if (toolbarActions()?.add) {
            <button mat-flat-button color="primary" (click)="onAdd()"
              [disabled]="loading()">
              <mat-icon>add</mat-icon>
              {{ getActionLabel(toolbarActions()?.add, '新增') }}
            </button>
          }

          @if (toolbarActions()?.delete) {
            <button mat-stroked-button color="warn" (click)="onDeleteSelected()"
              [disabled]="!hasSelection() || loading()">
              <mat-icon>delete</mat-icon>
              {{ getActionLabel(toolbarActions()?.delete, '删除') }}
              @if (selectionCount() > 0) {
                <span class="dt-badge">{{ selectionCount() }}</span>
              }
            </button>
          }

          @if (toolbarActions()?.refresh) {
            <button mat-icon-button (click)="onRefresh()" [disabled]="loading()"
              matTooltip="刷新">
              <mat-icon>refresh</mat-icon>
            </button>
          }

          @if (toolbarActions()?.export) {
            <button mat-icon-button [matMenuTriggerFor]="exportMenu"
              [disabled]="loading()" matTooltip="导出">
              <mat-icon>download</mat-icon>
            </button>
            <mat-menu #exportMenu="matMenu">
              <button mat-menu-item (click)="exportData('csv')">
                <mat-icon>table_chart</mat-icon>
                <span>导出 CSV</span>
              </button>
              <button mat-menu-item (click)="exportData('xlsx')">
                <mat-icon>insert_drive_file</mat-icon>
                <span>导出 Excel</span>
              </button>
              <button mat-menu-item (click)="exportData('json')">
                <mat-icon>code</mat-icon>
                <span>导出 JSON</span>
              </button>
            </mat-menu>
          }

          @if (toolbarActions()?.import !== false) {
            <button mat-icon-button [matMenuTriggerFor]="importMenu"
              [disabled]="loading()" matTooltip="导入">
              <mat-icon>upload</mat-icon>
            </button>
            <mat-menu #importMenu="matMenu">
              <button mat-menu-item (click)="triggerImport('csv')">
                <mat-icon>table_chart</mat-icon>
                <span>导入 CSV</span>
              </button>
              <button mat-menu-item (click)="triggerImport('xlsx')">
                <mat-icon>insert_drive_file</mat-icon>
                <span>导入 Excel</span>
              </button>
            </mat-menu>
            <input type="file" #importFileInput style="display:none"
              accept=".csv,.xlsx,.xls" (change)="onImportFileSelect($event)" />
          }

          @for (btn of toolbarActions()?.custom || []; track btn.id) {
            <button mat-stroked-button (click)="onCustomAction(btn)">
              <mat-icon>{{ btn.icon }}</mat-icon>
              {{ btn.label }}
            </button>
          }
        </div>
      }

      <!-- 列过滤行 -->
      @if (config().showColumnFilter) {
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

      <!-- ═══ 行分组（GroupBy）工具栏 ═══ -->
      @if (config().groupBy && !virtualScrollEnabled()) {
        <div class="dt-groupbar">
          <mat-icon class="dt-groupbar-icon">view_group</mat-icon>
          <span class="dt-groupbar-label">按</span>
          <span class="dt-groupbar-field">{{ getGroupByFieldLabel() }}</span>
          <span class="dt-groupbar-label">分组</span>
          @if (config().groupBy?.collapsed !== undefined) {
            <button mat-icon-button class="dt-groupbar-collapse-btn"
              (click)="toggleGroupByCollapse()"
              [matTooltip]="isGroupByCollapsed() ? '展开分组' : '折叠分组'">
              <mat-icon>{{ isGroupByCollapsed() ? 'expand_more' : 'expand_less' }}</mat-icon>
            </button>
          }
          <span class="dt-toolbar-spacer"></span>
          <button mat-button class="dt-groupbar-clear-btn" (click)="clearGroupBy()">
            <mat-icon>close</mat-icon>
            清除分组
          </button>
        </div>
      }

      <!-- 表格主体 -->
      <div class="dt-table-wrapper" [class.dt-virtual-mode]="virtualScrollEnabled()" [class.dt-fixed-height]="!autoHeight()">
        @if (virtualScrollEnabled()) {
          <!-- ═══ 虚拟滚动模式 — div rows + CDK VirtualScrollStrategy ═══ -->
          <div class="dt-virtual-container">
            <!-- 固定表头 -->
            <div class="dt-virtual-header">
              <div class="dt-virtual-header-row">
                @if (selectionMode() !== 'none') {
                  <div class="dt-virtual-cell dt-virtual-header-cell dt-sticky-left" style="width:48px;min-width:48px;text-align:center;">
                    <mat-checkbox
                      [checked]="isAllSelected()"
                      [indeterminate]="isIndeterminate()"
                      (change)="toggleSelectAll($event.checked)">
                    </mat-checkbox>
                  </div>
                }
                @for (col of visibleColumns(); track col.field) {
                  <div class="dt-virtual-cell dt-virtual-header-cell"
                    [style.width]="col.width || 'auto'"
                    [style.minWidth]="col.minWidth || '60px'"
                    [style.textAlign]="col.align || 'left'"
                    [class.dt-sticky-left]="col.sticky === 'start'"
                    [class.dt-sticky-right]="col.sticky === 'end'"
                    (click)="onVirtualSortChange(col.field)">
                    {{ col.header }}
                    @if (col.aggregate) {
                      <span class="dt-agg-badge">{{ col.aggregate.type.toUpperCase() }}</span>
                    }
                    <div class="dt-resize-handle"
                      (mousedown)="onResizeStart($event, col.field)"
                      (click)="$event.stopPropagation()">
                    </div>
                  </div>
                }
                <div class="dt-virtual-cell dt-virtual-header-cell dt-sticky-right" style="width:96px;min-width:96px;text-align:center;">
                  操作
                </div>
              </div>
            </div>

            <!-- 虚拟滚动体 -->
            <cdk-virtual-scroll-viewport
              class="dt-virtual-viewport"
              (scrolledIndexChange)="onScrollIndexChange($event)">
              <div *cdkVirtualFor="let row of virtualData(); trackBy: trackRow; templateCacheSize: 0"
                   class="dt-virtual-row"
                   [class.dt-row-selected]="isRowSelected(row._id)"
                   [class.dt-row-new]="row._status === 'new'"
                   [class.dt-row-modified]="row._status === 'modified'"
                   [class.dt-row-deleted]="row._status === 'deleted'"
                   (click)="onRowClick(row, $event)"
                   (dblclick)="onRowDoubleClick(row, $event)">
                @if (selectionMode() !== 'none') {
                  <div class="dt-virtual-cell dt-sticky-left" style="width:48px;min-width:48px;text-align:center;">
                    <mat-checkbox
                      [checked]="isRowSelected(row._id)"
                      (change)="toggleRowSelect(row._id, $event.checked)"
                      (click)="$event.stopPropagation()">
                    </mat-checkbox>
                  </div>
                }
                @for (col of visibleColumns(); track col.field) {
                  <div class="dt-virtual-cell"
                    [style.width]="col.width || 'auto'"
                    [style.minWidth]="col.minWidth || '60px'"
                    [style.textAlign]="col.align || 'left'"
                    [class.dt-sticky-left]="col.sticky === 'start'"
                    [class.dt-sticky-right]="col.sticky === 'end'"
                    [class.dt-cell-highlight]="isCellHighlighted(row._id, col.field)">
                    @if (col.cellRenderer) {
                      <span [innerHTML]="sanitizeHtml(col.cellRenderer(row[col.field], row))"></span>
                    } @else if (col.editable && isEditing(row._id, col.field)) {
                      <input class="dt-edit-input" [(ngModel)]="editValue"
                        (blur)="saveEdit(row._id, col.field)"
                        (keydown.enter)="saveEdit(row._id, col.field)"
                        (keydown.escape)="cancelEdit()"
                        [type]="col.editType === 'number' ? 'number' : 'text'"
                        style="width:100%">
                    } @else if (col.editable) {
                      <span class="dt-cell-editable" (dblclick)="startEdit(row._id, col.field, row[col.field])">
                        {{ formatCell(row, col) }}
                      </span>
                    } @else {
                      {{ formatCell(row, col) }}
                    }
                  </div>
                }
                <div class="dt-virtual-cell dt-sticky-right" style="width:96px;min-width:96px;text-align:center;">
                  @if (row._status === 'deleted') {
                    <button mat-button color="primary" (click)="restoreRow(row._id); $event.stopPropagation()" style="min-width:auto;padding:0 8px;font-size:12px;">
                      恢复
                    </button>
                  } @else {
                    <button mat-icon-button matTooltip="编辑" (click)="editRow(row); $event.stopPropagation()" style="width:28px;height:28px;">
                      <mat-icon style="font-size:18px;">edit</mat-icon>
                    </button>
                    <button mat-icon-button color="warn" matTooltip="删除" (click)="deleteRow(row._id); $event.stopPropagation()" style="width:28px;height:28px;">
                      <mat-icon style="font-size:18px;">delete</mat-icon>
                    </button>
                  }
                </div>
              </div>

              <!-- 空状态 -->
              @if (virtualData().length === 0) {
                <div class="dt-virtual-empty">
                  {{ config().emptyMessage || '暂无数据' }}
                </div>
              }
            </cdk-virtual-scroll-viewport>
          </div>
        } @else {
          <!-- 普通分页模式 -->
          <table mat-table [dataSource]="dataSource()" matSort (matSortChange)="onSortChange($event)" class="dt-table">

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
                [style.minWidth]="col.minWidth || '60px'"
                class="dt-header-resizable"
                [mat-sort-header]="col.sortable !== false ? col.field : ''"
                [disabled]="col.sortable === false">
                {{ col.header }}
                @if (col.aggregate) {
                  <span class="dt-agg-badge">{{ col.aggregate.type.toUpperCase() }}</span>
                }
                <div class="dt-resize-handle"
                  (mousedown)="onResizeStart($event, col.field)"
                  (click)="$event.stopPropagation()">
                </div>
              </th>
              <td mat-cell *matCellDef="let row"
                [style.textAlign]="col.align || 'left'"
                [ngStyle]="col.cellStyle ? col.cellStyle(row[col.field], row) : null"
                [ngClass]="col.cellClass ? col.cellClass(row[col.field], row) : ''"
                [class.dt-cell-highlight]="isCellHighlighted(row._id, col.field)">
                @if (col.cellRenderer) {
                  <span [innerHTML]="sanitizeHtml(col.cellRenderer(row[col.field], row))"></span>
                } @else if (col.editable) {
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

          <!-- ═══ 分组行（GroupBy）═════════════════════════════════════════════════ -->
          @for (grp of groupRows(); track grp.key) {
            <tr class="dt-group-row"
              [class.dt-group-row-collapsed]="grp.collapsed"
              (click)="toggleGroupCollapse(grp.key)">
              <td [attr.colspan]="displayedColumns().length" class="dt-group-row-cell">
                <mat-icon class="dt-group-toggle-icon">
                  {{ grp.collapsed ? 'chevron_right' : 'expand_more' }}
                </mat-icon>
                <span class="dt-group-title">
                  {{ grp.title || grp.key }}
                </span>
                <span class="dt-group-count">{{ grp.rows.length }} 条</span>
                @for (agg of getGroupAggregations(grp); track agg.field) {
                  <span class="dt-group-agg">
                    <span class="dt-group-agg-label">{{ agg.label }}:</span>
                    <span class="dt-group-agg-value">{{ agg.value | number:'1.0-2' }}</span>
                  </span>
                }
              </td>
            </tr>
            @if (!grp.collapsed) {
              @for (row of grp.rows; track row.id) {
                <tr class="dt-group-child-row"
                  [class.dt-row-selected]="isRowSelected(row.id)"
                  [class.dt-row-new]="row.status === 'new'"
                  [class.dt-row-modified]="row.status === 'modified'"
                  [class.dt-row-deleted]="row.status === 'deleted'"
                  [class.dt-clickable]="config().rowClick || true"
                  (click)="onRowClick(row, $event)"
                  (dblclick)="onRowDoubleClick(row, $event)">
                  @if (selectionMode() !== 'none') {
                    <td style="width:48px;min-width:48px;text-align:center;padding:0 8px;border-right:1px solid var(--dt-grid-color);">
                      <mat-checkbox [checked]="isRowSelected(row.id)"
                        (change)="toggleRowSelect(row.id, $event.checked)"
                        (click)="$event.stopPropagation()">
                      </mat-checkbox>
                    </td>
                  }
                  @for (col of visibleColumns(); track col.field) {
                    <td class="dt-group-child-cell"
                      [style.textAlign]="col.align || 'left'"
                      [style.width]="col.width || 'auto'"
                      [style.minWidth]="col.minWidth || '60px'"
                      [class.dt-cell-highlight]="isCellHighlighted(row.id, col.field)">
                      {{ formatCell(row, col) }}
                    </td>
                  }
                  <td style="width:120px;min-width:120px;text-align:center;padding:0 8px;">
                    <button mat-icon-button matTooltip="编辑" (click)="editRow(row); $event.stopPropagation()">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button color="warn" matTooltip="删除"
                      (click)="deleteRow(row.id); $event.stopPropagation()">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </td>
                </tr>
              }
            }
          }

          <!-- 数据行（非分组模式下） -->
          @if (!config().groupBy) {
            <tr mat-row *matRowDef="let row; columns: displayedColumns()"
            [class.dt-row-selected]="isRowSelected(row.id)"
            [class.dt-row-new]="row.status === 'new'"
            [class.dt-row-modified]="row.status === 'modified'"
            [class.dt-row-deleted]="row.status === 'deleted'"
            [class.dt-clickable]="config().rowClick || true"
            (click)="onRowClick(row, $event)"
            (dblclick)="onRowDoubleClick(row, $event)">
          </tr>
          }

          <!-- 空状态 -->
          <tr class="mat-row" *matNoDataRow>
            <td class="mat-cell dt-empty" [attr.colspan]="displayedColumns().length">
              {{ config().emptyMessage || '暂无数据' }}
            </td>
          </tr>
        </table>
        }
      </div>

      <!-- 分页器 -->
      @if (config().showPaginator !== false) {
        <div class="dt-paginator-wrapper">
          <mat-paginator
            [length]="totalRows()"
            [pageIndex]="pageIndex()"
            [pageSize]="pageSize()"
            [pageSizeOptions]="paginationConfig()?.pageSizeOptions || [10, 25, 50, 100]"
            [showFirstLastButtons]="true"
            (page)="onPageChange($event)">
          </mat-paginator>
        </div>
      }

      <!-- 加载遮罩 -->
      @if (loading()) {
        <div class="dt-overlay">
          <mat-progress-spinner diameter="40"></mat-progress-spinner>
          <span>{{ config().loadingMessage || '加载中...' }}</span>
        </div>
      }
    </div>

    <!-- 编辑单元格模板（默认内联编辑） -->
    <ng-template #editCell let-row let-col="col">
      @if (isEditing(row.id, col.field)) {
        @if (col.editType === 'select' && col.editOptions) {
          <select class="dt-edit-select"
            [ngModel]="editValue"
            (change)="onSelectChange($event)"
            (blur)="saveEdit(row.id, col.field)"
            (keydown.escape)="cancelEdit()">
            @for (opt of col.editOptions; track opt.value) {
              <option [value]="opt.value">{{ opt.label }}</option>
            }
          </select>
        } @else {
          <input class="dt-edit-input" [(ngModel)]="editValue"
            (blur)="saveEdit(row.id, col.field)"
            (keydown.enter)="saveEdit(row.id, col.field)"
            (keydown.escape)="cancelEdit()"
            [type]="col.editType === 'number' ? 'number' : 'text'">
        }
      } @else {
        <span class="dt-cell-editable" (dblclick)="startEdit(row.id, col.field, row.raw[col.field])">
          {{ formatCell(row, col) }}
        </span>
      }
    </ng-template>
  `,
  styles: [`
    :host {
      --dt-control-height: 32px;
      --dt-row-height: 36px;
      --dt-border-color: #e0e0e0;
      --dt-border-radius: 4px;
      --dt-font-size: 14px;
      --dt-primary: #1976d2;
      --dt-primary-light: #e3f2fd;
      --dt-grid-color: #e0e0e0;
      --dt-grid-width: 1px;
    }

    .dt-container {
      display: flex;
      flex-direction: column;
      background: #fff;
      border: var(--dt-grid-width) solid var(--dt-grid-color);
      border-radius: var(--dt-border-radius);
      overflow: hidden;
    }

    .dt-title-bar {
      padding: 10px 14px;
      border-bottom: var(--dt-grid-width) solid var(--dt-border-color);
      background: #fafafa;
    }

    .dt-title {
      font-size: 15px;
      font-weight: 500;
    }

    .dt-toolbar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: #fff;
      border-bottom: var(--dt-grid-width) solid var(--dt-border-color);
      flex-wrap: wrap;
    }

    .dt-toolbar-spacer { flex: 1; }

    .dt-search {
      width: 200px;
      font-size: var(--dt-font-size);
    }

    .dt-search .mat-mdc-form-field-subscript-wrapper { display: none; }
    .dt-search .mat-mdc-text-field-wrapper { padding: 0 6px !important; }
    .dt-search .mat-mdc-form-field-infix { min-height: 28px !important; padding: 3px 0 !important; }
    .dt-search input { font-size: var(--dt-font-size) !important; }
    .dt-search .mat-mdc-floating-label { font-size: 13px !important; top: 14px !important; }

    .dt-badge {
      margin-left: 4px;
      background: var(--dt-primary);
      color: #fff;
      border-radius: 6px;
      padding: 1px 5px;
      font-size: 11px;
    }

    .dt-column-filters {
      display: flex;
      gap: 6px;
      padding: 8px 12px;
      background: #fafafa;
      border-bottom: var(--dt-grid-width) solid var(--dt-border-color);
      overflow-x: auto;
      min-height: 52px;
      align-items: flex-start;
    }

    .dt-filter-cell {
      flex-shrink: 0;
      padding-top: 2px;
    }

    .dt-filter-input {
      width: 130px;
      font-size: 13px;
    }

    .dt-filter-input .mat-mdc-form-field-subscript-wrapper { display: none; }
    .dt-filter-input .mat-mdc-text-field-wrapper { padding: 0 4px !important; height: 32px !important; }
    .dt-filter-input .mat-mdc-form-field-infix { min-height: 32px !important; padding: 6px 0 6px 0 !important; display: flex !important; align-items: center !important; }
    .dt-filter-input .mat-mdc-form-field-flex { height: 32px !important; min-height: 32px !important; }
    .dt-filter-input input { font-size: 13px !important; line-height: 1.2 !important; }
    .dt-filter-input .mat-mdc-floating-label { font-size: 12px !important; top: 16px !important; }
    .dt-filter-input .mat-mdc-floating-label.mat-mdc-floating-label-shown { top: 0px !important; font-size: 10px !important; }
    .dt-filter-input .mat-mdc-select { font-size: 13px !important; }
    .dt-filter-input .mat-mdc-select-trigger { height: 22px !important; padding-top: 2px !important; }
    .dt-filter-input .mat-mdc-select-value-text { font-size: 13px !important; }

    .dt-table-wrapper {
      flex: 1;
      overflow: auto;
      position: relative;
    }

    .dt-table-wrapper.dt-virtual-mode {
      overflow: auto;
    }

    .dt-virtual-viewport {
      height: 100%;
      min-height: 400px;
    }

    /* ═══ 虚拟滚动 div 行布局 ═══ */
    .dt-virtual-container {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .dt-virtual-header {
      flex-shrink: 0;
      border-bottom: var(--dt-grid-width) solid var(--dt-grid-color);
      overflow: hidden;
    }

    .dt-virtual-header-row,
    .dt-virtual-row {
      display: flex;
      align-items: center;
      height: var(--dt-row-height);
      min-height: var(--dt-row-height);
      border-bottom: var(--dt-grid-width) solid var(--dt-grid-color);
    }

    .dt-virtual-row:hover {
      background: #f5f5f5;
    }

    .dt-virtual-cell {
      flex: 0 0 auto;
      padding: 0 8px;
      font-size: var(--dt-font-size);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      border-right: var(--dt-grid-width) solid var(--dt-grid-color);
    }

    .dt-virtual-cell:last-child {
      border-right: none;
    }

    .dt-virtual-header-cell {
      font-weight: 600;
      background: #fafafa;
      color: #212121;
      position: relative;
      user-select: none;
      cursor: pointer;
    }

    .dt-virtual-empty {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 28px;
      color: #757575;
      font-size: var(--dt-font-size);
    }

    /* 虚拟模式下的行状态颜色 */
    .dt-virtual-row.dt-row-selected { background: #bbdefb !important; }
    .dt-virtual-row.dt-row-new { background: #c8e6c9 !important; }
    .dt-virtual-row.dt-row-modified { background: #fff9c4 !important; }
    .dt-virtual-row.dt-row-deleted { background: #ffcdd2 !important; opacity: 0.65; text-decoration: line-through; }

    /* 虚拟模式 sticky 列 */
    .dt-virtual-cell.dt-sticky-left {
      position: sticky;
      left: 0;
      z-index: 2;
      background: inherit;
    }
    .dt-virtual-header-cell.dt-sticky-left {
      background: #fafafa;
      z-index: 12;
    }
    .dt-virtual-cell.dt-sticky-right {
      position: sticky;
      right: 0;
      z-index: 2;
      background: inherit;
      box-shadow: -2px 0 6px rgba(0,0,0,0.08);
    }
    .dt-virtual-header-cell.dt-sticky-right {
      background: #fafafa;
      z-index: 12;
      box-shadow: -2px 0 6px rgba(0,0,0,0.08);
    }

    .dt-table-wrapper.dt-fixed-height {
      max-height: var(--dt-max-height, 480px);
    }

    .dt-table {
      width: 100%;
      border-collapse: collapse;
    }

    /* 表头固定 - 使用 Material 原生 sticky */
    .dt-table thead {
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .dt-table th.mat-mdc-header-cell {
      font-weight: 600;
      background: #fafafa;
      color: #212121;
      font-size: var(--dt-font-size);
      height: var(--dt-row-height) !important;
      padding: 0 8px !important;
      border-bottom: var(--dt-grid-width) solid var(--dt-grid-color) !important;
      border-right: var(--dt-grid-width) solid var(--dt-grid-color);
    }

    .dt-table th.mat-mdc-header-cell:last-child {
      border-right: none;
    }

    /* 可调整列宽 */
    .dt-header-resizable {
      position: relative;
    }
    .dt-resize-handle {
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      width: 5px;
      cursor: col-resize;
      background: transparent;
      z-index: 1;
    }
    .dt-resize-handle:hover {
      background: var(--dt-primary);
      opacity: 0.5;
    }
    .dt-resize-handle:active {
      background: var(--dt-primary);
    }
    .dt-resizing {
      user-select: none;
    }

    /* 列宽调整虚线指示器 */
    .dt-resize-line {
      position: fixed;
      top: 0;
      width: 0;
      border-left: 2px dashed var(--dt-primary);
      pointer-events: none;
      z-index: 9999;
      opacity: 0.7;
    }

    /* 列宽调整时，原列显示半透明蓝色预览 */
    .dt-resize-preview {
      background: rgba(25, 118, 210, 0.08) !important;
    }

    .dt-resizing .dt-table {
      cursor: col-resize;
    }

    .dt-table td.mat-mdc-cell {
      padding: 0 8px;
      font-size: var(--dt-font-size);
      border-bottom: var(--dt-grid-width) solid var(--dt-grid-color);
      border-right: var(--dt-grid-width) solid var(--dt-grid-color);
    }

    .dt-table td.mat-mdc-cell:last-child {
      border-right: none;
    }

    /* 分页器容器 */
    .dt-paginator-wrapper {
      flex-shrink: 0;
      background: #fafafa;
      border-top: none;
      display: flex;
      align-items: center;
      height: var(--dt-row-height);
    }

    .dt-row-selected {
      background: #bbdefb !important;
    }
    .dt-row-new {
      background: #c8e6c9 !important;
    }
    .dt-row-modified {
      background: #fff9c4 !important;
    }
    .dt-row-deleted {
      background: #ffcdd2 !important;
      opacity: 0.65;
      text-decoration: line-through;
    }
    .dt-clickable {
      cursor: pointer;
    }

    .dt-row-selected .dt-cell-editable:hover,
    .dt-row-new .dt-cell-editable:hover,
    .dt-row-modified .dt-cell-editable:hover {
      background: rgba(0,0,0,0.04);
    }

    .dt-agg-badge {
      display: inline-block;
      margin-left: 3px;
      font-size: 10px;
      background: var(--dt-primary);
      color: #fff;
      border-radius: 3px;
      padding: 1px 4px;
      font-weight: 400;
    }

    .dt-empty {
      text-align: center;
      padding: 28px !important;
      color: #757575;
      font-size: var(--dt-font-size);
    }

    /* 可编辑单元格 */
    .dt-cell-editable {
      cursor: text;
      display: block;
      padding: 3px 4px;
      border-radius: 2px;
      min-height: 18px;
    }
    .dt-cell-editable:hover {
      background: #f0f0f0;
    }

    /* 实时数据更新高亮 */
    .dt-cell-highlight {
      animation: dt-cell-flash 0.4s ease-out;
    }
    @keyframes dt-cell-flash {
      0% { background: #fff8e1; }
      100% { background: transparent; }
    }

    .dt-edit-input {
      width: 100%;
      border: 1px solid var(--dt-primary);
      border-radius: 2px;
      padding: 3px 5px;
      font-size: var(--dt-font-size);
      outline: none;
      background: #fff;
    }

    .dt-edit-select {
      width: 100%;
      font-size: var(--dt-font-size);
      padding: 2px 3px;
      border: 1px solid var(--dt-primary);
      border-radius: 2px;
      background: #fff;
      height: 26px;
    }

    .dt-overlay {
      position: absolute;
      inset: 0;
      background: rgba(255,255,255,0.9);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      z-index: 10;
    }

    .dt-loading .dt-table-wrapper { filter: blur(1px); pointer-events: none; }

    /* ═══ 分组行样式 ═══ */
    .dt-groupbar {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: #f0f4ff;
      border-bottom: 1px solid var(--dt-grid-color);
      font-size: 13px;
    }
    .dt-groupbar-icon { font-size: 16px; color: #1565c0; }
    .dt-groupbar-field { font-weight: 600; color: #1565c0; }
    .dt-groupbar-label { color: #666; }
    .dt-groupbar-collapse-btn { width: 24px; height: 24px; line-height: 24px; }
    .dt-groupbar-clear-btn { font-size: 12px; color: #999; }

    /* 分组 header 行 */
    .dt-group-row {
      cursor: pointer;
      background: #e3f0ff !important;
      border-bottom: 1px solid #bbdefb !important;
    }
    .dt-group-row:hover { background: #d0e8ff !important; }
    .dt-group-row td { padding: 5px 8px !important; font-size: 13px; }
    .dt-group-toggle-icon {
      font-size: 18px;
      vertical-align: middle;
      color: #1976d2;
      margin-right: 4px;
    }
    .dt-group-title {
      font-weight: 600;
      color: #0d47a1;
      margin-right: 8px;
    }
    .dt-group-count {
      color: #666;
      font-size: 12px;
      margin-right: 12px;
    }
    .dt-group-agg {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      margin-left: 12px;
      font-size: 12px;
    }
    .dt-group-agg-label { color: #888; }
    .dt-group-agg-value { font-weight: 600; color: #1565c0; }

    /* 分组子行 — 用普通 tr 而非 mat-row 以避免 mat-sort 干扰 */
    .dt-group-child-row {
      height: var(--dt-row-height) !important;
      border-bottom: 1px solid var(--dt-grid-color);
    }
    .dt-group-child-row:hover { background: #f5f5f5; }
    .dt-group-child-row td {
      padding: 0 8px !important;
      font-size: var(--dt-font-size);
      border-right: 1px solid var(--dt-grid-color);
      height: var(--dt-row-height);
      vertical-align: middle;
    }
    .dt-group-child-row td:last-child { border-right: none; }

    /* Material 分页器覆盖 */
    ::ng-deep .dt-paginator-wrapper .mat-mdc-paginator {
      background: #fafafa;
      min-height: var(--dt-row-height) !important;
      height: var(--dt-row-height) !important;
    }
    ::ng-deep .dt-paginator-wrapper .mat-mdc-paginator-outer-container {
      height: var(--dt-row-height) !important;
    }
    ::ng-deep .dt-paginator-wrapper .mat-mdc-paginator-container {
      min-height: var(--dt-row-height) !important;
      height: var(--dt-row-height) !important;
      padding: 0 8px !important;
      justify-content: space-between;
      align-items: center;
    }
    ::ng-deep .dt-paginator-wrapper .mat-mdc-paginator-page-size {
      display: flex;
      align-items: center;
      height: var(--dt-row-height);
    }
    ::ng-deep .dt-paginator-wrapper .mat-mdc-paginator-page-size-label {
      font-size: 13px;
      color: #666;
      margin-right: 4px;
    }
    ::ng-deep .dt-paginator-wrapper .mat-mdc-paginator-page-size-select {
      width: 50px;
      margin-left: 4px;
    }
    ::ng-deep .dt-paginator-wrapper .mat-mdc-select-value {
      font-size: 13px;
    }
    ::ng-deep .dt-paginator-wrapper .mat-mdc-paginator-range-label {
      font-size: 13px;
      color: #666;
      margin: 0 8px;
    }
    ::ng-deep .dt-paginator-wrapper .mat-mdc-paginator-navigation-buttons {
      display: flex;
      align-items: center;
    }
    ::ng-deep .dt-paginator-wrapper .mat-mdc-icon-button {
      width: 28px !important;
      height: 28px !important;
      padding: 0 !important;
    }
    ::ng-deep .dt-paginator-wrapper .mat-mdc-icon-button .mat-icon {
      font-size: 18px !important;
      width: 18px !important;
      height: 18px !important;
    }
    
    /* Material 表格行覆盖 - 强制统一高度 */
    ::ng-deep .dt-container .mat-mdc-header-row {
      height: var(--dt-row-height) !important;
      min-height: var(--dt-row-height) !important;
    }
    ::ng-deep .dt-container .mat-mdc-row {
      height: var(--dt-row-height) !important;
      min-height: var(--dt-row-height) !important;
    }
    ::ng-deep .dt-container .mat-mdc-cell {
      height: var(--dt-row-height) !important;
      padding: 0 8px !important;
    }
    ::ng-deep .dt-container .mat-mdc-header-cell {
      height: var(--dt-row-height) !important;
      padding: 0 8px !important;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [dataWindowVirtualScrollStrategy({ itemSize: 36, minBufferPx: 360, maxBufferPx: 720 })],
})
export class DataTableComponent implements OnInit, OnChanges, OnDestroy {
  constructor(
    private _service: DataTableService,
    private _cdr: ChangeDetectorRef,
    private _sanitizer: DomSanitizer,
    @Inject(VIRTUAL_SCROLL_STRATEGY) readonly scrollStrategy: DataWindowVirtualScrollStrategy,
  ) {}

  // ── 输入 ──────────────────────────────────────────────────────────────────

  private _pendingData: Record<string, RawValue>[] | null = null;
  private _initialized = false;
  private _dataFeedSub: Subscription | null = null;
  private _highlightCells = signal<Map<string, HighlightCell>>(new Map());
  private _collapsedGroups = signal<Set<string>>(new Set());
  private _lastRangeSelectId: number | null = null;

  @Input() set datastoreConfig(v: DataStoreConfig) {
    this._datastoreConfig = v;
    this._tryInitialize();
  }
  @Input() set columns(v: ColumnConfig[]) {
    this._columns = v;
    this._tryInitialize();
  }
  @Input() set data(v: Record<string, RawValue>[]) {
    if (v && v.length > 0) {
      if (this._initialized && this._service && this._service['_ds']) {
        // 服务已初始化，直接设置数据
        this._service.setData(v);
        if (this._virtualScrollEnabled()) {
          this._syncAllRows();
        }
      } else {
        // 服务未初始化，缓存数据
        this._pendingData = v;
        this._tryInitialize();
      }
    }
  }
  @Input() set tableConfig(v: TableConfig) {
    this._tableConfig = v;
    this._tryInitialize();
  }
  @Input() set isLoading(v: boolean) { this._loadingInput.set(v ?? false); }

  /** 实时数据源（Observable） */
  @Input() set data$(source: Observable<unknown> | undefined) {
    this._cleanupDataFeed();
    if (source && this._initialized) {
      this._subscribeDataFeed(source as Observable<Record<string, RawValue>>, 'replace');
    } else if (source) {
      this._pendingDataSource = source as Observable<Record<string, RawValue>>;
    }
  }

  /** 实时数据配置（支持 merge/append 模式） */
  @Input() set dataFeed(config: DataFeedConfig<unknown> | undefined) {
    this._cleanupDataFeed();
    if (config?.source && this._initialized) {
      this._subscribeDataFeedAdvanced(config as DataFeedConfig);
    } else if (config?.source) {
      this._pendingDataFeed = config as DataFeedConfig;
    }
  }

  private _pendingDataSource: Observable<Record<string, RawValue>> | null = null;
  private _pendingDataFeed: DataFeedConfig | null = null;

  private _tryInitialize(): void {
    // 需要所有必要配置都就绪
    if (this._initialized) return;
    if (!this._datastoreConfig?.fields?.length) return;
    if (!this._columns?.length) return;

    // 初始化服务
    this._initialized = true;
    this._service!.initialize({
      datastore: this._datastoreConfig,
      columns: this._columns,
      initialData: this._pendingData ?? [],
      defaultPageSize: this._tableConfig?.pagination?.defaultPageSize ?? 10,
    });

    // 清除缓存
    this._pendingData = null;

    // 初始化虚拟滚动
    const vs = this._tableConfig?.virtualScroll;
    if (vs?.enabled) {
      this._virtualRowHeight.set(vs.rowHeight ?? 36);
      this._virtualScrollEnabled.set(true);
      this._service!.setPageSize(999999);
      this._syncAllRows();
    }

    // 监听数据变化
    const ds = this._service!.getDataStore();
    if (ds) {
      ds.on('rowAdded', () => this._syncAllRows());
      ds.on('rowUpdated', () => this._syncAllRows());
      ds.on('rowRemoved', () => this._syncAllRows());
      ds.on('bufferChanged', () => this._syncAllRows());
    }

    // 订阅待处理的实时数据源
    if (this._pendingDataSource) {
      this._subscribeDataFeed(this._pendingDataSource, 'replace');
      this._pendingDataSource = null;
    }
    if (this._pendingDataFeed) {
      this._subscribeDataFeedAdvanced(this._pendingDataFeed);
      this._pendingDataFeed = null;
    }
  }

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
  private _loadingInput = signal(false);
  private _editingCell = signal<{ rowId: number; field: string } | null>(null);
  private _editValueInternal: unknown = null;
  get editValue(): unknown { return this._editValueInternal; }
  set editValue(v: unknown) { this._editValueInternal = v; }
  private _virtualRowHeight = signal(36);
  private _virtualScrollEnabled = signal(false);
  private _virtualScrollIndex = signal(0);
  private _allRows = signal<DataRow[]>([]);

  /** TrackBy for virtual scroll rows */
  trackRow = (_index: number, row: any): string => row._id ?? row.id ?? String(_index);

  // ── 响应式 ────────────────────────────────────────────────────────────────────────

  readonly loading = this._loadingInput.asReadonly();
  readonly searchQuery = () => this._service!.state().globalSearch;
  readonly pageIndex = () => this._service!.state().pageIndex;
  readonly pageSize = () => this._service!.state().pageSize;
  readonly totalRows = () => this._service!.totalRows();
  hasSelection(): boolean { return this._service!.hasSelection(); }
  selectionCount(): number { return this._service!.selectionCount(); }

  readonly selectionMode = computed(() => this._tableConfig?.selectionMode ?? 'none');
  readonly toolbarActions = computed(() => this._tableConfig?.toolbarActions);
  readonly paginationConfig = computed(() => this._tableConfig?.pagination);
  readonly autoHeight = computed(() => this._tableConfig?.autoHeight ?? true);

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

  // ── MatTableDataSource（用实例属性，避免每次 computed 重建导致 mat-sort 状态丢失）
  private _matTableDataSource = new MatTableDataSource<any>([]);

  readonly dataSource = computed(() => {
    const result = this._service!.rows();
    const data = result.rows.map((r: DataRow) => ({ ...r.raw, _id: r.id, _status: r.status }));
    // 直接替换 data 而非重建 MatTableDataSource 实例，保留 mat-sort 内部状态
    this._matTableDataSource.data = data;
    return this._matTableDataSource;
  });

  // ── 虚拟滚动 ─────────────────────────────────────────────────────────────

  readonly virtualScrollEnabled = computed(() => {
    const vs = this._tableConfig?.virtualScroll;
    return vs?.enabled === true;
  });

  readonly virtualRowHeight = computed(() => {
    return this._tableConfig?.virtualScroll?.rowHeight ?? 36;
  });

  readonly virtualData = computed(() => {
    return this._allRows().map(r => ({ ...r.raw, _id: r.id, _status: r.status } as any));
  });

  // ── GroupBy ──────────────────────────────────────────────────────────────

  /** 分组行（用于普通分页模式） */
  readonly groupRows = computed(() => {
    const cfg = this._tableConfig?.groupBy;
    if (!cfg || this._virtualScrollEnabled()) return [];

    const field = cfg.field;
    const collapsed = this._collapsedGroups();
    const allRows = this._service!.rows().rows;

    // 按分组字段聚合
    const map = new Map<string, DataRow[]>();
    for (const row of allRows) {
      const key = String(row.raw[field] ?? '(null)');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(row);
    }

    const titleTemplate = cfg.titleTemplate;
    return Array.from(map.entries()).map(([key, rows]) => {
      const isCollapsed = collapsed.has(key) || (cfg.collapsed && !collapsed.size);
      return {
        key,
        title: titleTemplate ? titleTemplate(key, rows.length) : key,
        rows,
        collapsed: isCollapsed,
      };
    });
  });

  trackGroupByKey(_index: number, grp: { key: string }): string {
    return grp.key;
  }

  getGroupByFieldLabel(): string {
    const field = this._tableConfig?.groupBy?.field;
    if (!field) return field ?? '';
    const col = this._columns.find(c => c.field === field);
    return col?.header ?? field;
  }

  isGroupByCollapsed(): boolean {
    const collapsed = this._collapsedGroups();
    const cfg = this._tableConfig?.groupBy;
    if (!cfg) return false;
    // 当所有组都被折叠时，groupByCollapsed 信号返回 true
    const allKeys = Array.from(this.groupRows().map(g => g.key));
    return allKeys.every(k => collapsed.has(k));
  }

  toggleGroupByCollapse(): void {
    const collapsed = this._collapsedGroups();
    const allKeys = Array.from(this.groupRows().map(g => g.key));
    const allCollapsed = allKeys.every(k => collapsed.has(k));
    if (allCollapsed) {
      this._collapsedGroups.set(new Set());
    } else {
      this._collapsedGroups.set(new Set(allKeys));
    }
  }

  toggleGroupCollapse(key: string): void {
    this._collapsedGroups.update(s => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  clearGroupBy(): void {
    this._collapsedGroups.set(new Set());
    this._tableConfig = { ...this._tableConfig, groupBy: undefined };
  }

  getGroupAggregations(grp: { key: string; rows: DataRow[] }): Array<{ field: string; label: string; value: number }> {
    const result: Array<{ field: string; label: string; value: number }> = [];
    const cols = this._columns;
    for (const col of cols) {
      if (!col.aggregate) continue;
      const nums = grp.rows
        .map(r => r.raw[col.field])
        .filter((v): v is number => typeof v === 'number' && !isNaN(v));
      if (!nums.length) continue;
      let value = 0;
      switch (col.aggregate.type) {
        case 'sum':   value = nums.reduce((a, b) => a + b, 0); break;
        case 'avg':   value = nums.reduce((a, b) => a + b, 0) / nums.length; break;
        case 'count': value = nums.length; break;
        case 'min':   value = Math.min(...nums); break;
        case 'max':   value = Math.max(...nums); break;
      }
      result.push({ field: col.field, label: col.aggregate.type, value });
    }
    return result;
  }

  // ── 生命周期 ───────────────────────────────────────────────────────────────

  ngOnInit(): void {
    // 初始化逻辑已移到 _tryInitialize()，由各个 Input setter 触发
  }

  ngOnChanges(changes: Record<string, unknown>): void {
    if ((changes as any).data && this._virtualScrollEnabled()) {
      this._syncAllRows();
    }
    if ((changes as any).tableConfig && (changes as any).tableConfig.currentValue) {
      const vs = (changes as any).tableConfig.currentValue?.virtualScroll;
      if (vs?.enabled && !this._virtualScrollEnabled()) {
        this._virtualRowHeight.set(vs.rowHeight ?? 48);
        this._virtualScrollEnabled.set(true);
        this._service!.setPageSize(999999);
        this._syncAllRows();
      }
    }
  }

  ngOnDestroy(): void {
    this._cleanupDataFeed();
  }

  private _syncAllRows(): void {
    const ds = this._service!.getDataStore();
    if (ds) {
      // 应用当前排序规则（使用 query 而非 getRows，否则虚拟滚动排序失效）
      const s = this._service!.state();
      const queryOpts: any = { take: 999999 };
      if (s.sortField) {
        queryOpts.sort = [{ field: s.sortField, direction: s.sortDirection ?? 'asc' }];
      }
      const result = ds.query(queryOpts);
      this._allRows.set(result.rows);
      if (this._virtualScrollEnabled()) {
        this.scrollStrategy.setDataLength(result.total);
      }
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 键盘导航
  // 目标：ArrowUp/Down 移动焦点行，Enter 编辑，Tab 切换字段，Ctrl+A 全选
  // ════════════════════════════════════════════════════════════════════════════

  /** @HostListener 由 Component 直接装饰，无需在 ngInit 中注册 */
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // 仅在启用键盘导航时处理
    if (this._tableConfig?.keyboardNavigation === false) return;

    const allRows = this._allRows();
    const focusedRow = this._service!.state().focusedRowId ?? (allRows.length ? allRows[0].id : null);
    if (focusedRow === null) return;

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        this._navigateRow(focusedRow, 'up', allRows);
        break;
      case 'ArrowDown':
        event.preventDefault();
        this._navigateRow(focusedRow, 'down', allRows);
        break;
      case 'Enter':
        event.preventDefault();
        if (this._editingCell()) {
          this.saveEdit(focusedRow, this._editingCell()!.field);
        } else {
          this._beginEditFocusedRow(focusedRow);
        }
        break;
      case 'Escape':
        if (this._editingCell()) { this.cancelEdit(); }
        break;
      case 'Tab':
        event.preventDefault();
        this._tabField(event.shiftKey ? 'prev' : 'next');
        break;
      case 'a':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          allRows.forEach(r => this._service!.selectRow(r.id, true));
        }
        break;
    }
  }

  private _navigateRow(currentId: number, dir: 'up' | 'down', allRows: DataRow[]): void {
    const idx = allRows.findIndex(r => r.id === currentId);
    const next = dir === 'down'
      ? Math.min(idx + 1, allRows.length - 1)
      : Math.max(idx - 1, 0);
    if (next !== idx && allRows[next]) {
      this._service!.getDataStore().setFocusedRow(allRows[next].id);
    }
  }

  private _beginEditFocusedRow(rowId: number): void {
    const col = this._columns.find(c => c.editable);
    if (!col) return;
    const row = this._service!.getDataStore().getRowById(rowId);
    this.startEdit(rowId, col.field, row?.raw[col.field]);
  }

  private _tabField(dir: 'next' | 'prev'): void {
    const editing = this._editingCell();
    if (!editing) return;
    const editableCols = this._columns.filter(c => c.editable);
    const idx = editableCols.findIndex(c => c.field === editing.field);
    const nextIdx = dir === 'next'
      ? (idx + 1) % editableCols.length
      : (idx - 1 + editableCols.length) % editableCols.length;
    if (editableCols[nextIdx] && editing) {
      const row = this._service!.getDataStore().getRowById(editing.rowId);
      this.startEdit(editing.rowId, editableCols[nextIdx].field,
        row?.raw[editableCols[nextIdx].field]);
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Shift+点击 范围选择
  // ════════════════════════════════════════════════════════════════════════════

  private _rangeAnchor: number | null = null;

  handleShiftClick(rowId: number): void {
    const enabled = this._tableConfig?.rangeSelect;
    if (!enabled) return;

    if (this._rangeAnchor === null) {
      this._rangeAnchor = rowId;
      this._service!.selectRow(rowId, true);
      return;
    }

    const allRows = this._allRows();
    const startIdx = allRows.findIndex(r => r.id === this._rangeAnchor);
    const endIdx = allRows.findIndex(r => r.id === rowId);
    if (startIdx === -1 || endIdx === -1) return;

    const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
    for (let i = from; i <= to; i++) {
      this._service!.selectRow(allRows[i].id, true);
    }
    this._rangeAnchor = rowId;
  }

  // ── 实时数据订阅 ─────────────────────────────────────────────────────────

  private _subscribeDataFeed(source: Observable<Record<string, RawValue>>, mode: 'replace' | 'merge' | 'append'): void {
    this._dataFeedSub = source.subscribe({
      next: (data) => {
        this._handleDataUpdate(data, mode);
      },
      error: (err) => console.error('Data feed error:', err),
    });
  }

  private _subscribeDataFeedAdvanced(config: DataFeedConfig): void {
    const { source, mode, highlightDuration = 500, transform } = config;

    this._dataFeedSub = source.subscribe({
      next: (rawData) => {
        let data: Record<string, RawValue>[] | null = null;

        // 数据转换
        if (transform) {
          data = transform(rawData);
          if (!data) return; // transform 返回 null 时跳过
        } else if (Array.isArray(rawData)) {
          data = rawData;
        } else if (typeof rawData === 'object' && rawData !== null) {
          data = [rawData as Record<string, RawValue>];
        } else {
          return; // 无效数据，跳过
        }

        if (!data.length) return;

        // 根据 mode 处理数据
        const updatedIds = this._handleDataUpdateAdvanced(data, config);

        // 添加高亮效果（仅在 highlightDuration > 0 时）
        if (highlightDuration > 0 && updatedIds.length > 0 && config.keyField) {
          this._highlightUpdatedCells(updatedIds, data, config.keyField, highlightDuration);
        }
      },
      error: (err) => console.error('Data feed error:', err),
    });
  }

  private _handleDataUpdate(data: Record<string, RawValue>, mode: 'replace' | 'merge' | 'append'): void {
    if (mode === 'replace') {
      this._service!.setData(Array.isArray(data) ? data : [data]);
    } else if (mode === 'append') {
      // 追加新数据
      const current = this._service!.getDataStore().getRows();
      const newData = Array.isArray(data) ? data : [data];
      this._service!.setData([...current.map(r => r.raw), ...newData]);
    }
    if (this._virtualScrollEnabled()) {
      this._syncAllRows();
    }
    this._cdr.markForCheck();
  }

  private _handleDataUpdateAdvanced(data: Record<string, RawValue>[], config: DataFeedConfig): number[] {
    const { mode, keyField } = config;

    if (mode === 'replace') {
      this._service!.setData(data);
      return [];
    }

    if (!keyField) {
      console.warn('DataFeedConfig.keyField is required for merge/append mode');
      return [];
    }

    const ds = this._service!.getDataStore();
    const existingRows = ds.getRows();
    const keyMap = new Map<RawValue, number>();
    existingRows.forEach(r => keyMap.set(r.raw[keyField], r.id));

    const updatedIds: number[] = [];

    if (mode === 'merge') {
      for (const item of data) {
        const keyValue = item[keyField];
        const existingId = keyMap.get(keyValue);

        if (existingId !== undefined) {
          // 更新现有行
          this._service!.updateRow(existingId, item);
          updatedIds.push(existingId);
        } else {
          // 新增行
          const newRow = this._service!.addRow(item);
          updatedIds.push(newRow.id);
        }
      }
    } else if (mode === 'append') {
      // 只追加新数据
      for (const item of data) {
        const keyValue = item[keyField];
        if (!keyMap.has(keyValue)) {
          this._service!.addRow(item);
        }
      }
    }

    if (this._virtualScrollEnabled()) {
      this._syncAllRows();
    }

    // OnPush 模式下手动触发变更检测
    this._cdr.markForCheck();

    return updatedIds;
  }

  private _highlightUpdatedCells(rowIds: number[], data: Record<string, RawValue>[], keyField: string, duration: number): void {
    const highlights = this._highlightCells();
    const now = Date.now();

    for (const rowId of rowIds) {
      const row = this._service!.getDataStore().getRowById(rowId);
      if (!row) continue;

      for (const col of this._columns) {
        const field = col.field;
        const newValue = row.raw[field];
        highlights.set(`${rowId}:${field}`, {
          rowId,
          field,
          timestamp: now,
          value: newValue,
        });
      }
    }

    this._highlightCells.set(new Map(highlights));

    // 定时清除高亮
    setTimeout(() => {
      const current = this._highlightCells();
      for (const key of current.keys()) {
        const h = current.get(key);
        if (h && now - h.timestamp >= duration) {
          current.delete(key);
        }
      }
      this._highlightCells.set(new Map(current));
    }, duration);
  }

  isCellHighlighted(rowId: number, field: string): boolean {
    return this._highlightCells().has(`${rowId}:${field}`);
  }

  private _cleanupDataFeed(): void {
    if (this._dataFeedSub) {
      this._dataFeedSub.unsubscribe();
      this._dataFeedSub = null;
    }
  }

  // ── 虚拟滚动事件 ──────────────────────────────────────────────────────────

  onScrollIndexChange(index: number): void {
    this._virtualScrollIndex.set(index);
  }

  // ── 工具栏操作 ────────────────────────────────────────────────────────────

  onAdd(): void {
    // 创建空行数据
    const emptyRow: Record<string, RawValue> = {};
    for (const col of this._columns) {
      if (col.field === 'id') {
        // 生成临时 ID
        emptyRow[col.field] = Date.now() as RawValue;
      } else {
        emptyRow[col.field] = '' as RawValue;
      }
    }
    // 添加到 DataStore
    const newRow = this._service!.addRow(emptyRow);
    this.rowAdded.emit(newRow);
    // 触发第一个可编辑字段的编辑
    const firstEditableCol = this._columns.find(c => c.editable);
    if (firstEditableCol) {
      this.startEdit(newRow.id, firstEditableCol.field, '');
    }
  }

  onDeleteSelected(): void {
    const count = this._service!.deleteSelected();
    // deleted
    this.toolbarAction.emit({ action: { type: 'delete' } });
  }

  onRefresh(): void {
    this._service!.reset();
    this._service!.setData([]);
    // refreshed
    this.toolbarAction.emit({ action: { type: 'refresh' } });
  }

  onCustomAction(btn: { id: string }): void {
    this.toolbarAction.emit({ action: { type: 'custom', id: btn.id } });
  }

  // ── 搜索与过滤 ────────────────────────────────────────────────────────────

  onSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this._service!.setGlobalSearch(value);
  }

  clearSearch(): void {
    this._service!.setGlobalSearch('');
  }

  onSortChange(sort: Sort): void {
    this._service!.setSort(sort.active, sort.direction);
  }

  /** Toggle sort direction for virtual mode header click */
  sortDirection(field: string): 'asc' | 'desc' | '' {
    const state = this._service!.state();
    if (state.sortField !== field) return 'asc';
    return state.sortDirection === 'asc' ? 'desc' : state.sortDirection === 'desc' ? '' : 'asc';
  }

  onVirtualSortChange(field: string): void {
    // 虚拟滚动模式的排序处理
    const direction = this.sortDirection(field);
    this._service!.setSort(field, direction);
    if (this._virtualScrollEnabled()) {
      this._syncAllRows();
    }
  }

  onColumnFilter(field: string, value: unknown): void {
    this._service!.setColumnFilter(field, value);
  }

  getColumnFilter(field: string): unknown {
    return this._service!.state().columnFilters[field];
  }

  // ── 选择 ──────────────────────────────────────────────────────────────────

  toggleSelectAll(checked: boolean): void {
    this._service!.selectAll(checked);
  }

  toggleRowSelect(rowId: number, checked: boolean): void {
    this._service!.selectRow(rowId, checked);
    this.selectionChanged.emit(this._service!.state().selectedRows);
  }

  isRowSelected(rowId: number): boolean {
    return this._service!.isSelected(rowId);
  }

  isAllSelected(): boolean {
    const all = this._service!.rows().rows;
    return all.length > 0 && all.every((r: DataRow) => this._service!.isSelected(r.id));
  }

  isIndeterminate(): boolean {
    const sel = this._service!.state().selectedRows.size;
    return sel > 0 && sel < this._service!.rows().rows.length;
  }

  // ── 行操作 ────────────────────────────────────────────────────────────────

  editRow(row: DataRow): void {
    this.rowUpdated.emit({ row, changes: row.changes });
  }

  deleteRow(rowId: number): void {
    if (confirm('确认删除?')) {
      this._service!.deleteRow(rowId);
      this.rowDeleted.emit(rowId);
    }
  }

  restoreRow(rowId: number): void {
    this._service!.restoreRow(rowId);
  }

  rowStatus(row: DataRow | any): string {
    return row._status || (row as DataRow).status || 'normal';
  }

  onRowClick(row: any, event: MouseEvent): void {
    const rowId = row._id;
    const dr = this._service!.getDataStore().getRowById(rowId);
    if (dr) {
      this.rowClicked.emit({ row: dr, event });
    }
    if (this._tableConfig?.rowClick) {
      (this._tableConfig.rowClick as Function)?.(row, event);
    }
    // 单击行选中/取消选中
    if (this.selectionMode() !== 'none') {
      // Shift+点击：范围选择
      if (event.shiftKey && this._tableConfig?.rangeSelect) {
        this.handleShiftClick(rowId);
      } else {
        const currentSelected = this._service!.isSelected(rowId);
        this._service!.selectRow(rowId, !currentSelected);
        this.selectionChanged.emit(this._service!.state().selectedRows);
      }
    }
  }

  onRowDoubleClick(row: any, event: MouseEvent): void {
    const dr = this._service!.getDataStore().getRowById(row._id);
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
    this._editValueInternal = value;
  }

  saveEdit(rowId: number, field: string): void {
    if (this._editValueInternal !== null) {
      this._service!.updateRow(rowId, { [field]: this._editValueInternal as RawValue });
    }
    this.cancelEdit();
  }

  cancelEdit(): void {
    this._editingCell.set(null);
    this._editValueInternal = null;
  }

  onSelectChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this._editValueInternal = target.value;
  }

  // ── 分页 ──────────────────────────────────────────────────────────────────

  onPageChange(event: PageEvent): void {
    this._service!.setPage(event.pageIndex);
    this._service!.setPageSize(event.pageSize);
    this.pageChanged.emit(event);
  }

  // ── 格式化 ──────────────────────────────────────────────────────────────────

  formatCell(row: any, col: ColumnConfig): string {
    const val = row[col.field];
    if (col.format) return col.format(val, row);
    if (val === null || val === undefined) return '';
    return String(val);
  }

  sanitizeHtml(html: string): SafeHtml {
    return this._sanitizer.bypassSecurityTrustHtml(html);
  }

  // ── 导出 ═════════════════════════════════════════════════════════════════

  async exportData(format: 'csv' | 'json' | 'xlsx'): Promise<void> {
    if (format === 'csv') {
      const csv = this._service!.exportToCSV({ format: 'csv' });
      this._downloadFile(csv, 'export.csv', 'text/csv');
    } else if (format === 'xlsx') {
      const blob = await this._service!.exportToXLSX({ format: 'xlsx' });
      this._downloadBlob(blob, 'export.xlsx');
    } else {
      const json = this._service!.exportToJSON({ format: 'json' });
      this._downloadFile(json, 'export.json', 'application/json');
    }
  }

  // ── 导入 ══════════════════════════════════════════════════════════════════

  private _importFormat: 'csv' | 'xlsx' = 'csv';

  triggerImport(format: 'csv' | 'xlsx'): void {
    this._importFormat = format;
    const input = document.querySelector('#importFileInput') as HTMLInputElement;
    if (input) {
      input.accept = format === 'csv' ? '.csv' : '.xlsx,.xls';
      input.click();
    }
  }

  async onImportFileSelect(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      let count = 0;
      if (this._importFormat === 'csv') {
        const text = await file.text();
        count = this._service!.importFromCSV(text);
      } else {
        count = await this._service!.importFromXLSX(file);
      }
      console.log(`成功导入 ${count} 条数据`);
    } catch (err) {
      console.error('导入失败:', err);
    } finally {
      input.value = '';
      if (this._virtualScrollEnabled()) {
        this._syncAllRows();
      }
    }
  }

  private _downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    this._downloadBlob(blob, filename);
  }

  private _downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── 列宽调整 ──────────────────────────────────────────────────────────────

  private _resizeTh: HTMLElement | null = null;
  private _resizeColumn: string | null = null;
  private _resizeStartX = 0;
  private _resizeStartWidth = 0;
  private _resizeLine: HTMLElement | null = null;

  onResizeStart(event: MouseEvent, field: string): void {
    event.preventDefault();
    event.stopPropagation();

    const th = (event.target as HTMLElement).closest('th');
    if (!th) return;

    this._resizeColumn = field;
    this._resizeTh = th;
    this._resizeStartX = event.pageX;
    this._resizeStartWidth = th.offsetWidth;

    // 创建虚线指示器
    this._resizeLine = document.createElement('div');
    this._resizeLine.className = 'dt-resize-line';
    this._resizeLine.style.left = `${event.pageX}px`;
    document.body.appendChild(this._resizeLine);

    document.body.style.cursor = 'col-resize';
    document.body.classList.add('dt-resizing');

    document.addEventListener('mousemove', this._onResizeMove);
    document.addEventListener('mouseup', this._onResizeEnd);
  }

  private _onResizeMove = (event: MouseEvent): void => {
    if (!this._resizeColumn || !this._resizeLine || !this._resizeTh) return;

    // 更新虚线位置
    this._resizeLine.style.left = `${event.pageX}px`;

    // 实时预览列宽变化
    const diff = event.pageX - this._resizeStartX;
    const newWidth = Math.max(60, this._resizeStartWidth + diff);
    this._resizeTh.style.width = `${newWidth}px`;
    this._resizeTh.style.minWidth = `${newWidth}px`;
    this._resizeTh.style.transition = 'none';
  };

  private _onResizeEnd = (event: MouseEvent): void => {
    if (!this._resizeColumn || !this._resizeTh) return;

    const diff = event.pageX - this._resizeStartX;
    const newWidth = Math.max(60, this._resizeStartWidth + diff);

    // 更新列配置
    this._columns = this._columns.map(c =>
      c.field === this._resizeColumn ? { ...c, width: `${newWidth}px` } : c
    );

    // 重置 th 宽度（从配置读取）
    const col = this._columns.find(c => c.field === this._resizeColumn);
    if (this._resizeTh) {
      this._resizeTh.style.width = col?.width || `${newWidth}px`;
      this._resizeTh.style.minWidth = '';
      this._resizeTh.style.transition = '';
    }

    // 移除虚线
    if (this._resizeLine) {
      this._resizeLine.remove();
      this._resizeLine = null;
    }

    this._resizeColumn = null;
    this._resizeTh = null;
    document.body.style.cursor = '';
    document.body.classList.remove('dt-resizing');

    document.removeEventListener('mousemove', this._onResizeMove);
    document.removeEventListener('mouseup', this._onResizeEnd);
  };

  // ── 辅助 ──────────────────────────────────────────────────────────────────

  getActionLabel(action: boolean | { icon?: string; label?: string } | undefined, fallback: string): string {
    if (typeof action === 'object' && action) return action.label ?? fallback;
    return fallback;
  }

  // ── 公共 API ──────────────────────────────────────────────────────────────

  getService(): DataTableService { return this._service!; }

  setData(data: Record<string, RawValue>[]): void { this._service!.setData(data); }
  addRow(data: Record<string, RawValue>): DataRow { return this._service!.addRow(data); }
  updateRow(rowId: number, data: Partial<Record<string, RawValue>>): Promise<boolean> {
    return this._service!.updateRow(rowId, data);
  }
  deleteRowFromService(rowId: number): boolean { return this._service!.deleteRow(rowId); }
  validate() { return this._service!.validate(); }
  generateUpdates() { return this._service!.generateUpdates(); }
  commit() { this._service!.commit(); }
}
