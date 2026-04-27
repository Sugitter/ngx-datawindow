/**
 * ngx-datawindow 功能演示页面
 * 6 个 Tab 展示所有核心功能
 */
import { Component, OnInit, ViewChild, signal, computed, NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import {
  DataTableModule, DataTableComponent, DataTableService, DataRow, RowId, RawValue,
  ToolbarAction, ColumnConfig, TableConfig, DataStoreConfig,
  AggregationFormula, UpdateData, ValidationResult
} from 'ngx-datawindow';

interface AggResult { formulaId: string; label: string; value: number; }

@Component({
  selector: 'app-demo',
  imports: [
    CommonModule, FormsModule,
    MatTabsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatDividerModule, MatChipsModule, MatSnackBarModule,
    MatTooltipModule, MatFormFieldModule, MatInputModule,
    DataTableModule,
  ],
  schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <!-- 功能导航 -->
    <div class="demo-nav">
      @for (tab of tabs; track tab.id) {
        <button class="tab-btn" [class.active]="activeTab() === tab.id"
          (click)="setActiveTab(tab.id)">
          <mat-icon>{{ tab.icon }}</mat-icon>
          <span>{{ tab.label }}</span>
        </button>
      }
    </div>

    <!-- ================================================================ -->
    <!-- Tab 1: 基础增删改查 -->
    <!-- ================================================================ -->
    @if (activeTab() === 'basic') {
      <div class="demo-section">
        <div class="section-header">
          <h2>基础增删改查</h2>
          <p class="section-desc">增、删、改、查、排序、分页、多选、导出、差异更新</p>
        </div>

        <div class="action-bar">
          <div class="action-group">
            <button mat-flat-button color="primary" (click)="addEmployee()">
              <mat-icon>person_add</mat-icon> 新增员工
            </button>
            <button mat-stroked-button color="warn" (click)="deleteSelected()"
              [disabled]="!hasSelection()">
              <mat-icon>delete_sweep</mat-icon> 删除选中
              @if (selectionCount() > 0) { <span class="dt-badge">{{ selectionCount() }}</span> }
            </button>
            <button mat-stroked-button (click)="refreshData()">
              <mat-icon>refresh</mat-icon> 刷新数据
            </button>
          </div>
          <div class="action-group">
            <button mat-stroked-button (click)="exportCSV()" matTooltip="导出 CSV">
              <mat-icon>table_chart</mat-icon> CSV
            </button>
            <button mat-stroked-button (click)="exportJSON()" matTooltip="导出 JSON">
              <mat-icon>code</mat-icon> JSON
            </button>
            <button mat-stroked-button (click)="validateTable()">
              <mat-icon>verified</mat-icon> 校验
            </button>
            <button mat-stroked-button (click)="showDiff()">
              <mat-icon>diff</mat-icon> 差异更新
            </button>
          </div>
        </div>

        @if (validationResult() && !validationResult()!.valid) {
          <div class="validation-alert">
            <mat-icon>warning</mat-icon>
            <div>
              <strong>校验失败 ({{ validationResult()!.errors.length }} 个)</strong>
              <ul>
                @for (err of validationResult()!.errors.slice(0, 5); track $index) {
                  <li>{{ err.message }}</li>
                }
              </ul>
            </div>
          </div>
        }

        @if (diffUpdates().length > 0) {
          <div class="diff-panel">
            <div class="diff-header">
              <strong>差异更新 ({{ diffUpdates().length }} 条)</strong>
              <button mat-icon-button (click)="clearDiff()"><mat-icon>close</mat-icon></button>
            </div>
            <div class="diff-content">
              @for (u of diffUpdates(); track $index) {
                <span class="diff-badge" [class]="'diff-' + u.updateType">{{ u.updateType }}</span>
              }
              <button mat-button color="primary" (click)="commitChanges()">提交变更</button>
            </div>
          </div>
        }

        <ngx-datawindow
          #basicTable
          [datastoreConfig]="employeeConfig"
          [columns]="employeeColumns"
          [data]="employeeData"
          [tableConfig]="employeeTableConfig"
          (rowAdded)="onRowAdded($event)"
          (rowUpdated)="onRowUpdated($event)"
          (rowDeleted)="onRowDeleted($event)"
          (toolbarAction)="onToolbarAction($event)">
        </ngx-datawindow>
      </div>
    }

    <!-- ================================================================ -->
    <!-- Tab 2: 虚拟计算列 -->
    <!-- ================================================================ -->
    @if (activeTab() === 'virtual') {
      <div class="demo-section">
        <div class="section-header">
          <h2>虚拟计算列</h2>
          <p class="section-desc">JS 函数公式，修改源数据时自动联动计算，无需存储中间结果</p>
        </div>

        <div class="action-bar">
          <div class="action-group">
            <button mat-flat-button color="primary" (click)="addOrder()">
              <mat-icon>add_shopping_cart</mat-icon> 新增订单
            </button>
            <button mat-stroked-button (click)="resetOrderData()">
              <mat-icon>refresh</mat-icon> 重置数据
            </button>
          </div>
          @if (aggResults().length > 0) {
            <div class="agg-results">
              @for (agg of aggResults(); track agg.formulaId) {
                <div class="agg-chip">
                  <span class="agg-label">{{ agg.label }}</span>
                  <span class="agg-value">{{ agg.value | number:'1.2-2' }}</span>
                </div>
              }
            </div>
          }
        </div>

        <ngx-datawindow
          #virtualTable
          [datastoreConfig]="orderConfig"
          [columns]="orderColumns"
          [data]="orderData"
          [tableConfig]="orderTableConfig"
          (toolbarAction)="onToolbarAction($event)">
        </ngx-datawindow>

        <div class="feature-note">
          <mat-icon>info</mat-icon>
          <div>
            <strong>虚拟列说明：</strong>
            <ul>
              <li><code>小计 = 数量 x 单价</code> — 基础计算</li>
              <li><code>实付 = 数量 x 单价 x (1 - 折扣)</code> — 带折扣计算</li>
              <li><code>利润 = 实付 - 成本</code> — 跨列联动</li>
              <li>修改数量/单价/折扣，虚拟列自动重算</li>
              <li>虚拟列不持久化，只在读取时计算</li>
            </ul>
          </div>
        </div>
      </div>
    }

    <!-- ================================================================ -->
    <!-- Tab 3: 过滤与搜索 -->
    <!-- ================================================================ -->
    @if (activeTab() === 'filter') {
      <div class="demo-section">
        <div class="section-header">
          <h2>过滤与搜索</h2>
          <p class="section-desc">列过滤（部门选择/产品文本/销售额数字）+ 全局搜索，可组合使用</p>
        </div>

        <div class="action-bar">
          <button mat-stroked-button (click)="clearFilters()">
            <mat-icon>filter_alt_off</mat-icon> 清除所有过滤
          </button>
        </div>

        <ngx-datawindow
          #filterTable
          [datastoreConfig]="salesConfig"
          [columns]="salesColumns"
          [data]="salesData"
          [tableConfig]="salesTableConfig">
        </ngx-datawindow>

        <div class="feature-note">
          <mat-icon>info</mat-icon>
          <div>
            <strong>过滤操作说明：</strong>
            <ul>
              <li><strong>部门</strong>：下拉多选过滤</li>
              <li><strong>产品</strong>：文本模糊过滤</li>
              <li><strong>销售额/成本</strong>：数字精确过滤</li>
              <li><strong>全局搜索</strong>：跨列全文搜索</li>
              <li>多个过滤条件为 AND 关系</li>
            </ul>
          </div>
        </div>
      </div>
    }

    <!-- ================================================================ -->
    <!-- Tab 4: 聚合统计 -->
    <!-- ================================================================ -->
    @if (activeTab() === 'aggregate') {
      <div class="demo-section">
        <div class="section-header">
          <h2>聚合统计</h2>
          <p class="section-desc">注册聚合公式，计算 sum / avg / count / min / max，可按字段分组</p>
        </div>

        <div class="action-bar">
          <div class="action-group">
            <button mat-flat-button color="primary" (click)="computeAggregations()">
              <mat-icon>calculate</mat-icon> 计算聚合
            </button>
            <button mat-stroked-button (click)="clearAggregations()">
              <mat-icon>clear</mat-icon> 清除结果
            </button>
          </div>
        </div>

        @if (aggResults().length > 0) {
          <div class="agg-cards">
            @for (agg of aggResults(); track agg.formulaId) {
              <mat-card class="agg-card">
                <mat-card-header>
                  <mat-icon mat-card-avatar>analytics</mat-icon>
                  <mat-card-title>{{ agg.label }}</mat-card-title>
                  <mat-card-subtitle>{{ agg.formulaId }}</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <div class="agg-big-value">{{ agg.value | number:'1.2-2' }}</div>
                </mat-card-content>
              </mat-card>
            }
          </div>
        }

        <ngx-datawindow
          #aggTable
          [datastoreConfig]="salesConfig"
          [columns]="salesAggColumns"
          [data]="salesData"
          [tableConfig]="salesTableConfig">
        </ngx-datawindow>
      </div>
    }

    <!-- ================================================================ -->
    <!-- Tab 5: 行操作与状态 -->
    <!-- ================================================================ -->
    @if (activeTab() === 'rowops') {
      <div class="demo-section">
        <div class="section-header">
          <h2>行操作与状态</h2>
          <p class="section-desc">行状态标识（新增绿/修改黄/删除红）、删除缓冲区统计、恢复已删除行</p>
        </div>

        <div class="action-bar">
          <div class="action-group">
            <button mat-stroked-button (click)="addRowToDemo()">
              <mat-icon>person_add</mat-icon> 新增行
            </button>
            <button mat-stroked-button color="warn" (click)="deleteLastRow()">
              <mat-icon>delete</mat-icon> 删除末行
            </button>
          </div>
        </div>

        <div class="buffer-stats">
          <div class="stat-item stat-main">
            <mat-icon>table_chart</mat-icon>
            <div>
              <span class="stat-label">主缓冲区</span>
              <span class="stat-value">{{ mainCount() }} 行</span>
            </div>
          </div>
          <div class="stat-item stat-filtered">
            <mat-icon>filter_alt</mat-icon>
            <div>
              <span class="stat-label">过滤缓冲区</span>
              <span class="stat-value">{{ filteredCount() }} 行</span>
            </div>
          </div>
          <div class="stat-item stat-deleted">
            <mat-icon>delete_forever</mat-icon>
            <div>
              <span class="stat-label">删除缓冲区</span>
              <span class="stat-value">{{ deletedCount() }} 行</span>
            </div>
          </div>
        </div>

        <ngx-datawindow
          #rowOpsTable
          [datastoreConfig]="employeeConfig"
          [columns]="employeeColumns"
          [data]="employeeData"
          [tableConfig]="rowOpsTableConfig"
          (rowDeleted)="onRowDeleted($event)">
        </ngx-datawindow>

        <div class="feature-note">
          <mat-icon>info</mat-icon>
          <div>
            <strong>行状态说明：</strong>
            <ul>
              <li><span style="background:#e8f5e9;padding:2px 8px;border-radius:4px">绿色</span> — 新增行（状态为 new）</li>
              <li><span style="background:#fff8e1;padding:2px 8px;border-radius:4px">黄色</span> — 修改行（状态为 modified）</li>
              <li><span style="background:#ffebee;padding:2px 8px;border-radius:4px">红色</span> — 已删除行（状态为 deleted）</li>
              <li>每行有编辑和删除按钮；已删除行显示「恢复」按钮</li>
              <li>差异更新可区分新增/修改/删除三类变更</li>
            </ul>
          </div>
        </div>
      </div>
    }

    <!-- ================================================================ -->
    <!-- Tab 6: 完整配置 -->
    <!-- ================================================================ -->
    @if (activeTab() === 'fullconfig') {
      <div class="demo-section">
        <div class="section-header">
          <h2>完整配置示例</h2>
          <p class="section-desc">工具栏自定义按钮、列配置、排序、分页、多选、聚合的完整组合</p>
        </div>

        <ngx-datawindow
          #fullConfigTable
          [datastoreConfig]="fullConfigDataStore"
          [columns]="fullConfigColumns"
          [data]="fullConfigData"
          [tableConfig]="fullConfigTableConfig"
          (toolbarAction)="onFullConfigAction($event)">
        </ngx-datawindow>

        <mat-card class="config-code-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>code</mat-icon>
            <mat-card-title>关键配置代码</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <pre class="code-block">{{ configCode }}</pre>
          </mat-card-content>
        </mat-card>
      </div>
    }
  `,
  styles: [`
    .demo-nav {
      display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap;
    }
    .tab-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 10px 20px; border: 1px solid #e0e0e0; border-radius: 8px;
      background: #fff; cursor: pointer; font-size: 14px; font-weight: 500;
      color: #666; transition: all 0.2s;
    }
    .tab-btn:hover { border-color: #1976d2; color: #1976d2; background: #e3f2fd; }
    .tab-btn.active { background: #1976d2; color: #fff; border-color: #1976d2; }

    .demo-section { display: flex; flex-direction: column; gap: 16px; }
    .section-header { margin-bottom: 8px; }
    .section-header h2 { font-size: 22px; font-weight: 600; color: #333; margin: 0 0 4px; }
    .section-desc { color: #666; font-size: 14px; margin: 0; }

    .action-bar {
      display: flex; justify-content: space-between; align-items: center;
      flex-wrap: wrap; gap: 12px; padding: 12px 16px;
      background: #fff; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    }
    .action-group { display: flex; gap: 8px; flex-wrap: wrap; }

    .dt-badge {
      margin-left: 4px; background: #f44336; color: #fff; border-radius: 10px;
      padding: 2px 6px; font-size: 12px;
    }

    .validation-alert {
      display: flex; gap: 12px; padding: 12px 16px;
      background: #fff3e0; border-left: 4px solid #ff9800;
      border-radius: 4px; color: #e65100;
    }
    .validation-alert ul { margin: 4px 0 0 16px; font-size: 13px; }

    .diff-panel {
      padding: 12px 16px; background: #e8f5e9; border-left: 4px solid #4caf50; border-radius: 4px;
    }
    .diff-header {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;
    }
    .diff-content { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .diff-badge { padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
    .diff-new { background: #4caf50; color: #fff; }
    .diff-modified { background: #ff9800; color: #fff; }
    .diff-deleted { background: #f44336; color: #fff; }

    .agg-results { display: flex; gap: 12px; flex-wrap: wrap; }
    .agg-chip {
      display: flex; flex-direction: column; align-items: center;
      padding: 8px 16px; background: #e3f2fd; border-radius: 8px; min-width: 100px;
    }
    .agg-label { font-size: 12px; color: #1976d2; }
    .agg-value { font-size: 18px; font-weight: 600; color: #0d47a1; }

    .agg-cards {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px; margin-bottom: 16px;
    }
    .agg-card {
      background: linear-gradient(135deg, #1976d2, #2196f3); color: #fff;
    }
    .agg-card mat-card-header { color: #fff; }
    .agg-card mat-card-subtitle { color: rgba(255,255,255,0.7) !important; }
    .agg-big-value { font-size: 28px; font-weight: 700; text-align: center; padding: 16px 0; color: #fff; }

    .buffer-stats { display: flex; gap: 16px; flex-wrap: wrap; }
    .stat-item {
      display: flex; align-items: center; gap: 10px; padding: 12px 20px;
      background: #fff; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    }
    .stat-item mat-icon { font-size: 28px; width: 28px; height: 28px; }
    .stat-main mat-icon { color: #1976d2; }
    .stat-filtered mat-icon { color: #ff9800; }
    .stat-deleted mat-icon { color: #f44336; }
    .stat-label { display: block; font-size: 12px; color: #999; }
    .stat-value { display: block; font-size: 18px; font-weight: 600; color: #333; }

    .feature-note {
      display: flex; gap: 12px; padding: 16px; background: #e3f2fd;
      border-radius: 8px; font-size: 14px; color: #0d47a1;
    }
    .feature-note mat-icon { flex-shrink: 0; margin-top: 2px; }
    .feature-note ul { margin: 8px 0 0 20px; }
    .feature-note li { margin: 4px 0; }
    .feature-note code {
      background: rgba(255,255,255,0.5); padding: 1px 6px; border-radius: 4px; font-size: 13px;
    }

    .config-code-card { margin-top: 16px; }
    .code-block {
      background: #263238; color: #aed581; padding: 16px; border-radius: 8px;
      overflow-x: auto; font-size: 13px; line-height: 1.5; max-height: 400px;
    }
  `]
})
export class DemoComponent implements OnInit {
  @ViewChild('basicTable') basicTable!: DataTableComponent;
  @ViewChild('virtualTable') virtualTable!: DataTableComponent;
  @ViewChild('filterTable') filterTable!: DataTableComponent;
  @ViewChild('aggTable') aggTable!: DataTableComponent;
  @ViewChild('rowOpsTable') rowOpsTable!: DataTableComponent;
  @ViewChild('fullConfigTable') fullConfigTable!: DataTableComponent;

  // ── Tab 导航 ──────────────────────────────────────────────────────────────

  activeTab = signal('basic');

  tabs = [
    { id: 'basic', label: '基础增删改查', icon: 'table_chart' },
    { id: 'virtual', label: '虚拟计算列', icon: 'functions' },
    { id: 'filter', label: '过滤与搜索', icon: 'filter_alt' },
    { id: 'aggregate', label: '聚合统计', icon: 'analytics' },
    { id: 'rowops', label: '行操作与状态', icon: 'rule' },
    { id: 'fullconfig', label: '完整配置', icon: 'settings' },
  ];

  setActiveTab(id: string) { this.activeTab.set(id); }

  // ── 共享状态信号 ───────────────────────────────────────────────────────────

  validationResult = signal<ValidationResult | null>(null);
  diffUpdates = signal<UpdateData[]>([]);
  aggResults = signal<AggResult[]>([]);
  deletedCount = signal(0);
  mainCount = signal(0);
  filteredCount = signal(0);
  hasSelection = signal(false);
  selectionCount = signal(0);



  // ── Tab 1: 基础增删改查 ────────────────────────────────────────────────────

  employeeConfig: DataStoreConfig = {
    name: 'employees',
    fields: [
      { name: 'id', type: 'number', required: true },
      { name: 'name', type: 'string', required: true },
      { name: 'department', type: 'string' },
      { name: 'position', type: 'string' },
      { name: 'email', type: 'string' },
      { name: 'salary', type: 'number' },
      { name: 'hireDate', type: 'string' },
      { name: 'active', type: 'boolean', defaultValue: true },
    ],
  };

  employeeColumns: ColumnConfig[] = [
    { field: 'id', header: 'ID', width: '60px', filterable: false },
    { field: 'name', header: '姓名', width: '100px', editable: true, filterType: 'text', filterable: true },
    {
      field: 'department', header: '部门', width: '110px',
      filterType: 'select', filterable: true,
      filterOptions: [
        { value: '技术部', label: '技术部' },
        { value: '销售部', label: '销售部' },
        { value: '财务部', label: '财务部' },
        { value: '人事部', label: '人事部' },
        { value: '市场部', label: '市场部' },
      ]
    },
    { field: 'position', header: '职位', width: '120px', editable: true },
    { field: 'email', header: '邮箱', width: '180px', editable: true },
    {
      field: 'salary', header: '月薪', width: '100px', align: 'right',
      editable: true, editType: 'number', filterType: 'number'
    },
    { field: 'hireDate', header: '入职日期', width: '120px', editable: true, editType: 'date' },
    { field: 'active', header: '在职', width: '70px', editable: true, editType: 'checkbox', filterType: 'boolean' },
  ];

  employeeTableConfig: TableConfig = {
    title: '员工管理',
    showTitle: false,
    showToolbar: true,
    showGlobalSearch: true,
    showColumnFilter: true,
    showPaginator: true,
    selectionMode: 'multiple',
    toolbarActions: {
      add: { icon: 'person_add', label: '新增' },
      delete: { icon: 'delete_sweep', label: '删除' },
      refresh: true,
      export: { icon: 'download', label: '导出', formats: ['csv', 'json'] },
    },
    pagination: {
      pageSizeOptions: [10, 25, 50, 100],
      defaultPageSize: 10,
      showPageSizeSelector: true,
      showTotalCount: true,
    },
    emptyMessage: '暂无员工数据，点击「新增」添加第一条记录',
    loadingMessage: '正在加载员工数据...',
  };

  employeeData: Record<string, RawValue>[] = [];

  // ── Tab 2: 虚拟计算列 ────────────────────────────────────────────────────

  orderConfig: DataStoreConfig = {
    name: 'orders',
    fields: [
      { name: 'id', type: 'number', required: true },
      { name: 'product', type: 'string' },
      { name: 'spec', type: 'string' },
      { name: 'quantity', type: 'number' },
      { name: 'unitPrice', type: 'number' },
      { name: 'discount', type: 'number' },
      { name: 'cost', type: 'number' },
      // 虚拟计算列
      {
        name: 'subtotal', type: 'virtual', virtual: true,
        formula: (row) => (row.raw['quantity'] as number) * (row.raw['unitPrice'] as number)
      },
      {
        name: 'amount', type: 'virtual', virtual: true,
        formula: (row) => {
          const qty = (row.raw['quantity'] as number) || 0;
          const price = (row.raw['unitPrice'] as number) || 0;
          const disc = (row.raw['discount'] as number) || 0;
          return qty * price * (1 - disc);
        }
      },
      {
        name: 'profit', type: 'virtual', virtual: true,
        formula: (row) => {
          const qty = (row.raw['quantity'] as number) || 0;
          const price = (row.raw['unitPrice'] as number) || 0;
          const disc = (row.raw['discount'] as number) || 0;
          const cost = (row.raw['cost'] as number) || 0;
          return qty * price * (1 - disc) - cost;
        }
      },
      { name: 'status', type: 'string' },
    ],
  };

  orderColumns: ColumnConfig[] = [
    { field: 'id', header: '订单号', width: '90px', filterable: false },
    { field: 'product', header: '产品', width: '150px', editable: true },
    { field: 'spec', header: '规格', width: '120px', editable: true },
    { field: 'quantity', header: '数量', width: '80px', editable: true, editType: 'number', align: 'right' },
    { field: 'unitPrice', header: '单价', width: '90px', editable: true, editType: 'number', align: 'right' },
    {
      field: 'discount', header: '折扣', width: '70px', editable: true, editType: 'number',
      format: (v) => v != null ? `${((v as number) * 100).toFixed(0)}%` : '0%'
    },
    { field: 'cost', header: '成本', width: '90px', editable: true, editType: 'number', align: 'right' },
    { field: 'subtotal', header: '小计', virtual: true, width: '100px', align: 'right' },
    { field: 'amount', header: '实付金额', virtual: true, width: '110px', align: 'right' },
    {
      field: 'profit', header: '利润', virtual: true, width: '100px', align: 'right',
      format: (v) => v != null ? `¥${(v as number).toFixed(2)}` : ''
    },
    {
      field: 'status', header: '状态', width: '90px', editable: true, editType: 'select',
      editOptions: [
        { value: 'pending', label: '待处理' },
        { value: 'processing', label: '处理中' },
        { value: 'completed', label: '已完成' },
        { value: 'cancelled', label: '已取消' },
      ]
    },
  ];

  orderTableConfig: TableConfig = {
    title: '订单管理（虚拟计算列）',
    showToolbar: true,
    showGlobalSearch: true,
    showColumnFilter: true,
    showPaginator: true,
    selectionMode: 'multiple',
    toolbarActions: { add: true, delete: true, refresh: true, export: true },
    pagination: { pageSizeOptions: [10, 25, 50], defaultPageSize: 10 },
  };

  orderData: Record<string, RawValue>[] = [];

  // ── Tab 3 & 4: 销售数据（过滤 + 聚合共用）───────────────────────────────

  salesConfig: DataStoreConfig = {
    name: 'sales',
    fields: [
      { name: 'id', type: 'number' },
      { name: 'region', type: 'string' },
      { name: 'product', type: 'string' },
      { name: 'sales', type: 'number' },
      { name: 'cost', type: 'number' },
      {
        name: 'profit', type: 'virtual', virtual: true,
        formula: (row) => (row.raw['sales'] as number) - (row.raw['cost'] as number)
      },
    ],
  };

  salesColumns: ColumnConfig[] = [
    { field: 'id', header: 'ID', width: '60px' },
    {
      field: 'region', header: '地区', filterType: 'select', filterable: true,
      filterOptions: [
        { value: '华北', label: '华北' },
        { value: '华东', label: '华东' },
        { value: '华南', label: '华南' },
        { value: '西南', label: '西南' },
        { value: '东北', label: '东北' },
      ]
    },
    { field: 'product', header: '产品', filterType: 'text', filterable: true },
    { field: 'sales', header: '销售额', align: 'right', filterType: 'number' },
    { field: 'cost', header: '成本', align: 'right', filterType: 'number' },
    { field: 'profit', header: '利润', virtual: true, align: 'right' },
  ];

  salesAggColumns: ColumnConfig[] = [
    { field: 'id', header: 'ID', width: '60px' },
    {
      field: 'region', header: '地区', filterType: 'select', filterable: true,
      filterOptions: [
        { value: '华北', label: '华北' },
        { value: '华东', label: '华东' },
        { value: '华南', label: '华南' },
        { value: '西南', label: '西南' },
        { value: '东北', label: '东北' },
      ]
    },
    { field: 'product', header: '产品', filterType: 'text', filterable: true },
    { field: 'sales', header: '销售额', align: 'right', filterType: 'number' },
    { field: 'cost', header: '成本', align: 'right', filterType: 'number' },
    { field: 'profit', header: '利润', virtual: true, align: 'right' },
  ];

  salesTableConfig: TableConfig = {
    title: '销售数据',
    showToolbar: true,
    showGlobalSearch: true,
    showColumnFilter: true,
    showPaginator: true,
    selectionMode: 'multiple',
    toolbarActions: { add: true, delete: true, refresh: true, export: true },
    pagination: { pageSizeOptions: [10, 25, 50, 100], defaultPageSize: 10 },
  };

  salesData: Record<string, RawValue>[] = [];

  // ── Tab 5: 行操作 ────────────────────────────────────────────────────────

  rowOpsTableConfig: TableConfig = {
    title: '行操作演示',
    showToolbar: true,
    showGlobalSearch: true,
    showColumnFilter: true,
    showPaginator: true,
    selectionMode: 'multiple',
    toolbarActions: { add: true, delete: true, refresh: true, export: true },
    pagination: { pageSizeOptions: [10, 25, 50], defaultPageSize: 10 },
  };

  // ── Tab 6: 完整配置 ──────────────────────────────────────────────────────

  fullConfigDataStore: DataStoreConfig = {
    name: 'fullconfig',
    fields: [
      { name: 'id', type: 'number', required: true },
      { name: 'name', type: 'string', required: true },
      { name: 'category', type: 'string' },
      { name: 'price', type: 'number' },
      { name: 'stock', type: 'number' },
    ],
  };

  fullConfigColumns: ColumnConfig[] = [
    { field: 'id', header: 'ID', width: '60px', filterable: false },
    { field: 'name', header: '名称', editable: true, filterable: true },
    {
      field: 'category', header: '分类', editable: true, filterType: 'select',
      filterOptions: [
        { value: '电子产品', label: '电子产品' },
        { value: '服装', label: '服装' },
        { value: '食品', label: '食品' },
        { value: '图书', label: '图书' },
      ]
    },
    { field: 'price', header: '价格', editable: true, editType: 'number', align: 'right' },
    { field: 'stock', header: '库存', editable: true, editType: 'number', align: 'right' },
  ];

  fullConfigTableConfig: TableConfig = {
    title: '完整配置示例',
    showToolbar: true,
    showGlobalSearch: true,
    showColumnFilter: true,
    showPaginator: true,
    selectionMode: 'multiple',
    toolbarActions: {
      add: { icon: 'add', label: '新增' },
      delete: { icon: 'delete', label: '删除' },
      refresh: true,
      export: { icon: 'download', label: '导出', formats: ['csv', 'json'] },
      custom: [
        { id: 'clone', icon: 'content_copy', label: '复制', action: 'clone' },
        { id: 'share', icon: 'share', label: '分享', action: 'share' },
        { id: 'archive', icon: 'archive', label: '归档', action: 'archive' },
      ],
    },
    pagination: {
      pageSizeOptions: [10, 25, 50, 100],
      defaultPageSize: 10,
      showPageSizeSelector: true,
      showTotalCount: true,
    },
  };

  fullConfigData: Record<string, RawValue>[] = [];

  // ── 配置代码展示 ─────────────────────────────────────────────────────────

  configCode = `
// 完整配置示例
const tableConfig: TableConfig = {
  title: '完整配置示例',
  showToolbar: true,
  showGlobalSearch: true,
  showColumnFilter: true,
  showPaginator: true,
  selectionMode: 'multiple',

  toolbarActions: {
    add: { icon: 'add', label: '新增' },
    delete: { icon: 'delete', label: '删除' },
    refresh: true,
    export: { icon: 'download', label: '导出',
              formats: ['csv', 'json'] },
    custom: [
      { id: 'clone', icon: 'content_copy', label: '复制' },
      { id: 'share', icon: 'share', label: '分享' },
    ],
  },

  pagination: {
    pageSizeOptions: [10, 25, 50, 100],
    defaultPageSize: 10,
    showPageSizeSelector: true,
    showTotalCount: true,
  },
};

const columns: ColumnConfig[] = [
  { field: 'name', header: '名称', editable: true, filterable: true,
    filterType: 'text' },
  { field: 'category', header: '分类', editable: true,
    filterType: 'select',
    filterOptions: [
      { value: '电子产品', label: '电子产品' },
      { value: '服装', label: '服装' },
    ]},
  { field: 'price', header: '价格', editable: true, editType: 'number',
    align: 'right', aggregate: { type: 'avg', precision: 2 } },
  { field: 'stock', header: '库存', editable: true, editType: 'number',
    align: 'right', aggregate: { type: 'sum', precision: 0 } },
];

const datastoreConfig: DataStoreConfig = {
  name: 'products',
  fields: [
    { name: 'id', type: 'number', required: true },
    { name: 'name', type: 'string', required: true },
    { name: 'category', type: 'string' },
    { name: 'price', type: 'number' },
    { name: 'stock', type: 'number' },
  ],
};
  `;

  // ── 生命周期 ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.loadEmployeeData();
    this.loadOrderData();
    this.loadSalesData();
    this.loadFullConfigData();
  }

  // ── 数据加载 ──────────────────────────────────────────────────────────────

  loadEmployeeData(): void {
    this.employeeData = [
      { id: 1, name: '张三', department: '技术部', position: '高级工程师', email: 'zhangsan@example.com', salary: 25000, hireDate: '2020-01-15', active: true },
      { id: 2, name: '李四', department: '销售部', position: '销售经理', email: 'lisi@example.com', salary: 18000, hireDate: '2019-06-01', active: true },
      { id: 3, name: '王五', department: '技术部', position: '架构师', email: 'wangwu@example.com', salary: 35000, hireDate: '2018-03-20', active: true },
      { id: 4, name: '赵六', department: '财务部', position: '财务主管', email: 'zhaoliu@example.com', salary: 22000, hireDate: '2017-09-10', active: false },
      { id: 5, name: '钱七', department: '人事部', position: '招聘专员', email: 'qianqi@example.com', salary: 12000, hireDate: '2021-02-01', active: true },
      { id: 6, name: '孙八', department: '技术部', position: '前端工程师', email: 'sunba@example.com', salary: 20000, hireDate: '2020-08-15', active: true },
      { id: 7, name: '周九', department: '销售部', position: '销售代表', email: 'zhoujiu@example.com', salary: 15000, hireDate: '2021-04-01', active: true },
      { id: 8, name: '吴十', department: '技术部', position: '后端工程师', email: 'wushi@example.com', salary: 22000, hireDate: '2019-11-20', active: true },
      { id: 9, name: '郑十一', department: '财务部', position: '会计', email: 'zhengshiyi@example.com', salary: 14000, hireDate: '2020-05-01', active: true },
      { id: 10, name: '冯十二', department: '技术部', position: '测试工程师', email: 'fengshier@example.com', salary: 16000, hireDate: '2021-07-01', active: true },
      { id: 11, name: '陈十三', department: '销售部', position: '区域经理', email: 'chenshisan@example.com', salary: 28000, hireDate: '2018-02-15', active: true },
      { id: 12, name: '褚十四', department: '人事部', position: 'HRBP', email: 'chushisi@example.com', salary: 20000, hireDate: '2019-09-01', active: true },
      { id: 13, name: '卫十五', department: '市场部', position: '市场专员', email: 'weishiwu@example.com', salary: 13000, hireDate: '2021-01-15', active: true },
      { id: 14, name: '蒋十六', department: '技术部', position: 'DevOps 工程师', email: 'jiangshiliu@example.com', salary: 23000, hireDate: '2019-04-01', active: true },
      { id: 15, name: '沈十七', department: '财务部', position: '审计主管', email: 'shenshiqi@example.com', salary: 26000, hireDate: '2017-11-01', active: true },
    ];
  }

  loadOrderData(): void {
    this.orderData = [
      { id: 1001, product: 'iPhone 15 Pro Max', spec: '256GB 深空黑', quantity: 2, unitPrice: 9999, discount: 0.05, cost: 7500, status: 'completed' },
      { id: 1002, product: 'MacBook Pro 14"', spec: 'M3 Pro 18+512', quantity: 1, unitPrice: 19999, discount: 0, cost: 15000, status: 'processing' },
      { id: 1003, product: 'AirPods Pro 2', spec: 'USB-C 充电盒', quantity: 5, unitPrice: 1899, discount: 0.10, cost: 1200, status: 'completed' },
      { id: 1004, product: 'iPad Air 5', spec: '64GB WiFi', quantity: 3, unitPrice: 4399, discount: 0.08, cost: 3000, status: 'pending' },
      { id: 1005, product: 'Apple Watch Ultra 2', spec: '钛金属表壳', quantity: 2, unitPrice: 5999, discount: 0, cost: 4000, status: 'completed' },
      { id: 1006, product: 'Sony WH-1000XM5', spec: '无线降噪耳机', quantity: 4, unitPrice: 2499, discount: 0.15, cost: 1500, status: 'completed' },
      { id: 1007, product: 'Samsung 990 Pro 2TB', spec: 'NVMe SSD', quantity: 10, unitPrice: 1499, discount: 0.10, cost: 900, status: 'processing' },
      { id: 1008, product: 'Logitech MX Master 3S', spec: '无线鼠标', quantity: 8, unitPrice: 799, discount: 0.05, cost: 400, status: 'completed' },
      { id: 1009, product: 'Keychron Q1 Pro', spec: '机械键盘 87键', quantity: 3, unitPrice: 1299, discount: 0, cost: 700, status: 'pending' },
      { id: 1010, product: 'Dell U2723QE', spec: '4K IPS 显示器', quantity: 2, unitPrice: 3999, discount: 0.12, cost: 2800, status: 'completed' },
    ];
  }

  loadSalesData(): void {
    this.salesData = [
      { id: 1, region: '华北', product: '手机', sales: 1200000, cost: 800000 },
      { id: 2, region: '华北', product: '电脑', sales: 980000, cost: 650000 },
      { id: 3, region: '华北', product: '平板', sales: 450000, cost: 300000 },
      { id: 4, region: '华东', product: '手机', sales: 1500000, cost: 950000 },
      { id: 5, region: '华东', product: '电脑', sales: 1100000, cost: 720000 },
      { id: 6, region: '华东', product: '配件', sales: 380000, cost: 200000 },
      { id: 7, region: '华南', product: '手机', sales: 1350000, cost: 880000 },
      { id: 8, region: '华南', product: '平板', sales: 720000, cost: 480000 },
      { id: 9, region: '华南', product: '配件', sales: 420000, cost: 250000 },
      { id: 10, region: '西南', product: '手机', sales: 680000, cost: 450000 },
      { id: 11, region: '西南', product: '电脑', sales: 520000, cost: 350000 },
      { id: 12, region: '西南', product: '配件', sales: 320000, cost: 180000 },
      { id: 13, region: '东北', product: '手机', sales: 580000, cost: 390000 },
      { id: 14, region: '东北', product: '电脑', sales: 420000, cost: 280000 },
      { id: 15, region: '东北', product: '平板', sales: 280000, cost: 190000 },
    ];
  }

  loadFullConfigData(): void {
    const categories = ['电子产品', '服装', '食品', '图书'];
    this.fullConfigData = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: `商品${i + 1}`,
      category: categories[i % categories.length],
      price: Math.round(Math.random() * 1000 + 50),
      stock: Math.round(Math.random() * 500 + 10),
    }));
  }

  // ── Tab 1 操作 ──────────────────────────────────────────────────────────

  addEmployee(): void {
    const maxId = Math.max(...this.employeeData.map(e => e['id'] as number), 0);
    this.basicTable.addRow({
      id: maxId + 1, name: '新员工', department: '技术部',
      position: '工程师', email: 'new@example.com',
      salary: 15000, hireDate: new Date().toISOString().split('T')[0], active: true,
    });
  }

  deleteSelected(): void {
    const svc = this.basicTable.getService();
    const ids = [...svc.state().selectedRows];
    ids.forEach(id => svc.deleteRow(id));
    this.updateStats();
  }

  refreshData(): void {
    this.loadEmployeeData();
    this.validationResult.set(null);
    this.diffUpdates.set([]);
    this.basicTable.setData(this.employeeData);
  }

  exportCSV(): void { this.basicTable.exportData('csv'); }
  exportJSON(): void { this.basicTable.exportData('json'); }

  validateTable(): void {
    const result = this.basicTable.validate();
    this.validationResult.set(result);
    if (result.valid) {
      this.openSnackBar('校验通过');
    } else {
      this.openSnackBar(`校验失败：${result.errors.length} 个错误`);
    }
  }

  showDiff(): void {
    this.diffUpdates.set(this.basicTable.generateUpdates());
  }

  clearDiff(): void { this.diffUpdates.set([]); }

  commitChanges(): void {
    this.basicTable.commit();
    this.diffUpdates.set([]);
    this.openSnackBar('变更已提交');
  }

  // ── Tab 2 操作 ──────────────────────────────────────────────────────────

  addOrder(): void {
    const maxId = Math.max(...this.orderData.map(o => o['id'] as number), 0);
    this.virtualTable.addRow({
      id: maxId + 1, product: '新商品', spec: '默认规格',
      quantity: 1, unitPrice: 100, discount: 0, cost: 50, status: 'pending',
    });
  }

  resetOrderData(): void {
    this.loadOrderData();
    this.virtualTable.setData(this.orderData);
    this.aggResults.set([]);
  }

  // ── Tab 3 操作 ──────────────────────────────────────────────────────────

  clearFilters(): void {
    this.filterTable.getService().clearAllFilters();
  }

  // ── Tab 4 操作 ──────────────────────────────────────────────────────────

  computeAggregations(): void {
    const svc = this.aggTable.getService();
    const formulas: AggregationFormula[] = [
      { id: 'total_sales', name: 'total_sales', type: 'sum', field: 'sales' },
      { id: 'total_cost', name: 'total_cost', type: 'sum', field: 'cost' },
      { id: 'total_profit', name: 'total_profit', type: 'sum', field: 'profit' },
      { id: 'avg_sales', name: 'avg_sales', type: 'avg', field: 'sales' },
      { id: 'count', name: 'count', type: 'count', field: 'id' },
    ];
    formulas.forEach(f => svc.registerAggregation(f));
    const results = svc.computeAllAggregations();
    const labels: Record<string, string> = {
      total_sales: '总销售额', total_cost: '总成本',
      total_profit: '总利润', avg_sales: '平均销售额', count: '产品数',
    };
    this.aggResults.set(
      Object.entries(results).map(([id, r]) => ({
        formulaId: id, label: labels[id] || id, value: (r as any).value as number,
      }))
    );
  }

  clearAggregations(): void { this.aggResults.set([]); }

  // ── Tab 5 操作 ──────────────────────────────────────────────────────────

  addRowToDemo(): void {
    const svc = this.rowOpsTable.getService();
    const stats = svc.getStats();
    const maxId = svc.getDataStore().getRowCount();
    svc.addRow({
      id: maxId + 1, name: '新行', department: '技术部',
      position: '员工', email: 'new@example.com',
      salary: 15000, hireDate: new Date().toISOString().split('T')[0], active: true,
    });
    this.updateRowOpsStats();
  }

  deleteLastRow(): void {
    const svc = this.rowOpsTable.getService();
    const rows = svc.getDataStore().getRows();
    if (rows.length > 0) {
      svc.deleteRow(rows[rows.length - 1].id);
      this.updateRowOpsStats();
    }
  }

  updateRowOpsStats(): void {
    const svc = this.rowOpsTable.getService();
    const stats = svc.getStats();
    this.mainCount.set(stats.main.count);
    this.filteredCount.set(stats.filtered.count);
    this.deletedCount.set(stats.deleted.count);
  }

  // ── Tab 6 操作 ──────────────────────────────────────────────────────────

  onFullConfigAction(event: any): void {
    if (event.action.type === 'custom' && event.action.id) {
      this.openSnackBar(`自定义操作：${event.action.id}`);
    }
  }

  // ── 事件处理 ──────────────────────────────────────────────────────────────

  onRowAdded(row: any): void {
    console.log('[Demo] 行已添加:', row.id);
    this.updateStats();
  }

  onRowUpdated(event: any): void {
    console.log('[Demo] 行已更新:', event.row.id, event.changes);
    this.diffUpdates.set(this.basicTable.generateUpdates());
    this.updateStats();
  }

  onRowDeleted(rowId: any): void {
    console.log('[Demo] 行已删除:', rowId);
    this.updateStats();
    this.updateRowOpsStats();
  }

  onToolbarAction(event: any): void {
    console.log('[Demo] 工具栏操作:', event);
    if (event.action.type === 'add') this.openSnackBar('新增操作');
  }

  // ── 辅助 ──────────────────────────────────────────────────────────────────

  private updateStats(): void {
    const stats = this.basicTable.getService().getStats();
    this.deletedCount.set(stats.deleted.count);
  }

  private openSnackBar(message: string, duration = 3000): void {
    // 用 alert 代替（避免 MatSnackBar 依赖问题）
    console.log('[SnackBar]', message);
  }
}
