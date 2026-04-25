/**
 * ngx-datatable 使用示例
 * 
 * 展示所有功能的完整用法
 */

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import {
  DataTableComponent,
  DataTableModule,
  DataStoreConfig,
  FieldDefinition,
  ColumnConfig,
  TableConfig,
  DataRow,
  RowId,
  AggregationFormula,
  createDataStore,
} from 'ngx-datawindow';

@Component({
  selector: 'app-demo',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTableModule, MatDialogModule],
  template: `
    <div class="demo-container">
      <h1>ngx-datatable 使用示例</h1>

      <!-- 基础用法 -->
      <section class="demo-section">
        <h2>1. 基础表格（员工管理）</h2>
        <ngx-datatable
          #basicTable
          [datastoreConfig]="employeeConfig"
          [columns]="employeeColumns"
          [data]="employeeData"
          [tableConfig]="basicTableConfig"
          [loading]="loading"
          (rowAdded)="onRowAdded($event)"
          (rowUpdated)="onRowUpdated($event)"
          (rowDeleted)="onRowDeleted($event)"
          (toolbarAction)="onToolbarAction($event)"
          (pageChanged)="onPageChanged($event)">
        </ngx-datatable>

        <div class="demo-actions">
          <button (click)="addEmployee()">新增员工</button>
          <button (click)="loadEmployeeData()">加载数据</button>
          <button (click)="exportData()">导出</button>
          <button (click)="validateData()">校验</button>
          <span class="validation-msg" [class.error]="!validation.valid">
            {{ validation.valid ? '✓ 校验通过' : '✗ ' + validation.errors[0]?.message }}
          </span>
        </div>
      </section>

      <!-- 虚拟列示例 -->
      <section class="demo-section">
        <h2>2. 虚拟计算列（订单管理）</h2>
        <ngx-datatable
          #orderTable
          [datastoreConfig]="orderConfig"
          [columns]="orderColumns"
          [data]="orderData"
          [tableConfig]="orderTableConfig">
        </ngx-datatable>
      </section>

      <!-- 分组聚合示例 -->
      <section class="demo-section">
        <h2>3. 分组聚合（销售统计）</h2>
        <ngx-datatable
          #salesTable
          [datastoreConfig]="salesConfig"
          [columns]="salesColumns"
          [data]="salesData"
          [tableConfig]="salesTableConfig">
        </ngx-datatable>
        <div class="demo-actions">
          <button (click)="computeAggregations()">计算聚合</button>
          @for (agg of aggregationResults; track agg.formulaId) {
            <span class="agg-result">{{ agg.formulaId }}: {{ agg.value | number:'1.2-2' }}</span>
          }
        </div>
      </section>
    </div>
  `,
  styles: [`
    .demo-container { padding: 24px; max-width: 1400px; margin: 0 auto; }
    .demo-section { margin-bottom: 48px; }
    .demo-section h2 { margin-bottom: 16px; color: #333; }
    .demo-actions { margin-top: 16px; display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
    .demo-actions button { padding: 8px 16px; background: #1976d2; color: #fff; border: none; border-radius: 4px; cursor: pointer; }
    .demo-actions button:hover { background: #1565c0; }
    .validation-msg { padding: 4px 12px; border-radius: 4px; font-size: 13px; background: #e8f5e9; color: #2e7d32; }
    .validation-msg.error { background: #ffebee; color: #c62828; }
    .agg-result { padding: 4px 12px; background: #e3f2fd; border-radius: 4px; font-size: 13px; }
  `]
})
export class DemoComponent implements OnInit {
  loading = false;
  validation = { valid: true, errors: [] as { field: string; message: string }[] };
  aggregationResults: { formulaId: string; value: number }[] = [];

  // ── 员工管理配置 ──────────────────────────────────────────────────────────

  employeeConfig: DataStoreConfig = {
    name: 'employees',
    fields: [
      { name: 'id', type: 'number', required: true },
      { name: 'name', type: 'string', required: true, displayName: '姓名' },
      { name: 'department', type: 'string', displayName: '部门' },
      { name: 'position', type: 'string', displayName: '职位' },
      { name: 'email', type: 'string' },
      { name: 'salary', type: 'number', displayName: '薪资' },
      { name: 'hireDate', type: 'date', displayName: '入职日期' },
      { name: 'active', type: 'boolean', displayName: '在职' },
    ],
  };

  employeeColumns: ColumnConfig[] = [
    { field: 'id', header: 'ID', width: '60px', filterable: false },
    { field: 'name', header: '姓名', width: '120px', editable: true, filterType: 'text' },
    { field: 'department', header: '部门', width: '120px', filterType: 'select',
      filterOptions: [
        { value: '技术部', label: '技术部' },
        { value: '销售部', label: '销售部' },
        { value: '财务部', label: '财务部' },
        { value: '人事部', label: '人事部' },
      ]
    },
    { field: 'position', header: '职位', editable: true },
    { field: 'email', header: '邮箱', editable: true },
    { field: 'salary', header: '薪资', width: '100px', align: 'right', editable: true, editType: 'number',
      filterType: 'number',
      aggregate: { type: 'sum', precision: 0 } },
    { field: 'hireDate', header: '入职日期', width: '120px', editable: true, editType: 'date' },
    { field: 'active', header: '在职', width: '80px', editable: true, editType: 'checkbox', filterType: 'boolean' },
  ];

  basicTableConfig: TableConfig = {
    title: '员工管理',
    showTitle: true,
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
    },
    pagination: {
      pageSizeOptions: [10, 25, 50, 100],
      defaultPageSize: 10,
      showPageSizeSelector: true,
      showTotalCount: true,
    },
    emptyMessage: '暂无员工数据',
    loadingMessage: '正在加载员工数据...',
  };

  employeeData: Record<string, unknown>[] = [];

  // ── 订单管理配置（虚拟列）───────────────────────────────────────────────

  orderConfig: DataStoreConfig = {
    name: 'orders',
    fields: [
      { name: 'id', type: 'number', required: true },
      { name: 'product', type: 'string', displayName: '产品' },
      { name: 'quantity', type: 'number', displayName: '数量' },
      { name: 'unitPrice', type: 'number', displayName: '单价' },
      { name: 'discount', type: 'number', displayName: '折扣率' },
      // 虚拟计算列
      { name: 'subtotal', type: 'virtual', virtual: true, displayName: '小计',
        formula: (row) => (row.raw['quantity'] as number) * (row.raw['unitPrice'] as number) },
      { name: 'amount', type: 'virtual', virtual: true, displayName: '实付金额',
        formula: (row) => {
          const qty = row.raw['quantity'] as number;
          const price = row.raw['unitPrice'] as number;
          const disc = (row.raw['discount'] as number) || 0;
          return qty * price * (1 - disc);
        }},
      { name: 'status', type: 'string', displayName: '状态' },
    ],
  };

  orderColumns: ColumnConfig[] = [
    { field: 'id', header: '订单号', width: '100px' },
    { field: 'product', header: '产品', editable: true },
    { field: 'quantity', header: '数量', editable: true, editType: 'number' },
    { field: 'unitPrice', header: '单价', editable: true, editType: 'number', align: 'right' },
    { field: 'discount', header: '折扣', editable: true, editType: 'number',
      format: (v) => v != null ? `${(Number(v) * 100).toFixed(0)}%` : '' },
    { field: 'subtotal', header: '小计', virtual: true, align: 'right',
      aggregate: { type: 'sum', precision: 2 } },
    { field: 'amount', header: '实付金额', virtual: true, align: 'right',
      aggregate: { type: 'sum', precision: 2 } },
    { field: 'status', header: '状态', editable: true, editType: 'select',
      editOptions: [
        { value: 'pending', label: '待处理' },
        { value: 'processing', label: '处理中' },
        { value: 'completed', label: '已完成' },
        { value: 'cancelled', label: '已取消' },
      ]
    },
  ];

  orderTableConfig: TableConfig = {
    title: '订单管理（含虚拟计算列）',
    showToolbar: true,
    showGlobalSearch: true,
    showColumnFilter: true,
    selectionMode: 'multiple',
    toolbarActions: { add: true, delete: true, refresh: true, export: true },
    pagination: { pageSizeOptions: [10, 25, 50], defaultPageSize: 10 },
  };

  orderData: Record<string, unknown>[] = [];

  // ── 销售统计配置 ────────────────────────────────────────────────────────

  salesConfig: DataStoreConfig = {
    name: 'sales',
    fields: [
      { name: 'id', type: 'number' },
      { name: 'region', type: 'string', displayName: '地区' },
      { name: 'product', type: 'string', displayName: '产品' },
      { name: 'sales', type: 'number', displayName: '销售额' },
      { name: 'cost', type: 'number', displayName: '成本' },
      { name: 'profit', type: 'virtual', virtual: true, displayName: '利润',
        formula: (row) => (row.raw['sales'] as number) - (row.raw['cost'] as number) },
    ],
  };

  salesColumns: ColumnConfig[] = [
    { field: 'id', header: 'ID', width: '60px' },
    { field: 'region', header: '地区', filterable: true, filterType: 'select',
      filterOptions: [
        { value: '华北', label: '华北' },
        { value: '华东', label: '华东' },
        { value: '华南', label: '华南' },
        { value: '西南', label: '西南' },
      ]
    },
    { field: 'product', header: '产品' },
    { field: 'sales', header: '销售额', align: 'right', aggregate: { type: 'sum', precision: 2 } },
    { field: 'cost', header: '成本', align: 'right', aggregate: { type: 'sum', precision: 2 } },
    { field: 'profit', header: '利润', virtual: true, align: 'right',
      aggregate: { type: 'sum', precision: 2 } },
  ];

  salesTableConfig: TableConfig = {
    title: '销售统计（分组聚合）',
    showToolbar: true,
    showGlobalSearch: true,
    selectionMode: 'multiple',
    toolbarActions: { add: true, delete: true, refresh: true, export: true },
    pagination: { pageSizeOptions: [10, 25, 50], defaultPageSize: 10 },
  };

  salesData: Record<string, unknown>[] = [];

  // ── 生命周期 ────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.loadEmployeeData();
    this.loadOrderData();
    this.loadSalesData();
  }

  // ── 数据加载 ────────────────────────────────────────────────────────────

  loadEmployeeData(): void {
    this.loading = true;
    // 模拟异步加载
    setTimeout(() => {
      this.employeeData = [
        { id: 1, name: '张三', department: '技术部', position: '高级工程师', email: 'zhang@example.com', salary: 25000, hireDate: '2020-01-15', active: true },
        { id: 2, name: '李四', department: '销售部', position: '销售经理', email: 'li@example.com', salary: 18000, hireDate: '2019-06-01', active: true },
        { id: 3, name: '王五', department: '技术部', position: '架构师', email: 'wang@example.com', salary: 35000, hireDate: '2018-03-20', active: true },
        { id: 4, name: '赵六', department: '财务部', position: '财务主管', email: 'zhao@example.com', salary: 22000, hireDate: '2017-09-10', active: false },
        { id: 5, name: '钱七', department: '人事部', position: '招聘专员', email: 'qian@example.com', salary: 12000, hireDate: '2021-02-01', active: true },
        { id: 6, name: '孙八', department: '技术部', position: '前端工程师', email: 'sun@example.com', salary: 20000, hireDate: '2020-08-15', active: true },
        { id: 7, name: '周九', department: '销售部', position: '销售代表', email: 'zhou@example.com', salary: 15000, hireDate: '2021-04-01', active: true },
        { id: 8, name: '吴十', department: '技术部', position: '后端工程师', email: 'wu@example.com', salary: 22000, hireDate: '2019-11-20', active: true },
        { id: 9, name: '郑十一', department: '财务部', position: '会计', email: 'zheng@example.com', salary: 14000, hireDate: '2020-05-01', active: true },
        { id: 10, name: '冯十二', department: '技术部', position: '测试工程师', email: 'feng@example.com', salary: 16000, hireDate: '2021-07-01', active: true },
        { id: 11, name: '陈十三', department: '销售部', position: '区域经理', email: 'chen@example.com', salary: 28000, hireDate: '2018-02-15', active: true },
        { id: 12, name: '楚十四', department: '人事部', position: 'HRBP', email: 'chu@example.com', salary: 20000, hireDate: '2019-09-01', active: true },
      ];
      this.loading = false;
    }, 500);
  }

  loadOrderData(): void {
    this.orderData = [
      { id: 1001, product: 'iPhone 15 Pro', quantity: 2, unitPrice: 8999, discount: 0.1, status: 'completed' },
      { id: 1002, product: 'MacBook Pro 14"', quantity: 1, unitPrice: 19999, discount: 0, status: 'processing' },
      { id: 1003, product: 'AirPods Pro', quantity: 5, unitPrice: 1899, discount: 0.05, status: 'completed' },
      { id: 1004, product: 'iPad Air', quantity: 3, unitPrice: 4399, discount: 0.08, status: 'pending' },
      { id: 1005, product: 'Apple Watch', quantity: 4, unitPrice: 2999, discount: 0, status: 'completed' },
    ];
  }

  loadSalesData(): void {
    this.salesData = [
      { id: 1, region: '华北', product: '手机', sales: 1200000, cost: 800000 },
      { id: 2, region: '华北', product: '电脑', sales: 980000, cost: 650000 },
      { id: 3, region: '华东', product: '手机', sales: 1500000, cost: 950000 },
      { id: 4, region: '华东', product: '电脑', sales: 1100000, cost: 720000 },
      { id: 5, region: '华南', product: '手机', sales: 1350000, cost: 880000 },
      { id: 6, region: '华南', product: '平板', sales: 720000, cost: 480000 },
      { id: 7, region: '西南', product: '手机', sales: 680000, cost: 450000 },
      { id: 8, region: '西南', product: '配件', sales: 320000, cost: 180000 },
    ];
  }

  // ── 操作处理 ────────────────────────────────────────────────────────────

  addEmployee(): void {
    const newId = Math.max(...this.employeeData.map(e => e['id'] as number)) + 1;
    const newRow = {
      id: newId,
      name: '新员工',
      department: '技术部',
      position: '工程师',
      email: 'new@example.com',
      salary: 15000,
      hireDate: new Date().toISOString().split('T')[0],
      active: true,
    };
    this.employeeData = [newRow, ...this.employeeData];
  }

  onRowAdded(row: DataRow): void {
    console.log('新增行:', row);
  }

  onRowUpdated(event: { row: DataRow; changes: Record<string, unknown> }): void {
    console.log('更新行:', event);
  }

  onRowDeleted(rowId: RowId): void {
    console.log('删除行 ID:', rowId);
  }

  onToolbarAction(event: { action: { type: string } }): void {
    console.log('工具栏操作:', event.action.type);
  }

  onPageChanged(event: any): void {
    console.log('分页变化:', event);
  }

  exportData(): void {
    // 触发组件导出
  }

  validateData(): void {
    const table = document.querySelector('ngx-datatable') as any;
    if (table) {
      this.validation = table.validate();
    }
  }

  computeAggregations(): void {
    const table = document.querySelectorAll('ngx-datatable')[2] as any;
    if (table) {
      const svc = table.getService();
      // 注册聚合公式
      svc.registerAggregation({
        id: 'total_sales', name: '总销售额', type: 'sum', field: 'sales'
      });
      svc.registerAggregation({
        id: 'total_cost', name: '总成本', type: 'sum', field: 'cost'
      });
      svc.registerAggregation({
        id: 'total_profit', name: '总利润', type: 'sum', field: 'profit'
      });

      const results = svc.computeAllAggregations();
      this.aggregationResults = Object.values(results).map((r: any) => ({
        formulaId: r.formulaId,
        value: r.value as number
      }));
    }
  }
}
