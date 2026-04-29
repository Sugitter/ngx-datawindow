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
    ToolbarAction,
} from 'ngx-datawindow';

@Component({
    selector: 'app-toolbar',
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
                        <mat-icon>build</mat-icon>
                        工具栏演示
                    </mat-card-title>
                    <mat-card-subtitle>
                        展示自定义工具栏按钮、内置操作、事件处理等功能
                    </mat-card-subtitle>
                </mat-card-header>

                <mat-card-content>
                    <div class="toolbar-info">
                        <h4>工具栏功能：</h4>
                        <ul>
                            <li>自定义按钮：添加、刷新、导出等</li>
                            <li>内置操作：添加行、删除选中、刷新等</li>
                            <li>事件处理：监听工具栏动作</li>
                            <li>样式定制：标题、显示控制等</li>
                        </ul>
                    </div>

                    <ngx-datawindow
                        [datastoreConfig]="dataStoreConfig"
                        [columns]="columns"
                        [data]="data"
                        [tableConfig]="tableConfig"
                        (toolbarAction)="onToolbarAction($event)"
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
            { name: 'stock', type: 'number' },
        ] as FieldDefinition[]
    };

    columns: ColumnConfig[] = [
        { field: 'id', header: 'ID', width: '80', sortable: true },
        { field: 'name', header: '产品名称', width: '220', sortable: true, filterable: true },
        { field: 'category', header: '分类', width: '150', sortable: true, filterable: true },
        { field: 'price', header: '价格', width: '120', sortable: true, format: (v) => `¥${Number(v).toFixed(2)}` },
        { field: 'stock', header: '库存', width: '100', sortable: true },
    ];

    tableConfig: TableConfig = {
        title: '产品管理 - 工具栏功能',
        showToolbar: true,
        showPaginator: true,
        showColumnFilter: true,
        showGlobalSearch: true,
        pagination: { defaultPageSize: 15, pageSizeOptions: [10, 15, 20, 50] },
        toolbarActions: {
            add: { icon: 'add', label: '新增产品' },
            delete: { icon: 'delete', label: '删除选中' },
            refresh: { icon: 'refresh', label: '刷新数据' },
            export: { icon: 'file_download', label: '导出' },
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
        const labels: Record<string, string> = { add: '新增', delete: '删除', refresh: '刷新', export: '导出', custom: '自定义' };
        this.snackBar.open(`操作: ${labels[event.action.type] || event.action.type}`, '确定', { duration: 2000 });

        switch (event.action.id) {
            case 'refresh':
                this.loadData();
                break;
            case 'add':
                this.snackBar.open('添加产品功能', '确定', { duration: 2000 });
                break;
            case 'export':
                this.snackBar.open('导出功能演示', '确定', { duration: 2000 });
                break;
            case 'import':
                this.snackBar.open('导入功能演示', '确定', { duration: 2000 });
                break;
            case 'delete':
                this.snackBar.open('删除选中功能', '确定', { duration: 2000 });
                break;
        }
    }

    private generateProducts(count: number): Record<string, RawValue>[] {
        const categories = ['电子产品', '办公用品', '家具', '服装', '食品'];
        const names = [
            'MacBook Pro', 'Dell XPS', 'iPhone 15', 'iPad Pro', 'Surface Laptop',
            'ThinkPad X1', '华为 MateBook', '小米笔记本', '华硕 ZenBook', '联想 Yoga',
            '机械键盘', '无线鼠标', '4K 显示器', 'USB-C 扩展坞', '移动硬盘',
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
