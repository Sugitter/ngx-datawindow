import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import {
    DataTableComponent,
    ColumnConfig,
    DataStoreConfig,
    FieldDefinition,
    RawValue,
    TableConfig,
    DataRow,
} from 'ngx-datawindow';

@Component({
    selector: 'app-editing',
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatCardModule,
        MatSelectModule,
        DataTableComponent,
    ],
    template: `
        <div class="page-container">
            <mat-card class="demo-card">
                <mat-card-header>
                    <mat-card-title>
                        <mat-icon>edit</mat-icon>
                        行内编辑演示
                    </mat-card-title>
                    <mat-card-subtitle>
                        展示各种编辑类型：文本框、数字框、下拉选择、日期选择等
                    </mat-card-subtitle>
                </mat-card-header>

                <mat-card-content>
                    <div class="edit-tips">
                        <h4>编辑说明：</h4>
                        <ul>
                            <li>双击单元格或点击编辑按钮进入编辑模式</li>
                            <li>支持文本框、数字、下拉框、日期等多种编辑类型</li>
                            <li>编辑后按 Enter 保存，Esc 取消</li>
                            <li>编辑状态会实时追踪，可以批量保存或取消</li>
                        </ul>
                    </div>

                    <ngx-datawindow
                        [datastoreConfig]="dataStoreConfig"
                        [columns]="columns"
                        [data]="data"
                        [tableConfig]="tableConfig"
                        (rowUpdated)="onRowUpdated($event)"
                    />
                </mat-card-content>
            </mat-card>
        </div>
    `,
    styles: [`
        .page-container { max-width: 100%; margin: 0; padding: 0; }
        .demo-card { border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden; }
        mat-card-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; margin: -16px -16px 12px -16px; padding: 12px 16px; }
        mat-card-title { display: flex; align-items: center; gap: 8px; font-size: 16px !important; margin-bottom: 4px; }
        mat-card-title mat-icon { color: white; }
        mat-card-subtitle { color: rgba(255,255,255,0.85) !important; margin-top: 4px !important; font-size: 12px !important; }
        .edit-tips { background: #f8f9fa; padding: 10px 12px; border-radius: 6px; margin-bottom: 12px; border-left: 3px solid #667eea; }
        .edit-tips h4 { margin: 0 0 6px 0; color: #333; font-size: 13px; }
        .edit-tips ul { margin: 0; padding-left: 16px; color: #555; line-height: 1.6; font-size: 12px; }
        .edit-tips li { margin-bottom: 2px; }
    `],
    standalone: true,
})
export class EditingComponent implements OnInit {
    data: Record<string, RawValue>[] = [];

    dataStoreConfig: DataStoreConfig = {
        name: 'editing-demo',
        fields: [
            { name: 'id', type: 'number' },
            { name: 'name', type: 'string' },
            { name: 'category', type: 'string' },
            { name: 'price', type: 'number' },
            { name: 'stock', type: 'number' },
            { name: 'status', type: 'string' },
            { name: 'description', type: 'string' },
        ] as FieldDefinition[]
    };

    columns: ColumnConfig[] = [
        { field: 'id', header: 'ID', width: '80', sortable: true },
        { field: 'name', header: '产品名称', width: '200', sortable: true, filterable: true,
            editable: true, editType: 'text' },
        { field: 'category', header: '分类', width: '150', sortable: true, filterable: true,
            editable: true, editType: 'select',
            editOptions: [{ value: '电子产品', label: '电子产品' }, { value: '办公用品', label: '办公用品' }, { value: '家具', label: '家具' }, { value: '服装', label: '服装' }, { value: '食品', label: '食品' }] },
        { field: 'price', header: '价格', width: '120', sortable: true,
            editable: true, editType: 'number', format: (v) => `¥${Number(v).toFixed(2)}` },
        { field: 'stock', header: '库存', width: '100', sortable: true,
            editable: true, editType: 'number' },
        { field: 'status', header: '状态', width: '120', sortable: true, filterable: true,
            editable: true, editType: 'select',
            editOptions: [{ value: '在售', label: '在售' }, { value: '下架', label: '下架' }, { value: '预售', label: '预售' }, { value: '缺货', label: '缺货' }] },
        { field: 'description', header: '描述', width: '250', editable: true, editType: 'text' },
    ];

    tableConfig: TableConfig = {
        title: '产品管理 - 行内编辑',
        showToolbar: true,
        showPaginator: true,
        showColumnFilter: true,
        showGlobalSearch: true,
        pagination: { defaultPageSize: 12, pageSizeOptions: [10, 12, 20, 50] },
        toolbarActions: {
            export: { label: '保存' },
            refresh: { label: '重置' },
        },
    };

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.data = this.generateProducts(80);
    }

    onRowUpdated(event: { row: DataRow; changes: Record<string, unknown> }) {
        console.log('Row updated:', event);
    }

    private generateProducts(count: number): Record<string, RawValue>[] {
        const categories = ['电子产品', '办公用品', '家具', '服装', '食品'];
        const statuses = ['在售', '下架', '预售', '缺货'];
        const descriptions = [
            '高性能产品，适合专业用户',
            '性价比之选，功能全面',
            '新品上市，限时优惠',
            '经典款型，经久耐用',
            '升级版，性能提升显著',
        ];

        return Array.from({ length: count }, (_, i) => ({
            id: (i + 1) as RawValue,
            name: `编辑测试产品 ${i + 1}` as RawValue,
            category: categories[i % categories.length] as RawValue,
            price: Math.floor(Math.random() * 20000 + 100) as RawValue,
            stock: Math.floor(Math.random() * 500) as RawValue,
            status: statuses[i % statuses.length] as RawValue,
            description: descriptions[i % descriptions.length] as RawValue,
        }));
    }
}
