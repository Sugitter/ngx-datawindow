import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
    DataTableComponent,
    ColumnConfig,
    DataStoreConfig,
    FieldDefinition,
    RawValue,
    TableConfig,
    DataRow,
    RowClickEvent,
} from 'ngx-datawindow';

@Component({
    selector: 'app-basic',
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatSnackBarModule,
        DataTableComponent
    ],
    template: `
        <div class="page-container">
            <div class="page-header">
                <h3>
                    <mat-icon>table_chart</mat-icon>
                    Basic CRUD Demo
                </h3>
            </div>

            <div class="actions-bar">
                <button mat-raised-button color="primary" (click)="loadData()">
                    <mat-icon>refresh</mat-icon>
                    Load Data
                </button>
                <button mat-raised-button color="accent" (click)="addRow()">
                    <mat-icon>add</mat-icon>
                    Add Row
                </button>
                <button mat-raised-button (click)="clearData()">
                    <mat-icon>clear</mat-icon>
                    Clear
                </button>
            </div>

            <ngx-datawindow
                [datastoreConfig]="dataStoreConfig"
                [columns]="columns"
                [data]="data"
                [tableConfig]="tableConfig"
                (rowAdded)="onRowAdded($event)"
                (rowUpdated)="onRowUpdated($event)"
                (rowDeleted)="onRowDeleted($event)"
                (rowClicked)="onRowClicked($event)"
            />
        </div>
    `,
    styles: [`
        .page-container {
            max-width: 100%;
            margin: 0;
            padding: 0;
        }

        .actions-bar {
            display: flex;
            gap: 8px;
            margin-bottom: 12px;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 6px;
        }

        button {
            border-radius: 4px;
        }
    `],
    standalone: true,
})
export class BasicComponent implements OnInit {
    data: Record<string, RawValue>[] = [];

    dataStoreConfig: DataStoreConfig = {
        name: 'basic-crud',
        fields: [
            { name: 'id', type: 'number' },
            { name: 'name', type: 'string' },
            { name: 'category', type: 'string' },
            { name: 'price', type: 'number' },
            { name: 'stock', type: 'number' },
            { name: 'status', type: 'string' }
        ] as FieldDefinition[]
    };

    columns: ColumnConfig[] = [
        { field: 'id', header: 'ID', width: '80', sortable: true },
        { field: 'name', header: 'Product Name', width: '200', sortable: true, filterable: true },
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
        { field: 'stock', header: 'Stock', width: '80', sortable: true },
        { field: 'status', header: 'Status', width: '100', sortable: true, filterable: true, filterType: 'select',
            filterOptions: [
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' },
                { value: 'Pre-order', label: 'Pre-order' },
                { value: 'Out of Stock', label: 'Out of Stock' }
            ]
        }
    ];

    tableConfig: TableConfig = {
        autoHeight: true,
        title: 'Product Management - Basic CRUD',
        showToolbar: true,
        showPaginator: true,
        showColumnFilter: true,
        showGlobalSearch: true,
        pagination: { defaultPageSize: 10, pageSizeOptions: [5, 10, 20, 50] },
        toolbarActions: {
            add: { icon: 'add', label: 'Add' },
            refresh: { icon: 'refresh', label: 'Refresh' },
        },
    };

    constructor(private snackBar: MatSnackBar) {}

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.data = this.generateProducts(50);
        this.snackBar.open(`Loaded ${this.data.length} records`, 'OK', { duration: 2000 });
    }

    addRow() {
        const newId = Math.max(...this.data.map(d => Number(d['id']))) + 1;
        this.data = [...this.data, {
            id: newId as RawValue,
            name: `New Product ${newId}` as RawValue,
            category: 'Uncategorized' as RawValue,
            price: Math.floor(Math.random() * 5000 + 100) as RawValue,
            stock: Math.floor(Math.random() * 200) as RawValue,
            status: 'Active' as RawValue,
        }];
        this.snackBar.open('New row added', 'OK', { duration: 2000 });
    }

    clearData() {
        this.data = [];
        this.snackBar.open('Data cleared', 'OK', { duration: 2000 });
    }

    onRowAdded(row: DataRow) {
        console.log('Row added:', row);
        this.snackBar.open('Row added', 'OK', { duration: 2000 });
    }

    onRowUpdated(event: { row: DataRow; changes: Record<string, unknown> }) {
        console.log('Row updated:', event);
        this.snackBar.open('Row updated', 'OK', { duration: 2000 });
    }

    onRowDeleted(rowId: string | number) {
        console.log('Row deleted:', rowId);
        this.snackBar.open('Row deleted', 'OK', { duration: 2000 });
    }

    onRowClicked(event: RowClickEvent) {
        console.log('Row clicked:', event);
    }

    private generateProducts(count: number): Record<string, RawValue>[] {
        const categories = ['Electronics', 'Office Supplies', 'Furniture', 'Clothing', 'Food'];
        const statuses = ['Active', 'Inactive', 'Pre-order', 'Out of Stock'];
        const names = [
            'MacBook Pro', 'Dell XPS', 'iPhone 15', 'iPad Pro', 'Surface Laptop',
            'ThinkPad X1', 'Huawei MateBook', 'Xiaomi Notebook', 'ASUS ZenBook', 'Lenovo Yoga',
            'Mechanical Keyboard', 'Wireless Mouse', '4K Monitor', 'USB-C Hub', 'External Drive',
            'Ergonomic Chair', 'Standing Desk', 'File Cabinet', 'Office Sofa', 'Projector',
            'Printer', 'Shredder', 'Scanner', 'Conference System', 'Whiteboard'
        ];

        return Array.from({ length: count }, (_, i) => ({
            id: (i + 1) as RawValue,
            name: `${names[i % names.length]} ${Math.floor(i / names.length) + 1}` as RawValue,
            category: categories[i % categories.length] as RawValue,
            price: Math.floor(Math.random() * 20000 + 100) as RawValue,
            stock: Math.floor(Math.random() * 500) as RawValue,
            status: statuses[i % statuses.length] as RawValue,
        }));
    }
}
