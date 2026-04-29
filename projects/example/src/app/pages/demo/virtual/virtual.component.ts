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
    selector: 'app-virtual',
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
                        <mat-icon>speed</mat-icon>
                        虚拟滚动演示
                    </mat-card-title>
                    <mat-card-subtitle>
                        展示大数据量下的虚拟滚动性能，流畅渲染 10,000+ 行数据
                    </mat-card-subtitle>
                </mat-card-header>

                <mat-card-content>
                    <div class="virtual-info">
                        <div class="info-item">
                            <mat-icon>info</mat-icon>
                            <span>数据量：<strong>{{ data.length }}</strong> 行</span>
                        </div>
                        <div class="info-item">
                            <mat-icon>memory</mat-icon>
                            <span>仅渲染可见区域行，内存占用低</span>
                        </div>
                        <div class="info-item">
                            <mat-icon>touch_app</mat-icon>
                            <span>滚动流畅，无卡顿</span>
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
        .virtual-info { display: flex; gap: 16px; margin-bottom: 12px; padding: 10px 12px; background: #f8f9fa; border-radius: 6px; flex-wrap: wrap; }
        .info-item { display: flex; align-items: center; gap: 6px; color: #555; font-size: 12px; }
        .info-item mat-icon { color: #667eea; font-size: 16px; }
        .info-item strong { color: #667eea; font-size: 14px; }
    `],
    standalone: true,
})
export class VirtualComponent implements OnInit {
    data: Record<string, RawValue>[] = [];

    dataStoreConfig: DataStoreConfig = {
        name: 'virtual-demo',
        fields: [
            { name: 'id', type: 'number' },
            { name: 'name', type: 'string' },
            { name: 'category', type: 'string' },
            { name: 'price', type: 'number' },
            { name: 'stock', type: 'number' },
            { name: 'sales', type: 'number' },
        ] as FieldDefinition[]
    };

    columns: ColumnConfig[] = [
        { field: 'id', header: 'ID', width: '80', sortable: true, virtual: true },
        { field: 'name', header: '产品名称', width: '250', sortable: true, filterable: true },
        { field: 'category', header: '分类', width: '150', sortable: true, filterable: true },
        { field: 'price', header: '价格', width: '120', sortable: true, format: (v) => `¥${Number(v).toFixed(2)}` },
        { field: 'stock', header: '库存', width: '100', sortable: true },
        { field: 'sales', header: '销量', width: '100', sortable: true },
    ];

    tableConfig: TableConfig = {
        title: '产品列表 - 虚拟滚动（10,000 行）',
        showToolbar: true,
        showGlobalSearch: true,
        showColumnFilter: true,
        virtualScroll: {
            enabled: true,
            rowHeight: 48,
        },
    };

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.data = this.generateProducts(10000);
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
            sales: Math.floor(Math.random() * 1000) as RawValue,
        }));
    }
}
