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
    selector: 'app-selection',
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
                        <mat-icon>check_box</mat-icon>
                        行选择演示
                    </mat-card-title>
                    <mat-card-subtitle>
                        展示单选、多选等选择模式
                    </mat-card-subtitle>
                </mat-card-header>

                <mat-card-content>
                    <div class="selection-info">
                        <div class="info-section">
                            <h4>选择模式：</h4>
                            <div class="mode-buttons">
                                <button mat-raised-button [color]="selectionMode === 'none' ? 'primary' : ''"
                                        (click)="setSelectionMode('none')">
                                    无选择
                                </button>
                                <button mat-raised-button [color]="selectionMode === 'single' ? 'primary' : ''"
                                        (click)="setSelectionMode('single')">
                                    单选
                                </button>
                                <button mat-raised-button [color]="selectionMode === 'multiple' ? 'primary' : ''"
                                        (click)="setSelectionMode('multiple')">
                                    多选
                                </button>
                            </div>
                        </div>
                        <div class="info-section">
                            <h4>已选择：<span class="count">{{ selectionCount }}</span> 行</h4>
                            <button mat-raised-button color="warn" (click)="clearSelection()">
                                <mat-icon>clear</mat-icon>
                                清除选择
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
            { name: 'status', type: 'string' },
        ] as FieldDefinition[]
    };

    columns: ColumnConfig[] = [
        { field: 'id', header: 'ID', width: '80', sortable: true },
        { field: 'name', header: '姓名', width: '120', sortable: true, filterable: true },
        { field: 'department', header: '部门', width: '140', sortable: true, filterable: true, filterType: 'select',
            filterOptions: [
                { value: '技术部', label: '技术部' },
                { value: '产品部', label: '产品部' },
                { value: '设计部', label: '设计部' },
                { value: '市场部', label: '市场部' },
                { value: '人力资源部', label: '人力资源部' },
                { value: '财务部', label: '财务部' },
            ]
        },
        { field: 'position', header: '职位', width: '140', sortable: true },
        { field: 'salary', header: '薪资', width: '100', sortable: true, format: (v) => `¥${Number(v).toLocaleString()}` },
        { field: 'status', header: '状态', width: '80', sortable: true, filterable: true, filterType: 'select',
            filterOptions: [
                { value: '在职', label: '在职' },
                { value: '离职', label: '离职' },
                { value: '休假', label: '休假' },
            ]
        },
    ];

    tableConfig: TableConfig = {
        title: '员工管理 - 行选择',
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
        const departments = ['技术部', '产品部', '设计部', '市场部', '人力资源部', '财务部'];
        const positions = ['工程师', '高级工程师', '经理', '总监', '实习生', '主管'];
        const statuses = ['在职', '离职', '休假'];
        const surnames = ['张', '李', '王', '赵', '刘', '陈', '杨', '黄', '周', '吴'];
        const givenNames = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '军'];

        return Array.from({ length: count }, (_, i) => ({
            id: (i + 1) as RawValue,
            name: `${surnames[i % surnames.length]}${givenNames[(i + 3) % givenNames.length]}` as RawValue,
            department: departments[i % departments.length] as RawValue,
            position: positions[i % positions.length] as RawValue,
            salary: Math.floor(Math.random() * 30000 + 8000) as RawValue,
            status: statuses[i % statuses.length] as RawValue,
        }));
    }
}
