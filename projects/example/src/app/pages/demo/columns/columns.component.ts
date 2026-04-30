import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
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
        MatSnackBarModule,
        DataTableComponent
    ],
    template: `
        <div class="page-container">
            <div class="page-header">
                <h3>
                    <mat-icon>view_column</mat-icon>
                    Column Features Demo
                </h3>
            </div>

            <div class="features-grid">
                <div class="feature-item">
                    <h4><mat-icon>sort</mat-icon> Sort</h4>
                    <p>Click column header to sort, supports multi-column</p>
                </div>
                <div class="feature-item">
                    <h4><mat-icon>filter_list</mat-icon> Filter</h4>
                    <p>Each column supports different filter types</p>
                </div>
                <div class="feature-item">
                    <h4><mat-icon>edit</mat-icon> Edit</h4>
                    <p>Supports text, dropdown, date and more edit types</p>
                </div>
                <div class="feature-item">
                    <h4><mat-icon>text_format</mat-icon> Format</h4>
                    <p>Custom display format like currency, date</p>
                </div>
                <div class="feature-item">
                    <h4><mat-icon>vertical_align_center</mat-icon> Fixed Column</h4>
                    <p>Pin important columns on left or right</p>
                </div>
                <div class="feature-item">
                    <h4><mat-icon>visibility</mat-icon> Virtual Column</h4>
                    <p>Display row number, sequence and computed columns</p>
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
            { name: 'createdAt', type: 'string' }
        ] as FieldDefinition[]
    };

    columns: ColumnConfig[] = [
        { field: 'id', header: 'ID', width: '80', sortable: true, virtual: true },
        { field: 'name', header: 'Product Name', width: '220', sortable: true, filterable: true, editable: true, editType: 'text' },
        { field: 'category', header: 'Category', width: '150', sortable: true, filterable: true, editable: true, editType: 'select',
            editOptions: [{ value: 'Electronics', label: 'Electronics' }, { value: 'Office Supplies', label: 'Office Supplies' }, { value: 'Furniture', label: 'Furniture' }, { value: 'Clothing', label: 'Clothing' }, { value: 'Food', label: 'Food' }] },
        { field: 'price', header: 'Price', width: '120', sortable: true, format: (v) => `¥${Number(v).toFixed(2)}`, editable: true, editType: 'number' },
        { field: 'stock', header: 'Stock', width: '100', sortable: true, editable: true, editType: 'number' },
        { field: 'status', header: 'Status', width: '120', sortable: true, filterable: true, editable: true, editType: 'select',
            editOptions: [{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }, { value: 'Pre-order', label: 'Pre-order' }, { value: 'Out of Stock', label: 'Out of Stock' }] },
        { field: 'createdAt', header: 'Created At', width: '180', sortable: true, format: (v) => new Date(v as string).toLocaleString('en-US') }
    ];

    tableConfig: TableConfig = {
        autoHeight: true,
        title: 'Product Management - Column Features',
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
        const statuses = ['Active', 'Inactive', 'Pre-order', 'Out of Stock'];

        return Array.from({ length: count }, (_, i) => ({
            id: (i + 1) as RawValue,
            name: `Product ${i + 1}` as RawValue,
            category: categories[i % categories.length] as RawValue,
            price: Math.floor(Math.random() * 20000 + 100) as RawValue,
            stock: Math.floor(Math.random() * 500) as RawValue,
            status: statuses[i % statuses.length] as RawValue,
            createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString() as RawValue,
        }));
    }
}
