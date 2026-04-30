import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { RouterModule, RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-demo',
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatListModule,
        MatCardModule,
        MatDividerModule,
        RouterModule,
        RouterOutlet,
    ],
    template: `
        <div class="demo-layout">
            <!-- Sidebar Navigation -->
            <nav class="sidebar">
                <div class="sidebar-header">
                    <h2>ngx-datawindow</h2>
                    <p>Demo</p>
                </div>
                <mat-divider></mat-divider>
                <mat-nav-list>
                    <a mat-list-item routerLink="/demo/basic" routerLinkActive="active">
                        <mat-icon matListItemIcon>table_chart</mat-icon>
                        <span matListItemTitle>Basic CRUD</span>
                    </a>
                    <a mat-list-item routerLink="/demo/columns" routerLinkActive="active">
                        <mat-icon matListItemIcon>view_column</mat-icon>
                        <span matListItemTitle>Column Features</span>
                    </a>
                    <a mat-list-item routerLink="/demo/filter" routerLinkActive="active">
                        <mat-icon matListItemIcon>filter_list</mat-icon>
                        <span matListItemTitle>Filter & Sort</span>
                    </a>
                    <a mat-list-item routerLink="/demo/editing" routerLinkActive="active">
                        <mat-icon matListItemIcon>edit</mat-icon>
                        <span matListItemTitle>Inline Editing</span>
                    </a>
                    <a mat-list-item routerLink="/demo/aggregation" routerLinkActive="active">
                        <mat-icon matListItemIcon>calculate</mat-icon>
                        <span matListItemTitle>Aggregation</span>
                    </a>
                    <a mat-list-item routerLink="/demo/selection" routerLinkActive="active">
                        <mat-icon matListItemIcon>check_box</mat-icon>
                        <span matListItemTitle>Row Selection</span>
                    </a>
                    <a mat-list-item routerLink="/demo/virtual" routerLinkActive="active">
                        <mat-icon matListItemIcon>speed</mat-icon>
                        <span matListItemTitle>Virtual Scroll</span>
                    </a>
                    <a mat-list-item routerLink="/demo/realtime" routerLinkActive="active">
                        <mat-icon matListItemIcon>sync</mat-icon>
                        <span matListItemTitle>Realtime Data</span>
                    </a>
                    <a mat-list-item routerLink="/demo/toolbar" routerLinkActive="active">
                        <mat-icon matListItemIcon>build</mat-icon>
                        <span matListItemTitle>Toolbar</span>
                    </a>
                    <mat-divider></mat-divider>
                    <a mat-list-item routerLink="/demo/business" routerLinkActive="active" class="business-link">
                        <mat-icon matListItemIcon>business_center</mat-icon>
                        <span matListItemTitle>🎯 Business Demo</span>
                    </a>
                </mat-nav-list>
            </nav>

            <!-- Content Area -->
            <main class="content-area">
                <router-outlet></router-outlet>
            </main>
        </div>
    `,
    styles: [`
        .demo-layout {
            display: flex;
            height: 100vh;
            width: 100vw;
            overflow: hidden;
            background: #f5f7fa;
        }

        /* Sidebar Navigation */
        .sidebar {
            width: 260px;
            min-width: 260px;
            background: #ffffff;
            border-right: 1px solid #e0e0e0;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            flex-shrink: 0;
        }

        .sidebar-header {
            padding: 18px 16px;
            background: #f8f9fa;
            border-bottom: 1px solid #e0e0e0;
        }

        .sidebar-header h2 {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            color: #333;
        }

        .sidebar-header p {
            margin: 4px 0 0 0;
            font-size: 13px;
            color: #666;
        }

        mat-nav-list {
            padding: 8px 12px;
        }

        a[mat-list-item] {
            color: #333 !important;
            border-radius: 6px !important;
            margin: 4px 0;
            height: 40px !important;
            transition: all 0.2s ease;
            font-size: 14px;
        }

        a[mat-list-item]:hover {
            background: #f0f0f0 !important;
        }

        a[mat-list-item].active {
            background: #e3f2fd !important;
            color: #1976d2 !important;
            font-weight: 500;
        }

        a[mat-list-item] mat-icon {
            color: #666 !important;
            margin-right: 10px;
            font-size: 20px !important;
            width: 20px !important;
            height: 20px !important;
        }

        a[mat-list-item].active mat-icon {
            color: #1976d2 !important;
        }

        .business-link {
            background: #fff3e0 !important;
            margin-top: 4px !important;
            font-weight: 500 !important;
        }

        .business-link mat-icon {
            color: #f57c00 !important;
        }

        mat-divider {
            border-color: #e0e0e0 !important;
            margin: 4px 0;
        }

        /* Content Area */
        .content-area {
            flex: 1;
            min-width: 0;
            padding: 16px;
            overflow: hidden;
            background: #f5f7fa;
            display: flex;
            flex-direction: column;
        }
    `],
    standalone: true,
})
export class DemoComponent implements OnInit {
    ngOnInit() {
        console.log('Demo layout initialized');
    }
}
