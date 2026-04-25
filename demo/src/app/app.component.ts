import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-root',
    imports: [
        RouterOutlet, RouterLink, RouterLinkActive,
        MatToolbarModule, MatSidenavModule, MatListModule,
        MatIconModule, MatButtonModule,
    ],
    template: `
    <mat-sidenav-container class="app-container">
      <!-- 侧边导航 -->
      <mat-sidenav mode="side" opened class="app-sidenav">
        <div class="sidenav-header">
          <div class="logo">
            <span class="logo-icon">📊</span>
            <span class="logo-text">ngx-datatable</span>
          </div>
        </div>

        <mat-nav-list>
          <a mat-list-item routerLink="/demo" routerLinkActive="active">
            <mat-icon matListItemIcon>table_chart</mat-icon>
            <span matListItemTitle>完整演示</span>
          </a>
        </mat-nav-list>

        <div class="sidenav-footer">
          <span class="version">v1.0.0</span>
        </div>
      </mat-sidenav>

      <!-- 主内容 -->
      <mat-sidenav-content class="app-content">
        <mat-toolbar color="primary" class="app-toolbar">
          <span class="toolbar-title">ngx-datatable 完整演示</span>
        </mat-toolbar>

        <div class="content-area">
          <router-outlet />
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
    styles: [`
    .app-container {
      height: 100vh;
    }

    .app-sidenav {
      width: 240px;
      background: #fff;
      border-right: 1px solid #e0e0e0;
      display: flex;
      flex-direction: column;
    }

    .sidenav-header {
      padding: 20px 16px;
      border-bottom: 1px solid #e0e0e0;
      background: linear-gradient(135deg, #1976d2, #2196f3);
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #fff;
    }

    .logo-icon {
      font-size: 28px;
    }

    .logo-text {
      font-size: 16px;
      font-weight: 600;
      letter-spacing: -0.3px;
    }

    mat-nav-list {
      flex: 1;
      padding-top: 8px;
    }

    mat-nav-list a.active {
      background: rgba(25, 118, 210, 0.08);
      color: #1976d2;
      border-right: 3px solid #1976d2;
    }

    mat-nav-list a.active mat-icon {
      color: #1976d2;
    }

    .sidenav-footer {
      padding: 12px 16px;
      border-top: 1px solid #e0e0e0;
    }

    .version {
      font-size: 12px;
      color: #999;
    }

    .app-content {
      display: flex;
      flex-direction: column;
      background: #f5f5f5;
    }

    .app-toolbar {
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .toolbar-title {
      font-size: 16px;
    }

    .content-area {
      flex: 1;
      padding: 24px;
      overflow: auto;
    }
  `]
})
export class AppComponent {}
