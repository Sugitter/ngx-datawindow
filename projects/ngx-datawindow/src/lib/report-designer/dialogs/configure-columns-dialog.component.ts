import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { TableColumn } from '../report-template.model';

export interface ConfigureColumnsData {
  columns: TableColumn[];
}

@Component({
  selector: 'report-designer-configure-columns-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatTableModule,
  ],
  template: `
    <h2 mat-dialog-title>配置表格列</h2>
    <mat-dialog-content>
      <p class="info-text">拖拽排序，或点击编辑/删除。</p>

      <table class="columns-table">
        <thead>
          <tr>
            <th style="width:30px"></th>
            <th>列名</th>
            <th>字段</th>
            <th>宽度</th>
            <th>对齐</th>
            <th style="width:60px">操作</th>
          </tr>
        </thead>
        <tbody>
          @for (col of columns; track $index; let i = $index) {
            <tr>
              <td><mat-icon class="drag-handle">drag_indicator</mat-icon></td>
              <td>
                <input class="inline-input" [(ngModel)]="col.header" placeholder="显示名称">
              </td>
              <td>
                <input class="inline-input" [(ngModel)]="col.field" placeholder="数据字段">
              </td>
              <td>
                <input class="inline-input narrow" type="number" [(ngModel)]="col.width" placeholder="宽度">
              </td>
              <td>
                <select class="inline-select" [(ngModel)]="col.align">
                  <option value="left">左对齐</option>
                  <option value="center">居中</option>
                  <option value="right">右对齐</option>
                </select>
              </td>
              <td>
                <button mat-icon-button color="warn" (click)="removeColumn(i)" matTooltip="删除">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </tr>
          }
        </tbody>
      </table>

      <div class="add-row">
        <button mat-button color="primary" (click)="addColumn()">
          <mat-icon>add</mat-icon> 添加列
        </button>
      </div>

      <h4 class="section-title">快速添加</h4>
      <div class="quick-add">
        @for (field of availableFields; track field) {
          <button mat-stroked-button (click)="quickAdd(field)">{{ field }}</button>
        }
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">取消</button>
      <button mat-raised-button color="primary" (click)="confirm()">确定</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .info-text { font-size: 13px; color: #666; margin-bottom: 12px; }
    .columns-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    .columns-table th { background: #f5f5f5; padding: 8px; text-align: left; font-size: 13px; }
    .columns-table td { padding: 4px 2px; vertical-align: middle; }
    .columns-table input, .columns-table select {
      width: 100%; border: 1px solid #ddd; border-radius: 4px;
      padding: 4px 8px; font-size: 13px; box-sizing: border-box;
    }
    .columns-table input:focus, .columns-table select:focus { border-color: #3f51b5; outline: none; }
    .inline-input.narrow { width: 60px; }
    .drag-handle { font-size: 18px; color: #999; cursor: grab; }
    .add-row { text-align: left; margin-bottom: 16px; }
    .section-title { font-size: 13px; font-weight: 500; color: #333; margin: 12px 0 8px; }
    .quick-add { display: flex; flex-wrap: wrap; gap: 6px; }
    mat-dialog-content { min-width: 480px; }
  `]
})
export class ConfigureColumnsDialogComponent {
  private dialogRef = inject(MatDialogRef<ConfigureColumnsDialogComponent>);
  private dialogData = inject<ConfigureColumnsData>(MAT_DIALOG_DATA);

  columns: TableColumn[] = this.dialogData.columns
    ? JSON.parse(JSON.stringify(this.dialogData.columns))
    : [];

  // 常用字段快速添加
  availableFields = ['id', 'name', 'code', 'amount', 'price', 'quantity', 'total',
    'customer', 'orderNo', 'date', 'status', 'remark', 'phone', 'email', 'address'];

  addColumn(): void {
    this.columns.push({
      field: '',
      header: '',
      width: 100,
      align: 'left',
      visible: true,
    });
  }

  removeColumn(index: number): void {
    this.columns.splice(index, 1);
  }

  quickAdd(field: string): void {
    if (this.columns.some(c => c.field === field)) return;
    this.columns.push({
      field,
      header: field,
      width: 100,
      align: 'left',
      visible: true,
    });
  }

  confirm(): void {
    // 过滤掉空字段
    const valid = this.columns.filter(c => c.field.trim());
    this.dialogRef.close(valid);
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
