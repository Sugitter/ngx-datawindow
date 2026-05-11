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
      <div class="page-header">
        <h3>
          <mat-icon>upload_file</mat-icon>
          Import / Export Demo
        </h3>
      </div>

      <div class="actions-bar">
        <div class="info-item">
          <mat-icon>info</mat-icon>
          <span>Export: use toolbar export button, choose CSV/Excel/JSON</span>
        </div>
        <div class="info-item">
          <mat-icon>keyboard</mat-icon>
          <span>Keyboard: ↑↓ navigate, Enter edit, Tab switch fields, Ctrl+A select</span>
        </div>
        <div class="info-item">
          <mat-icon>select_all</mat-icon>
          <span>Range select: hold Shift and click to select range</span>
        </div>
      </div>

      <ngx-datawindow
        [columns]="columns"
        [tableConfig]="tableConfig"
        [data]="data"
      />
    </div>
  `,
  styles: [`
    .info-item { display: flex; align-items: center; gap: 6px; color: #555; font-size: 12px; }
    .info-item mat-icon { color: #1976d2; font-size: 16px; }
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
