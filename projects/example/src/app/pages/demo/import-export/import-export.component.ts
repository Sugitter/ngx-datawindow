import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import {
  DataTableComponent,
  DataTableService,
  ColumnConfig,
  TableConfig,
} from 'ngx-datawindow';

/**
 * 导入导出示例
 * 展示 CSV/Excel 导入导出功能
 */
@Component({
  selector: 'app-import-export',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule, MatCardModule, MatSnackBarModule,
    DataTableComponent,
  ],
  template: `
    <div class="page-container">
      <h1>导入导出示例</h1>
      <p class="description">
        展示 CSV/Excel 文件的导入导出功能，支持键盘导航和范围选择。
      </p>

      <mat-card class="demo-card">
        <mat-card-header>
          <mat-card-title>操作说明</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <ul class="feature-list">
            <li><strong>导出</strong>: 点击工具栏导出按钮，选择 CSV/Excel/JSON 格式</li>
            <li><strong>导入</strong>: 点击工具栏导入按钮，选择 CSV/Excel 文件</li>
            <li><strong>键盘导航</strong>: 使用 ↑↓ 移动焦点，Enter 编辑，Tab 切换字段，Ctrl+A 全选</li>
            <li><strong>范围选择</strong>: 按住 Shift 点击选择范围</li>
          </ul>
        </mat-card-content>
      </mat-card>

      <mat-card class="data-card">
        <mat-card-header>
          <mat-card-title>数据表格</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <ngx-datawindow
            [columns]="columns"
            [tableConfig]="tableConfig"
            [data]="data"
          />
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; max-width: 1200px; margin: 0 auto; }
    h1 { margin-bottom: 8px; }
    .description { color: #666; margin-bottom: 24px; }
    .demo-card { margin-bottom: 24px; }
    .feature-list { margin: 0; padding-left: 20px; }
    .feature-list li { margin-bottom: 8px; }
    .data-card { overflow: hidden; }
  `],
  providers: [DataTableService],
})
export class ImportExportComponent {
  columns: ColumnConfig[] = [
    { field: 'id', header: 'ID', width: '80px', visible: true },
    { field: 'name', header: '姓名', width: '120px', editable: true },
    { field: 'email', header: '邮箱', width: '200px', editable: true },
    { field: 'department', header: '部门', width: '120px', editable: true },
    { field: 'salary', header: '薪资', width: '100px', format: (v) => `¥${(v as number)?.toLocaleString() ?? 0}`, editable: true },
    { field: 'hireDate', header: '入职日期', width: '120px', editable: true },
  ];

  tableConfig: TableConfig = {
    showToolbar: true,
    showPaginator: true,
    keyboardNavigation: true,
    rangeSelect: true,
    toolbarActions: {
      add: true,
      delete: true,
      refresh: true,
      export: true,
      import: true,
    },
  };

  data = [
    { id: 1, name: '张三', email: 'zhangsan@example.com', department: '研发部', salary: 15000, hireDate: '2022-01-15' },
    { id: 2, name: '李四', email: 'lisi@example.com', department: '市场部', salary: 12000, hireDate: '2021-06-20' },
    { id: 3, name: '王五', email: 'wangwu@example.com', department: '财务部', salary: 18000, hireDate: '2020-03-10' },
    { id: 4, name: '赵六', email: 'zhaoliu@example.com', department: '研发部', salary: 16000, hireDate: '2023-02-28' },
    { id: 5, name: '钱七', email: 'qianqi@example.com', department: '人事部', salary: 13000, hireDate: '2022-11-05' },
  ];

  constructor(private _snackBar: MatSnackBar) {}
}
