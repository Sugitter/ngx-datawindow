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
    AggregationType,
} from 'ngx-datawindow';

@Component({
    selector: 'app-aggregation',
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
                        <mat-icon>calculate</mat-icon>
                        聚合计算演示
                    </mat-card-title>
                    <mat-card-subtitle>
                        展示求和、平均值、计数、最大值、最小值等聚合计算功能
                    </mat-card-subtitle>
                </mat-card-header>

                <mat-card-content>
                    <div class="aggregation-info">
                        <h4>支持的聚合类型：</h4>
                        <div class="agg-types">
                            <span class="agg-badge" *ngFor="let type of aggregationTypes">{{ type }}</span>
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
        .aggregation-info { background: #f8f9fa; padding: 10px 12px; border-radius: 6px; margin-bottom: 12px; border-left: 3px solid #667eea; }
        .aggregation-info h4 { margin: 0 0 8px 0; color: #333; font-size: 13px; }
        .agg-types { display: flex; gap: 6px; flex-wrap: wrap; }
        .agg-badge { padding: 4px 10px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px; font-size: 11px; font-weight: 500; }
    `],
    standalone: true,
})
export class AggregationComponent implements OnInit {
    aggregationTypes: AggregationType[] = ['sum', 'avg', 'count', 'max', 'min'];

    data: Record<string, RawValue>[] = [];

    dataStoreConfig: DataStoreConfig = {
        name: 'aggregation-demo',
        fields: [
            { name: 'id', type: 'number' },
            { name: 'name', type: 'string' },
            { name: 'category', type: 'string' },
            { name: 'price', type: 'number' },
            { name: 'quantity', type: 'number' },
            { name: 'amount', type: 'number' },
        ] as FieldDefinition[]
    };

    columns: ColumnConfig[] = [
        { field: 'id', header: 'ID', width: '80', sortable: true },
        { field: 'name', header: '产品名称', width: '220', sortable: true },
        { field: 'category', header: '分类', width: '150', sortable: true, filterable: true },
        { field: 'price', header: '单价', width: '120', sortable: true,
            format: (v) => `¥${Number(v).toFixed(2)}`,
            aggregate: { type: 'avg' } },
        { field: 'quantity', header: '数量', width: '100', sortable: true,
            aggregate: { type: 'sum' } },
        { field: 'amount', header: '金额', width: '130', sortable: true,
            format: (v) => `¥${Number(v).toFixed(2)}`,
            aggregate: { type: 'sum' } },
    ];

    tableConfig: TableConfig = {
        title: '销售数据 - 聚合计算',
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
        this.data = this.generateSalesData(100);
    }

    private generateSalesData(count: number): Record<string, RawValue>[] {
        const categories = ['电子产品', '办公用品', '家具', '服装', '食品'];
        const names = [
            'MacBook Pro', 'Dell XPS', 'iPhone 15', 'iPad Pro', 'Surface Laptop',
            '机械键盘', '无线鼠标', '4K 显示器', 'USB-C 扩展坞', '移动硬盘',
            '人体工学椅', '电动升降桌', '文件柜', '办公沙发', '投影仪',
        ];

        return Array.from({ length: count }, (_, i) => {
            const price = Math.floor(Math.random() * 20000 + 100);
            const quantity = Math.floor(Math.random() * 50 + 1);
            return {
                id: (i + 1) as RawValue,
                name: `${names[i % names.length]} ${Math.floor(i / names.length) + 1}` as RawValue,
                category: categories[i % categories.length] as RawValue,
                price: price as RawValue,
                quantity: quantity as RawValue,
                amount: (price * quantity) as RawValue,
            };
        });
    }
}
