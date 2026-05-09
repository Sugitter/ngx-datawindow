/**
 * Report Designer Demo Page
 *
 * Demonstrates the ngx-datawindow visual report designer:
 * - Drag-and-drop report item layout
 * - Property editing panel
 * - Template binding and preview
 */
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import {
    ReportDesignerComponent as DwReportDesignerComponent,
    ReportTemplate,
    createEmptyTemplate,
} from 'ngx-datawindow';

interface BandSummary {
    band: string;
    items: number;
}

@Component({
    selector: 'app-report-designer',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatButtonModule,
        MatIconModule,
        MatTabsModule,
        MatCardModule,
        MatDividerModule,
        MatTooltipModule,
        MatSnackBarModule,
        DwReportDesignerComponent,
    ],
    template: `
        <div class="page-container">
            <div class="page-header">
                <h3>
                    <mat-icon>design_services</mat-icon>
                    Report Designer Demo
                </h3>
                <p class="header-desc">
                    Visual drag-and-drop report designer for ngx-datawindow.
                    Design report layout, configure bands, and preview output.
                </p>
            </div>

            <!-- Designer Component -->
            <div class="designer-wrapper">
                <dw-report-designer
                    [template]="currentTemplate()"
                    (templateChange)="onTemplateChange($event)"
                    (previewChange)="onPreviewChange($event)"
                />
            </div>

            <!-- Info Tabs -->
            <mat-tab-group class="demo-info-tabs" animationDuration="200ms">
                <mat-tab label="Designer Inputs">
                    <div class="info-content">
                        <div class="info-block">
                            <h4>Component Inputs</h4>
                            <table class="info-table">
                                <thead>
                                    <tr><th>Input</th><th>Type</th><th>Description</th></tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td><code>template</code></td>
                                        <td><code>ReportTemplate</code></td>
                                        <td>Initial report template to display in the designer.</td>
                                    </tr>
                                    <tr>
                                        <td><code>templateChange</code></td>
                                        <td><code>output&lt;ReportTemplate&gt;</code></td>
                                        <td>Emitted whenever the report template changes.</td>
                                    </tr>
                                    <tr>
                                        <td><code>previewChange</code></td>
                                        <td><code>output&lt;unknown&gt;</code></td>
                                        <td>Emitted when preview mode renders pages.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div class="info-block">
                            <h4>Toolbox Items</h4>
                            <div class="toolbox-grid">
                                <div class="toolbox-item">
                                    <mat-icon>text_fields</mat-icon>
                                    <span>Text</span>
                                </div>
                                <div class="toolbox-item">
                                    <mat-icon>data_object</mat-icon>
                                    <span>Data Field</span>
                                </div>
                                <div class="toolbox-item">
                                    <mat-icon>calculate</mat-icon>
                                    <span>Computed</span>
                                </div>
                                <div class="toolbox-item">
                                    <mat-icon>horizontal_rule</mat-icon>
                                    <span>Line</span>
                                </div>
                                <div class="toolbox-item">
                                    <mat-icon>crop_square</mat-icon>
                                    <span>Rectangle</span>
                                </div>
                                <div class="toolbox-item">
                                    <mat-icon>bar_chart</mat-icon>
                                    <span>Chart</span>
                                </div>
                                <div class="toolbox-item">
                                    <mat-icon>qr_code</mat-icon>
                                    <span>Barcode</span>
                                </div>
                                <div class="toolbox-item">
                                    <mat-icon>table_chart</mat-icon>
                                    <span>Table</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </mat-tab>

                <mat-tab label="Report Bands">
                    <div class="info-content">
                        <div class="info-block">
                            <h4>Report Band Types</h4>
                            <table class="info-table">
                                <thead>
                                    <tr><th>Band</th><th>Description</th><th>Repeats</th></tr>
                                </thead>
                                <tbody>
                                    <tr><td><strong>Report Header</strong></td><td>Appears once at the beginning of the report</td><td>Once</td></tr>
                                    <tr><td><strong>Page Header</strong></td><td>Appears at the top of each page</td><td>Per page</td></tr>
                                    <tr><td><strong>Group Header</strong></td><td>Appears before each group of data</td><td>Per group</td></tr>
                                    <tr><td><strong>Detail</strong></td><td>Repeats for each data row</td><td>Per row</td></tr>
                                    <tr><td><strong>Group Footer</strong></td><td>Appears after each group</td><td>Per group</td></tr>
                                    <tr><td><strong>Page Footer</strong></td><td>Appears at the bottom of each page</td><td>Per page</td></tr>
                                    <tr><td><strong>Report Footer</strong></td><td>Appears once at the end of the report</td><td>Once</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </mat-tab>

                <mat-tab label="Last Template">
                    <div class="info-content">
                        @if (lastTemplate()) {
                            <div class="info-block">
                                <h4>Current Template: {{ lastTemplate()?.meta?.name ?? 'Untitled' }}</h4>
                                <div class="template-stats">
                                    <span class="stat">
                                        <mat-icon>layers</mat-icon>
                                        {{ lastTemplate()!.bands.length }} bands
                                    </span>
                                    <span class="stat">
                                        <mat-icon>widgets</mat-icon>
                                        {{ totalItems() }} items
                                    </span>
                                    <span class="stat">
                                        <mat-icon>crop_portrait</mat-icon>
                                        {{ lastTemplate()!.page.paperSize }}
                                        {{ lastTemplate()!.page.orientation }}
                                    </span>
                                </div>
                                @if (bandSummary().length > 0) {
                                    <table class="info-table" style="margin-top:8px;">
                                        <thead><tr><th>Band</th><th>Items</th></tr></thead>
                                        <tbody>
                                            @for (row of bandSummary(); track row.band) {
                                                <tr><td>{{ row.band }}</td><td>{{ row.items }}</td></tr>
                                            }
                                        </tbody>
                                    </table>
                                }
                            </div>
                        } @else {
                            <p class="empty-hint">No template loaded yet. Use the designer to create one.</p>
                        }
                    </div>
                </mat-tab>
            </mat-tab-group>
        </div>
    `,
    styles: [`
        .page-container { padding: 24px; height: 100%; display: flex; flex-direction: column; gap: 16px; overflow: hidden; }
        .page-header { display: flex; flex-direction: column; gap: 4px; }
        .page-header h3 { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 20px; }
        .page-header .header-desc { margin: 0; color: #666; font-size: 14px; }

        .designer-wrapper { flex: 1; min-height: 500px; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; background: #f5f5f5; }

        .demo-info-tabs { flex-shrink: 0; max-height: 240px; }
        .info-content { padding: 16px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; max-height: 200px; }
        .info-block h4 { margin: 0 0 8px; font-size: 14px; color: #333; }
        .info-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .info-table th, .info-table td { border: 1px solid #e0e0e0; padding: 6px 10px; text-align: left; }
        .info-table th { background: #f0f4ff; font-weight: 500; }
        .info-table code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-size: 12px; }

        .toolbox-grid { display: grid; grid-template-columns: repeat(auto-fill, 100px); gap: 8px; }
        .toolbox-item { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 8px; background: white; border: 1px solid #e0e0e0; border-radius: 6px; font-size: 11px; color: #666; }
        .toolbox-item mat-icon { font-size: 20px; width: 20px; height: 20px; color: #3f51b5; }

        .template-stats { display: flex; gap: 16px; flex-wrap: wrap; }
        .stat { display: flex; align-items: center; gap: 4px; font-size: 13px; color: #555; }
        .stat mat-icon { font-size: 16px; width: 16px; height: 16px; }
        .empty-hint { color: #999; font-size: 13px; margin: 0; }
    `]
})
export class ReportDesignerPageComponent implements OnInit {

    currentTemplate = signal<ReportTemplate>(createEmptyTemplate('Trade Report'));
    lastTemplate = signal<ReportTemplate | null>(null);
    totalItems = signal(0);
    bandSummary = signal<BandSummary[]>([]);

    constructor(private snackBar: MatSnackBar) {}

    ngOnInit() {
        // Initialize with an empty report template
        this.currentTemplate.set(createEmptyTemplate('Trade Report'));
    }

    onTemplateChange(template: ReportTemplate) {
        this.lastTemplate.set(template);
        const total = template.bands.reduce((sum: number, band) => sum + (band.items?.length ?? 0), 0);
        this.totalItems.set(total);
        this.bandSummary.set(
            template.bands.map(band => ({
                band: band.label ?? band.type,
                items: band.items?.length ?? 0,
            }))
        );
        this.snackBar.open(`Template updated: ${template.meta?.name ?? 'Untitled'}`, 'OK', { duration: 2000 });
    }

    onPreviewChange(pages: unknown) {
        if (pages) {
            this.snackBar.open(`Preview rendered`, 'OK', { duration: 2000 });
        }
    }
}
