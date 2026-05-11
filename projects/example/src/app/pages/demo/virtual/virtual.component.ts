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
    selector: 'app-virtual',
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
                    <mat-icon>speed</mat-icon>
                    Virtual Scroll Demo
                </h3>
            </div>

            <div class="actions-bar">
                <div class="info-item">
                    <mat-icon>info</mat-icon>
                    <span>Data count: <strong>{{ data.length }}</strong> rows</span>
                </div>
                <div class="info-item">
                    <mat-icon>memory</mat-icon>
                    <span>Renders only visible rows, low memory usage</span>
                </div>
                <div class="info-item">
                    <mat-icon>touch_app</mat-icon>
                    <span>Smooth scrolling, no lag</span>
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
        .info-item { display: flex; align-items: center; gap: 6px; color: #555; font-size: 12px; }
        .info-item mat-icon { color: #1976d2; font-size: 16px; }
        .info-item strong { color: #1976d2; font-size: 14px; }
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
            { name: 'sales', type: 'number' }
        ] as FieldDefinition[]
    };

    columns: ColumnConfig[] = [
        { field: 'id', header: 'ID', width: '80', sortable: true, virtual: true },
        { field: 'name', header: 'Product Name', width: '250', sortable: true, filterable: true },
        { field: 'category', header: 'Category', width: '150', sortable: true, filterable: true },
        { field: 'price', header: 'Price', width: '120', sortable: true, format: (v) => `¥${Number(v).toFixed(2)}` },
        { field: 'stock', header: 'Stock', width: '100', sortable: true },
        { field: 'sales', header: 'Sales', width: '100', sortable: true }
    ];

    tableConfig: TableConfig = {
        autoHeight: true,
        title: 'Product List - Virtual Scroll (10,000 rows)',
        showToolbar: true,
        showGlobalSearch: true,
        showColumnFilter: true,
        virtualScroll: {
            enabled: true,
            rowHeight: 36,
        },
    };

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.data = this.generateProducts(10000);
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
            sales: Math.floor(Math.random() * 1000) as RawValue,
        }));
    }
}
