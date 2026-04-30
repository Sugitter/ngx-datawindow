import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import {
    DataTableComponent,
    ColumnConfig,
    DataStoreConfig,
    FieldDefinition,
    RawValue,
    TableConfig,
    DataRow,
} from 'ngx-datawindow';

@Component({
    selector: 'app-editing',
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatSelectModule,
        DataTableComponent
    ],
    template: `
        <div class="page-container">
            <div class="page-header">
                <h3>
                    <mat-icon>edit</mat-icon>
                    Inline Editing Demo
                </h3>
            </div>

            <div class="edit-tips">
                <h4>Editing Instructions:</h4>
                <ul>
                    <li>Double-click cell or click edit button to enter edit mode</li>
                    <li>Supports text, number, dropdown, date and more edit types</li>
                    <li>Press Enter to save, Esc to cancel</li>
                    <li>Editing state is tracked in real-time, batch save or cancel available</li>
                </ul>
            </div>

            <ngx-datawindow
                [datastoreConfig]="dataStoreConfig"
                [columns]="columns"
                [data]="data"
                [tableConfig]="tableConfig"
                (rowUpdated)="onRowUpdated($event)"
            />
        </div>
    `,
    styles: [`
        .page-container { max-width: 100%; margin: 0; padding: 0; }

        .edit-tips { background: #f8f9fa; padding: 10px 12px; border-radius: 6px; margin-bottom: 12px; border-left: 3px solid #667eea; }
        .edit-tips h4 { margin: 0 0 6px 0; color: #333; font-size: 13px; }
        .edit-tips ul { margin: 0; padding-left: 16px; color: #555; line-height: 1.6; font-size: 12px; }
        .edit-tips li { margin-bottom: 2px; }
    `],
    standalone: true,
})
export class EditingComponent implements OnInit {
    data: Record<string, RawValue>[] = [];

    dataStoreConfig: DataStoreConfig = {
        name: 'editing-demo',
        fields: [
            { name: 'id', type: 'number' },
            { name: 'name', type: 'string' },
            { name: 'category', type: 'string' },
            { name: 'price', type: 'number' },
            { name: 'stock', type: 'number' },
            { name: 'status', type: 'string' },
            { name: 'description', type: 'string' }
        ] as FieldDefinition[]
    };

    columns: ColumnConfig[] = [
        { field: 'id', header: 'ID', width: '80', sortable: true },
        { field: 'name', header: 'Product Name', width: '200', sortable: true, filterable: true,
            editable: true, editType: 'text' },
        { field: 'category', header: 'Category', width: '150', sortable: true, filterable: true,
            editable: true, editType: 'select',
            editOptions: [{ value: 'Electronics', label: 'Electronics' }, { value: 'Office Supplies', label: 'Office Supplies' }, { value: 'Furniture', label: 'Furniture' }, { value: 'Clothing', label: 'Clothing' }, { value: 'Food', label: 'Food' }] },
        { field: 'price', header: 'Price', width: '120', sortable: true,
            editable: true, editType: 'number', format: (v) => `¥${Number(v).toFixed(2)}` },
        { field: 'stock', header: 'Stock', width: '100', sortable: true,
            editable: true, editType: 'number' },
        { field: 'status', header: 'Status', width: '120', sortable: true, filterable: true,
            editable: true, editType: 'select',
            editOptions: [{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }, { value: 'Pre-order', label: 'Pre-order' }, { value: 'Out of Stock', label: 'Out of Stock' }] },
        { field: 'description', header: 'Description', width: '250', editable: true, editType: 'text' }
    ];

    tableConfig: TableConfig = {
        autoHeight: true,
        title: 'Product Management - Inline Editing',
        showToolbar: true,
        showPaginator: true,
        showColumnFilter: true,
        showGlobalSearch: true,
        pagination: { defaultPageSize: 12, pageSizeOptions: [10, 12, 20, 50] },
        toolbarActions: {
            export: { label: 'Save' },
            refresh: { label: 'Reset' },
        },
    };

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.data = this.generateProducts(80);
    }

    onRowUpdated(event: { row: DataRow; changes: Record<string, unknown> }) {
        console.log('Row updated:', event);
    }

    private generateProducts(count: number): Record<string, RawValue>[] {
        const categories = ['Electronics', 'Office Supplies', 'Furniture', 'Clothing', 'Food'];
        const statuses = ['Active', 'Inactive', 'Pre-order', 'Out of Stock'];
        const descriptions = [
            'High performance product for professionals',
            'Best value choice with full features',
            'New arrival with limited time offer',
            'Classic design with lasting durability',
            'Upgraded version with significant improvements'
        ];

        return Array.from({ length: count }, (_, i) => ({
            id: (i + 1) as RawValue,
            name: `Edit Test Product ${i + 1}` as RawValue,
            category: categories[i % categories.length] as RawValue,
            price: Math.floor(Math.random() * 20000 + 100) as RawValue,
            stock: Math.floor(Math.random() * 500) as RawValue,
            status: statuses[i % statuses.length] as RawValue,
            description: descriptions[i % descriptions.length] as RawValue,
        }));
    }
}
