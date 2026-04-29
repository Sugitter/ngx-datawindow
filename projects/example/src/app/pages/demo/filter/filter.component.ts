import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import {
    DataTableComponent,
    ColumnConfig,
    DataStoreConfig,
    FieldDefinition,
    RawValue,
    TableConfig,
} from 'ngx-datawindow';

@Component({
    selector: 'app-filter',
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatCardModule,
        DataTableComponent,
    ],
    template: `
        <div class="page-container">
            <mat-card class="demo-card">
                <mat-card-header>
                    <mat-card-title>
                        <mat-icon>filter_list</mat-icon>
                        筛选与排序演示
                    </mat-card-title>
                    <mat-card-subtitle>
                        展示全局搜索、列筛选、多列排序、自定义筛选器等高级功能
                    </mat-card-subtitle>
                </mat-card-header>

                <mat-card-content>
                    <div class="filter-demo-info">
                        <div class="info-item">
                            <mat-icon>search</mat-icon>
                            <span>使用上方工具栏的全局搜索框搜索所有列</span>
                        </div>
                        <div class="info-item">
                            <mat-icon>filter_list</mat-icon>
                            <span>点击列头下方的筛选图标进行列筛选</span>
                        </div>
                        <div class="info-item">
                            <mat-icon>sort</mat-icon>
                            <span>点击列头进行排序，Shift+点击多列排序</span>
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
        .filter-demo-info { display: flex; gap: 16px; margin-bottom: 12px; padding: 10px; background: #f8f9fa; border-radius: 6px; flex-wrap: wrap; }
        .info-item { display: flex; align-items: center; gap: 6px; color: #555; font-size: 12px; }
        .info-item mat-icon { color: #667eea; font-size: 16px; }
    `],
    standalone: true,
})
export class FilterComponent implements OnInit {
    data: Record<string, RawValue>[] = [];

    dataStoreConfig: DataStoreConfig = {
        name: 'filter-demo',
        fields: [
            { name: 'id', type: 'number' },
            { name: 'name', type: 'string' },
            { name: 'category', type: 'string' },
            { name: 'price', type: 'number' },
            { name: 'stock', type: 'number' },
            { name: 'rating', type: 'number' },
            { name: 'createdAt', type: 'string' },
        ] as FieldDefinition[]
    };

    columns: ColumnConfig[] = [
        { field: 'id', header: 'ID', width: '80', sortable: true },
        { field: 'name', header: '产品名称', width: '200', sortable: true, filterable: true, filterType: 'text' },
        { field: 'category', header: '分类', width: '120', sortable: true, filterable: true, filterType: 'select',
            filterOptions: [
                { value: '电子产品', label: '电子产品' },
                { value: '办公用品', label: '办公用品' },
                { value: '家具', label: '家具' },
                { value: '服装', label: '服装' },
                { value: '食品', label: '食品' },
            ]
        },
        { field: 'price', header: '价格', width: '100', sortable: true, format: (v) => `¥${Number(v).toFixed(2)}` },
        { field: 'stock', header: '库存', width: '80', sortable: true, filterable: true, filterType: 'number' },
        { field: 'rating', header: '评分', width: '80', sortable: true, format: (v) => '★'.repeat(Math.floor(Number(v))) + '☆'.repeat(5 - Math.floor(Number(v))) },
        { field: 'createdAt', header: '创建时间', width: '150', sortable: true },
    ];

    tableConfig: TableConfig = {
        title: '产品管理 - 筛选与排序',
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
        const names = [
            'MacBook Pro', 'Dell XPS', 'iPhone 15', 'iPad Pro', 'Surface Laptop',
            'ThinkPad X1', '华为 MateBook', '小米笔记本', '华硕 ZenBook', '联想 Yoga',
            '机械键盘', '无线鼠标', '4K 显示器', 'USB-C 扩展坞', '移动硬盘',
            '人体工学椅', '电动升降桌', '文件柜', '办公沙发', '投影仪',
        ];

        return Array.from({ length: count }, (_, i) => ({
            id: (i + 1) as RawValue,
            name: `${names[i % names.length]} ${Math.floor(i / names.length) + 1}` as RawValue,
            category: categories[i % categories.length] as RawValue,
            price: Math.floor(Math.random() * 20000 + 100) as RawValue,
            stock: Math.floor(Math.random() * 500) as RawValue,
            rating: (Math.random() * 3 + 2).toFixed(1) as unknown as RawValue,
            createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString() as RawValue,
        }));
    }
}
