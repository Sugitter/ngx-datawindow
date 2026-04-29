import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import {
    DataTableComponent,
    ColumnConfig,
    DataStoreConfig,
    FieldDefinition,
    RawValue,
    TableConfig,
} from 'ngx-datawindow';

@Component({
    selector: 'app-columns',
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatCardModule,
        MatSnackBarModule,
        DataTableComponent,
    ],
    template: `
        <div class="page-container">
            <mat-card class="demo-card">
                <mat-card-header>
                    <mat-card-title>
                        <mat-icon>view_column</mat-icon>
                        列特性演示
                    </mat-card-title>
                    <mat-card-subtitle>
                        展示列的各种特性：排序、筛选、可编辑、格式化、固定列、虚拟列等
                    </mat-card-subtitle>
                </mat-card-header>

                <mat-card-content>
                    <div class="features-grid">
                        <div class="feature-item">
                            <h4><mat-icon>sort</mat-icon> 排序</h4>
                            <p>点击列头进行排序，支持多列排序</p>
                        </div>
                        <div class="feature-item">
                            <h4><mat-icon>filter_list</mat-icon> 筛选</h4>
                            <p>每列支持不同类型的筛选器</p>
                        </div>
                        <div class="feature-item">
                            <h4><mat-icon>edit</mat-icon> 编辑</h4>
                            <p>支持文本框、下拉框、日期等多种编辑类型</p>
                        </div>
                        <div class="feature-item">
                            <h4><mat-icon>text_format</mat-icon> 格式化</h4>
                            <p>自定义显示格式，如货币、日期等</p>
                        </div>
                        <div class="feature-item">
                            <h4><mat-icon>vertical_align_center</mat-icon> 固定列</h4>
                            <p>左右两侧可以固定重要列</p>
                        </div>
                        <div class="feature-item">
                            <h4><mat-icon>visibility</mat-icon> 虚拟列</h4>
                            <p>显示行号、序号等虚拟计算的列</p>
                        </div>
                    </div>

                    <ngx-datawindow
                        [datastoreConfig]="dataStoreConfig"
                        [columns]="columns"
                        [data]="data"
                        [tableConfig]="tableConfig"
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
        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; margin-bottom: 12px; }
        .feature-item { background: #f8f9fa; padding: 10px; border-radius: 6px; border-left: 3px solid #667eea; }
        .feature-item h4 { margin: 0 0 4px 0; display: flex; align-items: center; gap: 6px; color: #333; font-size: 12px; }
        .feature-item h4 mat-icon { color: #667eea; font-size: 16px; }
        .feature-item p { margin: 0; color: #666; font-size: 11px; line-height: 1.4; }
    `],
    standalone: true,
})
export class ColumnsComponent implements OnInit {
    data: Record<string, RawValue>[] = [];

    dataStoreConfig: DataStoreConfig = {
        name: 'columns-demo',
        fields: [
            { name: 'id', type: 'number' },
            { name: 'name', type: 'string' },
            { name: 'category', type: 'string' },
            { name: 'price', type: 'number' },
            { name: 'stock', type: 'number' },
            { name: 'status', type: 'string' },
            { name: 'createdAt', type: 'string' },
        ] as FieldDefinition[]
    };

    columns: ColumnConfig[] = [
        { field: 'id', header: 'ID', width: '80', sortable: true, virtual: true },
        { field: 'name', header: '产品名称', width: '220', sortable: true, filterable: true, editable: true, editType: 'text' },
        { field: 'category', header: '分类', width: '150', sortable: true, filterable: true, editable: true, editType: 'select',
            editOptions: [{ value: '电子产品', label: '电子产品' }, { value: '办公用品', label: '办公用品' }, { value: '家具', label: '家具' }, { value: '服装', label: '服装' }, { value: '食品', label: '食品' }] },
        { field: 'price', header: '价格', width: '120', sortable: true, format: (v) => `¥${Number(v).toFixed(2)}`, editable: true, editType: 'number' },
        { field: 'stock', header: '库存', width: '100', sortable: true, editable: true, editType: 'number' },
        { field: 'status', header: '状态', width: '120', sortable: true, filterable: true, editable: true, editType: 'select',
            editOptions: [{ value: '在售', label: '在售' }, { value: '下架', label: '下架' }, { value: '预售', label: '预售' }, { value: '缺货', label: '缺货' }] },
        { field: 'createdAt', header: '创建时间', width: '180', sortable: true, format: (v) => new Date(v as string).toLocaleString('zh-CN') },
    ];

    tableConfig: TableConfig = {
        title: '产品管理 - 列特性展示',
        showToolbar: true,
        showPaginator: true,
        showColumnFilter: true,
        showGlobalSearch: true,
        pagination: { defaultPageSize: 15, pageSizeOptions: [10, 15, 20, 50] },
    };

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.data = this.generateProducts(100);
    }

    private generateProducts(count: number): Record<string, RawValue>[] {
        const categories = ['电子产品', '办公用品', '家具', '服装', '食品'];
        const statuses = ['在售', '下架', '预售', '缺货'];

        return Array.from({ length: count }, (_, i) => ({
            id: (i + 1) as RawValue,
            name: `产品 ${i + 1}` as RawValue,
            category: categories[i % categories.length] as RawValue,
            price: Math.floor(Math.random() * 20000 + 100) as RawValue,
            stock: Math.floor(Math.random() * 500) as RawValue,
            status: statuses[i % statuses.length] as RawValue,
            createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString() as RawValue,
        }));
    }
}
