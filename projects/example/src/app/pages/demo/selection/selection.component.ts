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
    selector: 'app-selection',
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
                    <mat-icon>check_box</mat-icon>
                    Row Selection Demo
                </h3>
            </div>

            <div class="selection-info">
                <div class="info-section">
                    <h4>Selection Mode:</h4>
                    <div class="mode-buttons">
                        <button mat-raised-button [color]="selectionMode === 'none' ? 'primary' : ''"
                                (click)="setSelectionMode('none')">
                            None
                        </button>
                        <button mat-raised-button [color]="selectionMode === 'single' ? 'primary' : ''"
                                (click)="setSelectionMode('single')">
                            Single
                        </button>
                        <button mat-raised-button [color]="selectionMode === 'multiple' ? 'primary' : ''"
                                (click)="setSelectionMode('multiple')">
                            Multiple
                        </button>
                    </div>
                </div>
                <div class="info-section">
                    <h4>Selected: <span class="count">{{ selectionCount }}</span> rows</h4>
                    <button mat-raised-button color="warn" (click)="clearSelection()">
                        <mat-icon>clear</mat-icon>
                        Clear Selection
                    </button>
                </div>
            </div>

            <ngx-datawindow
                [datastoreConfig]="dataStoreConfig"
                [columns]="columns"
                [data]="data"
                [tableConfig]="tableConfig"
                (selectionChanged)="onSelectionChanged($event)"
            />
        </div>
    `,
    styles: [`
        .page-container { max-width: 100%; margin: 0; padding: 0; }

        .selection-info { background: #f8f9fa; padding: 12px; border-radius: 6px; margin-bottom: 12px; border-left: 3px solid #667eea; }
        .info-section { margin-bottom: 10px; }
        .info-section:last-child { margin-bottom: 0; display: flex; align-items: center; justify-content: space-between; }
        .info-section h4 { margin: 0 0 8px 0; color: #333; font-size: 13px; }
        .info-section h4:last-child { margin-bottom: 0; }
        .count { color: #667eea; font-weight: 600; font-size: 16px; }
        .mode-buttons { display: flex; gap: 8px; }
    `],
    standalone: true,
})
export class SelectionComponent implements OnInit {
    selectionMode: 'none' | 'single' | 'multiple' = 'multiple';
    selectionCount = 0;

    data: Record<string, RawValue>[] = [];

    dataStoreConfig: DataStoreConfig = {
        name: 'selection-demo',
        fields: [
            { name: 'id', type: 'number' },
            { name: 'name', type: 'string' },
            { name: 'department', type: 'string' },
            { name: 'position', type: 'string' },
            { name: 'salary', type: 'number' },
            { name: 'status', type: 'string' }
        ] as FieldDefinition[]
    };

    columns: ColumnConfig[] = [
        { field: 'id', header: 'ID', width: '80', sortable: true },
        { field: 'name', header: 'Name', width: '120', sortable: true, filterable: true },
        { field: 'department', header: 'Department', width: '140', sortable: true, filterable: true, filterType: 'select',
            filterOptions: [
                { value: 'Engineering', label: 'Engineering' },
                { value: 'Product', label: 'Product' },
                { value: 'Design', label: 'Design' },
                { value: 'Marketing', label: 'Marketing' },
                { value: 'HR', label: 'HR' },
                { value: 'Finance', label: 'Finance' }
            ]
        },
        { field: 'position', header: 'Position', width: '140', sortable: true },
        { field: 'salary', header: 'Salary', width: '100', sortable: true, format: (v) => `¥${Number(v).toLocaleString()}` },
        { field: 'status', header: 'Status', width: '80', sortable: true, filterable: true, filterType: 'select',
            filterOptions: [
                { value: 'Active', label: 'Active' },
                { value: 'Resigned', label: 'Resigned' },
                { value: 'On Leave', label: 'On Leave' }
            ]
        }
    ];

    tableConfig: TableConfig = {
        autoHeight: true,
        title: 'Employee Management - Row Selection',
        showToolbar: true,
        showPaginator: true,
        showColumnFilter: true,
        showGlobalSearch: true,
        selectionMode: this.selectionMode,
        pagination: { defaultPageSize: 15, pageSizeOptions: [10, 15, 20, 50] },
    };

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.data = this.generateEmployees(80);
    }

    setSelectionMode(mode: 'none' | 'single' | 'multiple') {
        this.selectionMode = mode;
        this.tableConfig = {
            autoHeight: true,
            ...this.tableConfig,
            selectionMode: mode,
        };
    }

    clearSelection() {
        console.log('Clear selection requested');
    }

    onSelectionChanged(selectedRows: Set<number | string>) {
        this.selectionCount = selectedRows.size;
        console.log('Selection changed:', Array.from(selectedRows));
    }

    private generateEmployees(count: number): Record<string, RawValue>[] {
        const departments = ['Engineering', 'Product', 'Design', 'Marketing', 'HR', 'Finance'];
        const positions = ['Engineer', 'Senior Engineer', 'Manager', 'Director', 'Intern', 'Lead'];
        const statuses = ['Active', 'Resigned', 'On Leave'];
        const firstNames = ['John', 'Jane', 'Bob', 'Alice', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];
        const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor'];

        return Array.from({ length: count }, (_, i) => ({
            id: (i + 1) as RawValue,
            name: `${firstNames[i % firstNames.length]} ${lastNames[(i + 3) % lastNames.length]}` as RawValue,
            department: departments[i % departments.length] as RawValue,
            position: positions[i % positions.length] as RawValue,
            salary: Math.floor(Math.random() * 30000 + 8000) as RawValue,
            status: statuses[i % statuses.length] as RawValue,
        }));
    }
}
