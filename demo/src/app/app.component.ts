import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule, MatIcon } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-root',
    imports: [
        RouterOutlet, RouterLink, RouterLinkActive,
        MatToolbarModule, MatSidenavModule, MatListModule,
        MatIconModule, MatIcon, MatButtonModule,
    ],
    template: `
        <mat-sidenav-container class="app-container">
            <!-- 侧边导航 -->
            <mat-sidenav mode="side" opened class="app-sidenav" [fixedInViewport]="true" fixedTopGap="0" fixedBottomGap="0">
                <div class="sidenav-header">
                    <div class="logo">
                        <span class="logo-icon">📊</span>
                        <div class="logo-info">
                            <span class="logo-text">ngx-datawindow</span>
                            <span class="logo-version">v1.0.0</span>
                        </div>
                    </div>
                    <p class="logo-desc">PowerBuilder DataWindow for Angular</p>
                </div>

                <div class="sidenav-section-label">演示</div>
                <mat-nav-list>
                    <a mat-list-item routerLink="/demo" routerLinkActive="active">
                        <mat-icon matListItemIcon>table_chart</mat-icon>
                        <span matListItemTitle>完整功能演示</span>
                    </a>
                </mat-nav-list>

                <div class="sidenav-section-label">链接</div>
                <mat-nav-list>
                    <a mat-list-item href="https://github.com/ailex2016/ngx-datawindow" target="_blank">
                        <mat-icon matListItemIcon>code</mat-icon>
                        <span matListItemTitle>GitHub</span>
                    </a>
                    <a mat-list-item href="https://github.com/ailex2016/ngx-datawindow/blob/main/README.md" target="_blank">
                        <mat-icon matListItemIcon>menu_book</mat-icon>
                        <span matListItemTitle>文档</span>
                    </a>
                </mat-nav-list>

                <div class="sidenav-footer">
                    <span>MIT License</span>
                </div>
            </mat-sidenav>

            <!-- 主内容 -->
            <mat-sidenav-content class="app-content">
                <mat-toolbar color="primary" class="app-toolbar">
                    <span class="toolbar-title">ngx-datawindow 完整演示</span>
                    <span class="toolbar-spacer"></span>
                    <a mat-icon-button href="https://github.com/ailex2016/ngx-datawindow" target="_blank" matTooltip="GitHub">
                        <mat-icon>code</mat-icon>
                    </a>
                </mat-toolbar>

                <div class="content-area">
                    <router-outlet/>
                </div>
            </mat-sidenav-content>
        </mat-sidenav-container>
    `,
    standalone: true,
    styles: [`
      .app-container {
        height: 100vh;
      }

      .app-sidenav {
        width: 256px;
        background: #fff;
        border-right: 1px solid #e8e8e8;
        display: flex;
        flex-direction: column;
      }

      .sidenav-header {
        padding: 20px 20px 16px;
        border-bottom: 1px solid #e8e8e8;
        background: linear-gradient(135deg, #1565c0, #1e88e5);
        color: #fff;
      }

      .logo {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .logo-icon {
        font-size: 32px;
      }

      .logo-info {
        display: flex;
        flex-direction: column;
      }

      .logo-text {
        font-size: 17px;
        font-weight: 700;
        letter-spacing: -0.5px;
      }

      .logo-version {
        font-size: 11px;
        opacity: 0.75;
        margin-top: 2px;
      }

      .logo-desc {
        font-size: 12px;
        opacity: 0.8;
        margin-top: 8px;
        line-height: 1.4;
      }

      .sidenav-section-label {
        padding: 16px 20px 6px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #999;
      }

      mat-nav-list {
        padding-top: 4px;
      }

      mat-nav-list a {
        border-radius: 8px;
        margin: 2px 8px;
      }

      mat-nav-list a.active {
        background: rgba(25, 118, 210, 0.08);
        color: #1976d2;
      }

      mat-nav-list a.active mat-icon {
        color: #1976d2;
      }

      .sidenav-footer {
        padding: 12px 20px;
        border-top: 1px solid #e8e8e8;
        margin-top: auto;
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
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }

      .toolbar-title {
        font-size: 15px;
        font-weight: 500;
      }

      .toolbar-spacer {
        flex: 1;
      }

      .content-area {
        flex: 1;
        padding: 24px;
        overflow: auto;
        max-height: calc(100vh - 64px);
      }
    `]
})
export class AppComponent {}
