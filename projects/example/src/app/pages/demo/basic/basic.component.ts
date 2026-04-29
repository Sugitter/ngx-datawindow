import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
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
        MatCardModule,
        MatSnackBarModule,
        DataTableComponent,
    ],
    template: `
        <div class="page-container">
            <mat-card class="demo-card">
                <mat-card-header>
                    <mat-card-title>
                        <mat-icon>table_chart</mat-icon>
                        基础 CRUD 演示
                    </mat-card-title>
                    <mat-card-subtitle>
                        展示基本的增删改查功能，包括行添加、编辑、删除和状态追踪
                    </mat-card-subtitle>
                </mat-card-header>

                <mat-card-content>
                    <div class="actions-bar">
                        <button mat-raised-button color="primary" (click)="loadData()">
                            <mat-icon>refresh</mat-icon>
                            加载数据
                        </button>
                        <button mat-raised-button color="accent" (click)="addRow()">
                            <mat-icon>add</mat-icon>
                            添加行
                        </button>
                        <button mat-raised-button (click)="clearData()">
                            <mat-icon>clear</mat-icon>
                            清空
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
                </mat-card-content>
            </mat-card>
        </div>
    `,
    styles: [`
        .page-container {
            max-width: 100%;
            margin: 0;
            padding: 0;
        }

        .demo-card {
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            overflow: hidden;
        }

        mat-card-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            margin: -16px -16px 12px -16px;
            padding: 12px 16px;
        }

        mat-card-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 16px !important;
            margin-bottom: 4px;
        }

        mat-card-title mat-icon {
            color: white;
        }

        mat-card-subtitle {
            color: rgba(255,255,255,0.85) !important;
            margin-top: 4px !important;
            font-size: 12px !important;
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
            { name: 'status', type: 'string' },
        ] as FieldDefinition[]
    };

    columns: ColumnConfig[] = [
        { field: 'id', header: 'ID', width: '80', sortable: true },
        { field: 'name', header: '产品名称', width: '200', sortable: true, filterable: true },
        { field: 'category', header: '分类', width: '120', sortable: true, filterable: true, filterType: 'select',
            filterOptions: [
                { value: '电子产品', label: '电子产品' },
                { value: '办公用品', label: '办公用品' },
                { value: '家具', label: '家具' },
                { value: '服装', label: '服装' },
                { value: '食品', label: '食品' },
            ]
        },
        { field: 'price', header: '价格', width: '100', sortable: true, format: (v) => `¥${Number(v).toFixed(2)}` },
        { field: 'stock', header: '库存', width: '80', sortable: true },
        { field: 'status', header: '状态', width: '100', sortable: true, filterable: true, filterType: 'select',
            filterOptions: [
                { value: '在售', label: '在售' },
                { value: '下架', label: '下架' },
                { value: '预售', label: '预售' },
                { value: '缺货', label: '缺货' },
            ]
        },
    ];

    tableConfig: TableConfig = {
        title: '产品管理 - 基础 CRUD',
        showToolbar: true,
        showPaginator: true,
        showColumnFilter: true,
        showGlobalSearch: true,
        pagination: { defaultPageSize: 10, pageSizeOptions: [5, 10, 20, 50] },
        toolbarActions: {
            add: { icon: 'add', label: '新增' },
            refresh: { icon: 'refresh', label: '刷新' },
        },
    };

    constructor(private snackBar: MatSnackBar) {}

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.data = this.generateProducts(50);
        this.snackBar.open(`已加载 ${this.data.length} 条数据`, '确定', { duration: 2000 });
    }

    addRow() {
        const newId = Math.max(...this.data.map(d => Number(d['id']))) + 1;
        this.data = [...this.data, {
            id: newId as RawValue,
            name: `新产品 ${newId}` as RawValue,
            category: '未分类' as RawValue,
            price: Math.floor(Math.random() * 5000 + 100) as RawValue,
            stock: Math.floor(Math.random() * 200) as RawValue,
            status: '在售' as RawValue,
        }];
        this.snackBar.open('已添加新行', '确定', { duration: 2000 });
    }

    clearData() {
        this.data = [];
        this.snackBar.open('数据已清空', '确定', { duration: 2000 });
    }

    onRowAdded(row: DataRow) {
        console.log('Row added:', row);
        this.snackBar.open('行已添加', '确定', { duration: 2000 });
    }

    onRowUpdated(event: { row: DataRow; changes: Record<string, unknown> }) {
        console.log('Row updated:', event);
        this.snackBar.open('行已更新', '确定', { duration: 2000 });
    }

    onRowDeleted(rowId: string | number) {
        console.log('Row deleted:', rowId);
        this.snackBar.open('行已删除', '确定', { duration: 2000 });
    }

    onRowClicked(event: RowClickEvent) {
        console.log('Row clicked:', event);
    }

    private generateProducts(count: number): Record<string, RawValue>[] {
        const categories = ['电子产品', '办公用品', '家具', '服装', '食品'];
        const statuses = ['在售', '下架', '预售', '缺货'];
        const names = [
            'MacBook Pro', 'Dell XPS', 'iPhone 15', 'iPad Pro', 'Surface Laptop',
            'ThinkPad X1', '华为 MateBook', '小米笔记本', '华硕 ZenBook', '联想 Yoga',
            '机械键盘', '无线鼠标', '4K 显示器', 'USB-C 扩展坞', '移动硬盘',
            '人体工学椅', '电动升降桌', '文件柜', '办公沙发', '投影仪',
            '打印机', '碎纸机', '扫描仪', '会议系统', '白板',
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
