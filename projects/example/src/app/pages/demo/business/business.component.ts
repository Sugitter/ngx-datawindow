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
    ToolbarAction,
} from 'ngx-datawindow';

@Component({
    selector: 'app-business',
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
            <mat-card class="demo-card business-card">
                <mat-card-header>
                    <mat-card-title>
                        <mat-icon>business_center</mat-icon>
                        综合业务演示 - 电商订单管理系统
                    </mat-card-title>
                    <mat-card-subtitle>
                        真实业务场景：展示订单管理、库存控制、财务统计等完整业务流程
                    </mat-card-subtitle>
                </mat-card-header>

                <mat-card-content>
                    <div class="business-stats">
                        <div class="stat-card">
                            <mat-icon>shopping_cart</mat-icon>
                            <div class="stat-content">
                                <div class="stat-value">{{ totalOrders }}</div>
                                <div class="stat-label">总订单数</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <mat-icon>pending_actions</mat-icon>
                            <div class="stat-content">
                                <div class="stat-value">{{ pendingOrders }}</div>
                                <div class="stat-label">待处理</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <mat-icon>payments</mat-icon>
                            <div class="stat-content">
                                <div class="stat-value">¥{{ totalAmount.toLocaleString() }}</div>
                                <div class="stat-label">总金额</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <mat-icon>trending_up</mat-icon>
                            <div class="stat-content">
                                <div class="stat-value">¥{{ avgAmount.toFixed(0) }}</div>
                                <div class="stat-label">客单价</div>
                            </div>
                        </div>
                    </div>

                    <ngx-datawindow
                        [datastoreConfig]="dataStoreConfig"
                        [columns]="columns"
                        [data]="data"
                        [tableConfig]="tableConfig"
                        (rowAdded)="onRowAdded($event)"
                        (rowUpdated)="onRowUpdated($event)"
                        (rowDeleted)="onRowDeleted($event)"
                        (toolbarAction)="onToolbarAction($event)"
                        (selectionChanged)="onSelectionChanged($event)"
                    />
                </mat-card-content>
            </mat-card>
        </div>
    `,
    styles: [`
        .page-container { max-width: 100%; margin: 0; padding: 0; }
        .business-card { border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.12); overflow: hidden; }
        mat-card-header { background: linear-gradient(135deg, #1a237e 0%, #283593 50%, #3949ab 100%); color: white; margin: -16px -16px 16px -16px; padding: 16px 20px; }
        mat-card-title { display: flex; align-items: center; gap: 10px; font-size: 18px !important; margin-bottom: 8px; font-weight: 600; }
        mat-card-title mat-icon { color: white; font-size: 22px !important; width: 22px !important; height: 22px !important; }
        mat-card-subtitle { color: rgba(255,255,255,0.9) !important; margin-top: 4px !important; font-size: 12px !important; }
        .business-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; margin-bottom: 16px; }
        .stat-card { display: flex; align-items: center; gap: 12px; padding: 12px; background: #f8f9fa; border-radius: 8px; border-left: 3px solid #667eea; transition: transform 0.2s; }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .stat-card mat-icon { font-size: 28px !important; width: 28px !important; height: 28px !important; color: #667eea; }
        .stat-content { flex: 1; }
        .stat-value { font-size: 18px; font-weight: 700; color: #333; line-height: 1.2; }
        .stat-label { font-size: 11px; color: #666; margin-top: 2px; }
    `],
    standalone: true,
})
export class BusinessComponent implements OnInit {
    data: Record<string, RawValue>[] = [];
    totalOrders = 0;
    pendingOrders = 0;
    totalAmount = 0;
    avgAmount = 0;
    selectedCount = 0;

    dataStoreConfig: DataStoreConfig = {
        name: 'business-orders',
        fields: [
            { name: 'orderId', type: 'string' },
            { name: 'customerName', type: 'string' },
            { name: 'product', type: 'string' },
            { name: 'category', type: 'string' },
            { name: 'quantity', type: 'number' },
            { name: 'unitPrice', type: 'number' },
            { name: 'totalPrice', type: 'number' },
            { name: 'orderDate', type: 'string' },
            { name: 'status', type: 'string' },
            { name: 'paymentMethod', type: 'string' },
            { name: 'region', type: 'string' },
        ] as FieldDefinition[]
    };

    columns: ColumnConfig[] = [
        { field: 'orderId', header: '订单号', width: '140', sortable: true, filterable: true },
        { field: 'customerName', header: '客户名称', width: '150', sortable: true, filterable: true, editable: true, editType: 'text' },
        { field: 'product', header: '商品名称', width: '200', sortable: true, filterable: true },
        { field: 'category', header: '分类', width: '120', sortable: true, filterable: true, editable: true, editType: 'select',
            editOptions: [{ value: '电子产品', label: '电子产品' }, { value: '办公用品', label: '办公用品' }, { value: '家具', label: '家具' }, { value: '服装', label: '服装' }, { value: '食品', label: '食品' }] },
        { field: 'quantity', header: '数量', width: '80', sortable: true, editable: true, editType: 'number', aggregate: { type: 'sum' } },
        { field: 'unitPrice', header: '单价', width: '110', sortable: true, format: (v) => `¥${Number(v).toFixed(2)}` },
        { field: 'totalPrice', header: '总价', width: '120', sortable: true, format: (v) => `¥${Number(v).toFixed(2)}`, aggregate: { type: 'sum' } },
        { field: 'orderDate', header: '下单时间', width: '170', sortable: true },
        { field: 'status', header: '状态', width: '110', sortable: true, filterable: true, editable: true, editType: 'select',
            editOptions: [{ value: '待付款', label: '待付款' }, { value: '待发货', label: '待发货' }, { value: '运输中', label: '运输中' }, { value: '已签收', label: '已签收' }, { value: '已取消', label: '已取消' }, { value: '退款中', label: '退款中' }] },
        { field: 'paymentMethod', header: '支付方式', width: '120', sortable: true, filterable: true },
        { field: 'region', header: '地区', width: '100', sortable: true, filterable: true },
    ];

    tableConfig: TableConfig = {
        title: '电商订单管理系统 - 实时数据',
        showToolbar: true,
        showPaginator: true,
        showColumnFilter: true,
        showGlobalSearch: true,
        selectionMode: 'multiple',
        pagination: { defaultPageSize: 20, pageSizeOptions: [10, 20, 50, 100] },
        toolbarActions: {
            add: { label: '新建订单' },
            delete: { label: '批量取消' },
            refresh: { label: '刷新数据' },
            export: { label: '导出' },
        },
    };

    constructor(private snackBar: MatSnackBar) {}

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.data = this.generateOrders(300);
        this.calculateStats();
        this.snackBar.open(`已加载 ${this.data.length} 条订单数据`, '确定', { duration: 2000 });
    }

    onRowAdded(row: DataRow) {
        console.log('Order added:', row);
        this.snackBar.open('订单已添加', '确定', { duration: 2000 });
        this.calculateStats();
    }

    onRowUpdated(event: { row: DataRow; changes: Record<string, unknown> }) {
        console.log('Order updated:', event);
        this.snackBar.open('订单已更新', '确定', { duration: 2000 });
        this.calculateStats();
    }

    onRowDeleted(rowId: string | number) {
        console.log('Order deleted:', rowId);
        this.snackBar.open('订单已删除', '确定', { duration: 2000 });
        this.calculateStats();
    }

    onToolbarAction(event: { action: ToolbarAction }) {
        console.log('Toolbar action:', event.action);
        const labels: Record<string, string> = { add: '新增', delete: '删除', refresh: '刷新', export: '导出', custom: '自定义' };
        this.snackBar.open(`操作: ${labels[event.action.type] || event.action.type}`, '确定', { duration: 2000 });

        switch (event.action.type) {
            case 'add':
                this.addNewOrder();
                break;
            case 'refresh':
                this.loadData();
                break;
            case 'delete':
                this.snackBar.open(`删除 ${this.selectedCount} 个订单（演示）`, '确定', { duration: 2000 });
                break;
        }
    }

    onSelectionChanged(selectedRows: Set<number | string>) {
        this.selectedCount = selectedRows.size;
        console.log('Selected rows:', this.selectedCount);
    }

    private addNewOrder() {
        const newId = `ORD${Date.now().toString().slice(-8)}`;
        const products = ['MacBook Pro', 'Dell XPS', 'iPhone 15', 'iPad Pro', 'Surface Laptop',
            '机械键盘', '无线鼠标', '4K 显示器', 'USB-C 扩展坞', '移动硬盘'];
        const categories = ['电子产品', '办公用品', '家具', '服装', '食品'];
        const statuses = ['待付款', '待发货', '运输中', '已签收', '已取消', '退款中'];
        const payments = ['支付宝', '微信支付', '银行卡', '信用卡'];
        const regions = ['华东', '华南', '华北', '华中', '西南', '西北', '东北'];

        const quantity = Math.floor(Math.random() * 10 + 1);
        const unitPrice = Math.floor(Math.random() * 20000 + 100);
        const totalPrice = quantity * unitPrice;

        const newOrder = {
            orderId: newId as RawValue,
            customerName: `客户 ${Math.floor(Math.random() * 1000 + 1)}` as RawValue,
            product: products[Math.floor(Math.random() * products.length)] as RawValue,
            category: categories[Math.floor(Math.random() * categories.length)] as RawValue,
            quantity: quantity as RawValue,
            unitPrice: unitPrice as RawValue,
            totalPrice: totalPrice as RawValue,
            orderDate: new Date().toISOString() as RawValue,
            status: statuses[Math.floor(Math.random() * 2)] as RawValue,
            paymentMethod: payments[Math.floor(Math.random() * payments.length)] as RawValue,
            region: regions[Math.floor(Math.random() * regions.length)] as RawValue,
        };

        this.data = [...this.data, newOrder];
        this.calculateStats();
        this.snackBar.open('新建订单成功', '确定', { duration: 2000 });
    }

    private calculateStats() {
        this.totalOrders = this.data.length;
        this.pendingOrders = this.data.filter(d => ['待付款', '待发货'].includes(d['status'] as string)).length;
        this.totalAmount = this.data.reduce((sum, d) => sum + Number(d['totalPrice']), 0);
        this.avgAmount = this.totalOrders > 0 ? this.totalAmount / this.totalOrders : 0;
    }

    private generateOrders(count: number): Record<string, RawValue>[] {
        const products = ['MacBook Pro', 'Dell XPS', 'iPhone 15', 'iPad Pro', 'Surface Laptop',
            'ThinkPad X1', '华为 MateBook', '小米笔记本', '华硕 ZenBook', '联想 Yoga',
            '机械键盘', '无线鼠标', '4K 显示器', 'USB-C 扩展坞', '移动硬盘',
            '人体工学椅', '电动升降桌', '文件柜', '办公沙发', '投影仪'];
        const categories = ['电子产品', '办公用品', '家具', '服装', '食品'];
        const statuses = ['待付款', '待发货', '运输中', '已签收', '已取消', '退款中'];
        const payments = ['支付宝', '微信支付', '银行卡', '信用卡'];
        const regions = ['华东', '华南', '华北', '华中', '西南', '西北', '东北'];
        const surnames = ['张', '李', '王', '赵', '刘', '陈', '杨', '黄', '周', '吴'];
        const givenNames = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '军'];

        return Array.from({ length: count }, (_, i) => {
            const quantity = Math.floor(Math.random() * 10 + 1);
            const unitPrice = Math.floor(Math.random() * 20000 + 100);
            const totalPrice = quantity * unitPrice;

            return {
                orderId: `ORD${String(20240001 + i)}` as RawValue,
                customerName: `${surnames[i % surnames.length]}${givenNames[(i + 3) % givenNames.length]}` as RawValue,
                product: products[i % products.length] as RawValue,
                category: categories[i % categories.length] as RawValue,
                quantity: quantity as RawValue,
                unitPrice: unitPrice as RawValue,
                totalPrice: totalPrice as RawValue,
                orderDate: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString() as RawValue,
                status: statuses[i % statuses.length] as RawValue,
                paymentMethod: payments[i % payments.length] as RawValue,
                region: regions[i % regions.length] as RawValue,
            };
        });
    }
}
