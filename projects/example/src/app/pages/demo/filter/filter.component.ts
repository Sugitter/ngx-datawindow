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
} from 'ngx-datawindow';

@Component({
    selector: 'app-filter',
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
                    <mat-icon>filter_list</mat-icon>
                    Filter & Sort Demo
                </h3>
            </div>

            <div class="filter-demo-info">
                <div class="info-item">
                    <mat-icon>search</mat-icon>
                    <span>Use the global search box in toolbar to search all columns</span>
                </div>
                <div class="info-item">
                    <mat-icon>filter_list</mat-icon>
                    <span>Click the filter icon below column header to filter</span>
                </div>
                <div class="info-item">
                    <mat-icon>sort</mat-icon>
                    <span>Click column header to sort, Shift+click for multi-column</span>
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
            { name: 'createdAt', type: 'string' }
        ] as FieldDefinition[]
    };

    columns: ColumnConfig[] = [
        { field: 'id', header: 'ID', width: '80', sortable: true },
        { field: 'name', header: 'Product Name', width: '200', sortable: true, filterable: true, filterType: 'text' },
        { field: 'category', header: 'Category', width: '120', sortable: true, filterable: true, filterType: 'select',
            filterOptions: [
                { value: 'Electronics', label: 'Electronics' },
                { value: 'Office Supplies', label: 'Office Supplies' },
                { value: 'Furniture', label: 'Furniture' },
                { value: 'Clothing', label: 'Clothing' },
                { value: 'Food', label: 'Food' }
            ]
        },
        { field: 'price', header: 'Price', width: '100', sortable: true, format: (v) => `¥${Number(v).toFixed(2)}` },
        { field: 'stock', header: 'Stock', width: '80', sortable: true, filterable: true, filterType: 'number' },
        { field: 'rating', header: 'Rating', width: '80', sortable: true, format: (v) => '★'.repeat(Math.floor(Number(v))) + '☆'.repeat(5 - Math.floor(Number(v))) },
        { field: 'createdAt', header: 'Created At', width: '150', sortable: true }
    ];

    tableConfig: TableConfig = {
        autoHeight: true,
        title: 'Product Management - Filter & Sort',
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
        const categories = ['Electronics', 'Office Supplies', 'Furniture', 'Clothing', 'Food'];
        const names = [
            'MacBook Pro', 'Dell XPS', 'iPhone 15', 'iPad Pro', 'Surface Laptop',
            'ThinkPad X1', 'Huawei MateBook', 'Xiaomi Notebook', 'ASUS ZenBook', 'Lenovo Yoga',
            'Mechanical Keyboard', 'Wireless Mouse', '4K Monitor', 'USB-C Hub', 'External Drive',
            'Ergonomic Chair', 'Standing Desk', 'File Cabinet', 'Office Sofa', 'Projector'
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
