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
    ToolbarAction,
} from 'ngx-datawindow';

@Component({
    selector: 'app-business',
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
                    <mat-icon>business_center</mat-icon>
                    Business Demo - E-commerce Order Management
                </h3>
            </div>

            <div class="business-stats">
                <div class="stat-card">
                    <mat-icon>shopping_cart</mat-icon>
                    <div class="stat-content">
                        <div class="stat-value">{{ totalOrders }}</div>
                        <div class="stat-label">Total Orders</div>
                    </div>
                </div>
                <div class="stat-card">
                    <mat-icon>pending_actions</mat-icon>
                    <div class="stat-content">
                        <div class="stat-value">{{ pendingOrders }}</div>
                        <div class="stat-label">Pending</div>
                    </div>
                </div>
                <div class="stat-card">
                    <mat-icon>payments</mat-icon>
                    <div class="stat-content">
                        <div class="stat-value">$ {{ totalAmount.toLocaleString() }}</div>
                        <div class="stat-label">Total Amount</div>
                    </div>
                </div>
                <div class="stat-card">
                    <mat-icon>trending_up</mat-icon>
                    <div class="stat-content">
                        <div class="stat-value">$ {{ avgAmount.toFixed(0) }}</div>
                        <div class="stat-label">Avg. Order</div>
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
        </div>
    `,
    styles: [`
        .page-container { max-width: 100%; margin: 0; padding: 0; }
        .page-header { background: linear-gradient(135deg, #1a237e 0%, #283593 50%, #3949ab 100%); color: white; padding: 14px 18px; }
        .page-header h3 { color: white; display: flex; align-items: center; gap: 10px; font-size: 16px; font-weight: 600; margin: 0; }
        .page-header h3 mat-icon { color: white; font-size: 20px !important; width: 20px !important; height: 20px !important; }
        .business-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; padding: 12px 18px; }
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
            { name: 'region', type: 'string' }
    ] as FieldDefinition[]
    };

    columns: ColumnConfig[] = [
        { field: 'orderId', header: 'Order ID', width: '140', sortable: true, filterable: true },
        { field: 'customerName', header: 'Customer', width: '150', sortable: true, filterable: true, editable: true, editType: 'text' },
        { field: 'product', header: 'Product', width: '200', sortable: true, filterable: true },
        { field: 'category', header: 'Category', width: '120', sortable: true, filterable: true, editable: true, editType: 'select',
            editOptions: [
                { value: 'Electronics', label: 'Electronics' },
                { value: 'Office Supplies', label: 'Office Supplies' },
                { value: 'Furniture', label: 'Furniture' },
                { value: 'Clothing', label: 'Clothing' },
                { value: 'Food', label: 'Food' }
            ] },
        { field: 'quantity', header: 'Qty', width: '80', sortable: true, editable: true, editType: 'number', aggregate: { type: 'sum' } },
        { field: 'unitPrice', header: 'Unit Price', width: '110', sortable: true, format: (v) => `$${Number(v).toFixed(2)}` },
        { field: 'totalPrice', header: 'Total', width: '120', sortable: true, format: (v) => `$${Number(v).toFixed(2)}`, aggregate: { type: 'sum' } },
        { field: 'orderDate', header: 'Order Date', width: '170', sortable: true },
        { field: 'status', header: 'Status', width: '110', sortable: true, filterable: true, editable: true, editType: 'select',
            editOptions: [
                { value: 'Pending Payment', label: 'Pending Payment' },
                { value: 'Pending Shipment', label: 'Pending Shipment' },
                { value: 'In Transit', label: 'In Transit' },
                { value: 'Delivered', label: 'Delivered' },
                { value: 'Cancelled', label: 'Cancelled' },
                { value: 'Refunding', label: 'Refunding' }
            ] },
        { field: 'paymentMethod', header: 'Payment', width: '120', sortable: true, filterable: true },
        { field: 'region', header: 'Region', width: '100', sortable: true, filterable: true }
    ];

    tableConfig: TableConfig = {
        autoHeight: true,
        title: 'E-commerce Order Management - Live Data',
        showToolbar: true,
        showPaginator: true,
        showColumnFilter: true,
        showGlobalSearch: true,
        selectionMode: 'multiple',
        pagination: { defaultPageSize: 20, pageSizeOptions: [10, 20, 50, 100] },
        toolbarActions: {
            add: { label: 'New Order' },
            delete: { label: 'Batch Cancel' },
            refresh: { label: 'Refresh' },
            export: { label: 'Export' },
        },
    };

    constructor(private snackBar: MatSnackBar) {}

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.data = this.generateOrders(300);
        this.calculateStats();
        this.snackBar.open(`Loaded ${this.data.length} order records`, 'OK', { duration: 2000 });
    }

    onRowAdded(row: DataRow) {
        console.log('Order added:', row);
        this.snackBar.open('Order added', 'OK', { duration: 2000 });
        this.calculateStats();
    }

    onRowUpdated(event: { row: DataRow; changes: Record<string, unknown> }) {
        console.log('Order updated:', event);
        this.snackBar.open('Order updated', 'OK', { duration: 2000 });
        this.calculateStats();
    }

    onRowDeleted(rowId: string | number) {
        console.log('Order deleted:', rowId);
        this.snackBar.open('Order deleted', 'OK', { duration: 2000 });
        this.calculateStats();
    }

    onToolbarAction(event: { action: ToolbarAction }) {
        console.log('Toolbar action:', event.action);
        const labels: Record<string, string> = { add: 'Add', delete: 'Delete', refresh: 'Refresh', export: 'Export', custom: 'Custom' };
        this.snackBar.open(`Action: ${labels[event.action.type] || event.action.type}`, 'OK', { duration: 2000 });

        switch (event.action.type) {
            case 'add':
                this.addNewOrder();
                break;
            case 'refresh':
                this.loadData();
                break;
            case 'delete':
                this.snackBar.open(`Delete ${this.selectedCount} orders (demo)`, 'OK', { duration: 2000 });
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
            'Mechanical Keyboard', 'Wireless Mouse', '4K Monitor', 'USB-C Hub', 'External Drive'];
        const categories = ['Electronics', 'Office Supplies', 'Furniture', 'Clothing', 'Food'];
        const statuses = ['Pending Payment', 'Pending Shipment'];
        const payments = ['Alipay', 'WeChat Pay', 'Bank Card', 'Credit Card'];
        const regions = ['East', 'South', 'North', 'Central', 'Southwest', 'Northwest', 'Northeast'];

        const quantity = Math.floor(Math.random() * 10 + 1);
        const unitPrice = Math.floor(Math.random() * 20000 + 100);
        const totalPrice = quantity * unitPrice;

        const newOrder = {
            orderId: newId as RawValue,
            customerName: `Customer ${Math.floor(Math.random() * 1000 + 1)}` as RawValue,
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
        this.snackBar.open('New order created', 'OK', { duration: 2000 });
    }

    private calculateStats() {
        this.totalOrders = this.data.length;
        this.pendingOrders = this.data.filter(d => ['Pending Payment', 'Pending Shipment'].includes(d['status'] as string)).length;
        this.totalAmount = this.data.reduce((sum, d) => sum + Number(d['totalPrice']), 0);
        this.avgAmount = this.totalOrders > 0 ? this.totalAmount / this.totalOrders : 0;
    }

    private generateOrders(count: number): Record<string, RawValue>[] {
        const products = ['MacBook Pro', 'Dell XPS', 'iPhone 15', 'iPad Pro', 'Surface Laptop',
            'ThinkPad X1', 'Huawei MateBook', 'Xiaomi Notebook', 'ASUS ZenBook', 'Lenovo Yoga',
            'Mechanical Keyboard', 'Wireless Mouse', '4K Monitor', 'USB-C Hub', 'External Drive',
            'Ergonomic Chair', 'Standing Desk', 'File Cabinet', 'Office Sofa', 'Projector'];
        const categories = ['Electronics', 'Office Supplies', 'Furniture', 'Clothing', 'Food'];
        const statuses = ['Pending Payment', 'Pending Shipment', 'In Transit', 'Delivered', 'Cancelled', 'Refunding'];
        const payments = ['Alipay', 'WeChat Pay', 'Bank Card', 'Credit Card'];
        const regions = ['East', 'South', 'North', 'Central', 'Southwest', 'Northwest', 'Northeast'];
        const firstNames = ['John', 'Jane', 'Mike', 'Emily', 'David', 'Sarah', 'Tom', 'Lisa', 'Chris', 'Amy'];
        const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson', 'Moore', 'Taylor'];

        return Array.from({ length: count }, (_, i) => {
            const quantity = Math.floor(Math.random() * 10 + 1);
            const unitPrice = Math.floor(Math.random() * 20000 + 100);
            const totalPrice = quantity * unitPrice;

            return {
                orderId: `ORD${String(20240001 + i)}` as RawValue,
                customerName: `${firstNames[i % firstNames.length]} ${lastNames[(i + 3) % lastNames.length]}` as RawValue,
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
