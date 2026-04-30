import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
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
        DataTableComponent
    ],
    template: `
        <div class="page-container">
            <div class="page-header">
                <h3>
                    <mat-icon>calculate</mat-icon>
                    Aggregation Demo
                </h3>
            </div>

            <div class="aggregation-info">
                <h4>Supported Aggregation Types:</h4>
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
        </div>
    `,
    styles: [`
        .page-container { max-width: 100%; margin: 0; padding: 0; }

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
            { name: 'amount', type: 'number' }
        ] as FieldDefinition[]
    };

    columns: ColumnConfig[] = [
        { field: 'id', header: 'ID', width: '80', sortable: true },
        { field: 'name', header: 'Product Name', width: '220', sortable: true },
        { field: 'category', header: 'Category', width: '150', sortable: true, filterable: true },
        { field: 'price', header: 'Unit Price', width: '120', sortable: true,
            format: (v) => `¥${Number(v).toFixed(2)}`,
            aggregate: { type: 'avg' } },
        { field: 'quantity', header: 'Quantity', width: '100', sortable: true,
            aggregate: { type: 'sum' } },
        { field: 'amount', header: 'Amount', width: '130', sortable: true,
            format: (v) => `¥${Number(v).toFixed(2)}`,
            aggregate: { type: 'sum' } }
    ];

    tableConfig: TableConfig = {
        autoHeight: true,
        title: 'Sales Data - Aggregation',
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
        const categories = ['Electronics', 'Office Supplies', 'Furniture', 'Clothing', 'Food'];
        const names = [
            'MacBook Pro', 'Dell XPS', 'iPhone 15', 'iPad Pro', 'Surface Laptop',
            'Mechanical Keyboard', 'Wireless Mouse', '4K Monitor', 'USB-C Hub', 'External Drive',
            'Ergonomic Chair', 'Standing Desk', 'File Cabinet', 'Office Sofa', 'Projector'
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
