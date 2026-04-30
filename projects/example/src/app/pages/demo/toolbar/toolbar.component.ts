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
    ToolbarAction,
} from 'ngx-datawindow';

@Component({
    selector: 'app-toolbar',
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
                    <mat-icon>build</mat-icon>
                    Toolbar Demo
                </h3>
            </div>

            <div class="toolbar-info">
                <h4>Toolbar Features:</h4>
                <ul>
                    <li>Custom buttons: Add, Refresh, Export, etc.</li>
                    <li>Built-in actions: Add row, Delete selected, Refresh, etc.</li>
                    <li>Event handling: Listen to toolbar actions</li>
                    <li>Style customization: Title, display control, etc.</li>
                </ul>
            </div>

            <ngx-datawindow
                [datastoreConfig]="dataStoreConfig"
                [columns]="columns"
                [data]="data"
                [tableConfig]="tableConfig"
                (toolbarAction)="onToolbarAction($event)"
            />
        </div>
    `,
    styles: [`
        .page-container { max-width: 100%; margin: 0; padding: 0; }

        .toolbar-info { background: #f8f9fa; padding: 10px 12px; border-radius: 6px; margin-bottom: 12px; border-left: 3px solid #667eea; }
        .toolbar-info h4 { margin: 0 0 6px 0; color: #333; font-size: 13px; }
        .toolbar-info ul { margin: 0; padding-left: 16px; color: #555; line-height: 1.6; font-size: 12px; }
        .toolbar-info li { margin-bottom: 2px; }
    `],
    standalone: true,
})
export class ToolbarComponent implements OnInit {
    data: Record<string, RawValue>[] = [];

    dataStoreConfig: DataStoreConfig = {
        name: 'toolbar-demo',
        fields: [
            { name: 'id', type: 'number' },
            { name: 'name', type: 'string' },
            { name: 'category', type: 'string' },
            { name: 'price', type: 'number' },
            { name: 'stock', type: 'number' }
        ] as FieldDefinition[]
    };

    columns: ColumnConfig[] = [
        { field: 'id', header: 'ID', width: '80', sortable: true },
        { field: 'name', header: 'Product Name', width: '220', sortable: true, filterable: true },
        { field: 'category', header: 'Category', width: '150', sortable: true, filterable: true },
        { field: 'price', header: 'Price', width: '120', sortable: true, format: (v) => `¥${Number(v).toFixed(2)}` },
        { field: 'stock', header: 'Stock', width: '100', sortable: true }
    ];

    tableConfig: TableConfig = {
        autoHeight: true,
        title: 'Product Management - Toolbar Features',
        showToolbar: true,
        showPaginator: true,
        showColumnFilter: true,
        showGlobalSearch: true,
        pagination: { defaultPageSize: 15, pageSizeOptions: [10, 15, 20, 50] },
        toolbarActions: {
            add: { icon: 'add', label: 'Add Product' },
            delete: { icon: 'delete', label: 'Delete Selected' },
            refresh: { icon: 'refresh', label: 'Refresh Data' },
            export: { icon: 'file_download', label: 'Export' },
        },
    };

    constructor(private snackBar: MatSnackBar) {}

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.data = this.generateProducts(80);
    }

    onToolbarAction(event: { action: ToolbarAction }) {
        console.log('Toolbar action:', event.action);
        const labels: Record<string, string> = { add: 'Add', delete: 'Delete', refresh: 'Refresh', export: 'Export', custom: 'Custom' };
        this.snackBar.open(`Action: ${labels[event.action.type] || event.action.type}`, 'OK', { duration: 2000 });

        switch (event.action.id) {
            case 'refresh':
                this.loadData();
                break;
            case 'add':
                this.snackBar.open('Add product feature', 'OK', { duration: 2000 });
                break;
            case 'export':
                this.snackBar.open('Export feature demo', 'OK', { duration: 2000 });
                break;
            case 'import':
                this.snackBar.open('Import feature demo', 'OK', { duration: 2000 });
                break;
            case 'delete':
                this.snackBar.open('Delete selected feature', 'OK', { duration: 2000 });
                break;
        }
    }

    private generateProducts(count: number): Record<string, RawValue>[] {
        const categories = ['Electronics', 'Office Supplies', 'Furniture', 'Clothing', 'Food'];
        const names = [
            'MacBook Pro', 'Dell XPS', 'iPhone 15', 'iPad Pro', 'Surface Laptop',
            'ThinkPad X1', 'Huawei MateBook', 'Xiaomi Notebook', 'ASUS ZenBook', 'Lenovo Yoga',
            'Mechanical Keyboard', 'Wireless Mouse', '4K Monitor', 'USB-C Hub', 'External Drive'
        ];

        return Array.from({ length: count }, (_, i) => ({
            id: (i + 1) as RawValue,
            name: `${names[i % names.length]} ${Math.floor(i / names.length) + 1}` as RawValue,
            category: categories[i % categories.length] as RawValue,
            price: Math.floor(Math.random() * 20000 + 100) as RawValue,
            stock: Math.floor(Math.random() * 500) as RawValue,
        }));
    }
}
