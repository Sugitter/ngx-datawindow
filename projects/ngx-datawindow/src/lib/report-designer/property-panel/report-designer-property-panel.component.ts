import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  ReportItem,
  TextItemConfig, TableItemConfig, ChartItemConfig,
  BarcodeItemConfig, FieldItemConfig,
  ImageItemConfig, LineItemConfig, RectangleItemConfig, QrCodeItemConfig,
  ReportItemConfig
} from '../report-template.model';

@Component({
  selector: 'report-designer-property-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="property-panel-container">
      <h3 class="panel-title">属性面板</h3>

      @if (selectedItem(); as item) {
        <!-- 通用属性 -->
        <mat-expansion-panel expanded>
          <mat-expansion-panel-header>
            <mat-panel-title>通用属性</mat-panel-title>
          </mat-expansion-panel-header>

          <div class="property-group">
            <mat-form-field appearance="fill" class="full-width">
              <mat-label>X 位置</mat-label>
              <input matInput type="number" [ngModel]="item.x" (ngModelChange)="updatePosition($event, 'x')">
            </mat-form-field>

            <mat-form-field appearance="fill" class="full-width">
              <mat-label>Y 位置</mat-label>
              <input matInput type="number" [ngModel]="item.y" (ngModelChange)="updatePosition($event, 'y')">
            </mat-form-field>

            <mat-form-field appearance="fill" class="half-width">
              <mat-label>宽度</mat-label>
              <input matInput type="number" [ngModel]="item.width" (ngModelChange)="updatePosition($event, 'width')">
            </mat-form-field>

            <mat-form-field appearance="fill" class="half-width">
              <mat-label>高度</mat-label>
              <input matInput type="number" [ngModel]="item.height" (ngModelChange)="updatePosition($event, 'height')">
            </mat-form-field>

            <mat-slide-toggle [ngModel]="item.visible" (ngModelChange)="toggleVisible($event)">
              可见
            </mat-slide-toggle>
          </div>
        </mat-expansion-panel>

        <!-- 文本属性 -->
        @if (item.type === 'text') {
          <mat-expansion-panel>
            <mat-expansion-panel-header>
              <mat-panel-title>文本属性</mat-panel-title>
            </mat-expansion-panel-header>

            <div class="property-group">
              <mat-form-field appearance="fill" class="full-width">
                <mat-label>内容</mat-label>
                <textarea matInput [ngModel]="textCfg().text" (ngModelChange)="updateConfig('text', $event)"></textarea>
              </mat-form-field>

              <mat-form-field appearance="fill" class="half-width">
                <mat-label>字体大小</mat-label>
                <input matInput type="number" [ngModel]="textCfg().fontSize" (ngModelChange)="updateConfig('fontSize', $event)">
              </mat-form-field>

              <mat-form-field appearance="fill" class="half-width">
                <mat-label>字体颜色</mat-label>
                <input matInput type="color" [ngModel]="textCfg().color" (ngModelChange)="updateConfig('color', $event)">
              </mat-form-field>

              <mat-form-field appearance="fill" class="half-width">
                <mat-label>字体粗细</mat-label>
                <mat-select [ngModel]="textCfg().fontWeight" (ngModelChange)="updateConfig('fontWeight', $event)">
                  <mat-option value="normal">正常</mat-option>
                  <mat-option value="bold">粗体</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="fill" class="half-width">
                <mat-label>对齐方式</mat-label>
                <mat-select [ngModel]="textCfg().align" (ngModelChange)="updateConfig('align', $event)">
                  <mat-option value="left">左对齐</mat-option>
                  <mat-option value="center">居中</mat-option>
                  <mat-option value="right">右对齐</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
          </mat-expansion-panel>
        }

        <!-- 字段属性 -->
        @if (item.type === 'field') {
          <mat-expansion-panel>
            <mat-expansion-panel-header>
              <mat-panel-title>字段属性</mat-panel-title>
            </mat-expansion-panel-header>

            <div class="property-group">
              <mat-form-field appearance="fill" class="full-width">
                <mat-label>绑定字段</mat-label>
                <input matInput [ngModel]="fieldCfg().field" (ngModelChange)="updateConfig('field', $event)">
              </mat-form-field>

              <mat-form-field appearance="fill" class="half-width">
                <mat-label>格式化</mat-label>
                <input matInput [ngModel]="fieldCfg().format" (ngModelChange)="updateConfig('format', $event)">
              </mat-form-field>

              <mat-form-field appearance="fill" class="half-width">
                <mat-label>空值文本</mat-label>
                <input matInput [ngModel]="fieldCfg().nullText" (ngModelChange)="updateConfig('nullText', $event)">
              </mat-form-field>

              <mat-form-field appearance="fill" class="half-width">
                <mat-label>字体大小</mat-label>
                <input matInput type="number" [ngModel]="fieldCfg().fontSize" (ngModelChange)="updateConfig('fontSize', $event)">
              </mat-form-field>

              <mat-form-field appearance="fill" class="half-width">
                <mat-label>颜色</mat-label>
                <input matInput type="color" [ngModel]="fieldCfg().color" (ngModelChange)="updateConfig('color', $event)">
              </mat-form-field>
            </div>
          </mat-expansion-panel>
        }

        <!-- 图表属性 -->
        @if (item.type === 'chart') {
          <mat-expansion-panel>
            <mat-expansion-panel-header>
              <mat-panel-title>图表属性</mat-panel-title>
            </mat-expansion-panel-header>

            <div class="property-group">
              <mat-form-field appearance="fill" class="full-width">
                <mat-label>图表类型</mat-label>
                <mat-select [ngModel]="chartCfg().chartType" (ngModelChange)="updateConfig('chartType', $event)">
                  <mat-option value="bar">柱状图</mat-option>
                  <mat-option value="line">折线图</mat-option>
                  <mat-option value="pie">饼图</mat-option>
                  <mat-option value="doughnut">环形图</mat-option>
                  <mat-option value="radar">雷达图</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="fill" class="full-width">
                <mat-label>X 轴字段</mat-label>
                <input matInput [ngModel]="chartCfg().xField" (ngModelChange)="updateConfig('xField', $event)">
              </mat-form-field>

              <mat-form-field appearance="fill" class="full-width">
                <mat-label>Y 轴字段（逗号分隔）</mat-label>
                <input matInput [ngModel]="chartCfg().yFields?.join(', ')" (ngModelChange)="parseYFields($event)">
              </mat-form-field>

              <mat-slide-toggle [ngModel]="chartCfg().showLegend" (ngModelChange)="updateConfig('showLegend', $event)">
                显示图例
              </mat-slide-toggle>

              <mat-slide-toggle [ngModel]="chartCfg().showDataLabels" (ngModelChange)="updateConfig('showDataLabels', $event)">
                显示数据标签
              </mat-slide-toggle>
            </div>
          </mat-expansion-panel>
        }

        <!-- 表格属性 -->
        @if (item.type === 'table') {
          <mat-expansion-panel>
            <mat-expansion-panel-header>
              <mat-panel-title>表格属性</mat-panel-title>
            </mat-expansion-panel-header>

            <div class="property-group">
              <p class="info-text">列数: {{ tableCfg().columns?.length || 0 }}</p>

              <mat-slide-toggle [ngModel]="tableCfg().headerRow?.visible !== false" (ngModelChange)="updateTableHeader($event)">
                显示表头
              </mat-slide-toggle>

              <mat-slide-toggle [ngModel]="tableCfg().dataRow?.alternatingColors" (ngModelChange)="updateTableZebra($event)">
                斑马纹
              </mat-slide-toggle>

              <button mat-button color="primary" (click)="configureColumns.emit(item)">
                <mat-icon>settings</mat-icon> 配置列
              </button>
            </div>
          </mat-expansion-panel>
        }

        <!-- 条形码属性 -->
        @if (item.type === 'barcode') {
          <mat-expansion-panel>
            <mat-expansion-panel-header>
              <mat-panel-title>条形码属性</mat-panel-title>
            </mat-expansion-panel-header>

            <div class="property-group">
              <mat-form-field appearance="fill" class="full-width">
                <mat-label>条形码格式</mat-label>
                <mat-select [ngModel]="barcodeCfg().format" (ngModelChange)="updateConfig('format', $event)">
                  <mat-option value="CODE128">CODE128</mat-option>
                  <mat-option value="CODE39">CODE39</mat-option>
                  <mat-option value="EAN13">EAN-13</mat-option>
                  <mat-option value="EAN8">EAN-8</mat-option>
                  <mat-option value="UPC">UPC</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-slide-toggle [ngModel]="barcodeCfg().showText" (ngModelChange)="updateConfig('showText', $event)">
                显示文字
              </mat-slide-toggle>
            </div>
          </mat-expansion-panel>
        }

        <!-- 删除按钮 -->
        <div class="property-actions">
          <button mat-button color="warn" (click)="deleteItem.emit(item.id)">
            <mat-icon>delete</mat-icon> 删除元素
          </button>
        </div>
      } @else {
        <div class="no-selection">
          <mat-icon>info</mat-icon>
          <p>请选择一个元素以编辑其属性</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .property-panel-container {
      width: 280px;
      height: 100%;
      background: #fafafa;
      border-left: 1px solid #e0e0e0;
      overflow-y: auto;
      padding: 8px;
    }
    .panel-title {
      font-size: 14px; font-weight: 500; color: #333;
      margin: 0 0 12px 0; padding-bottom: 8px;
      border-bottom: 1px solid #e0e0e0;
    }
    .property-group {
      display: flex; flex-wrap: wrap; gap: 8px; padding: 8px 0;
    }
    .full-width { width: 100%; }
    .half-width { width: calc(50% - 4px); }
    mat-expansion-panel { margin-bottom: 8px; border-radius: 4px; }
    .property-actions {
      margin-top: 16px; padding-top: 16px;
      border-top: 1px solid #e0e0e0;
    }
    .info-text {
      width: 100%; font-size: 13px; color: #666; margin: 4px 0;
    }
    .no-selection {
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      height: 200px; color: #999; font-size: 13px; text-align: center;
    }
    .no-selection mat-icon {
      font-size: 48px; width: 48px; height: 48px;
      margin-bottom: 16px; color: #ccc;
    }
  `]
})
export class ReportDesignerPropertyPanelComponent {
  selectedItem = input<ReportItem | null>(null);
  dataSets = input<string[]>([]);

  propertyChanged = output<ReportItem>();
  deleteItem = output<string>();
  configureColumns = output<ReportItem>();

  // 类型安全的 config 访问器
  textCfg = computed(() => this.selectedItem()?.config as TextItemConfig);
  fieldCfg = computed(() => this.selectedItem()?.config as FieldItemConfig);
  chartCfg = computed(() => this.selectedItem()?.config as ChartItemConfig);
  tableCfg = computed(() => this.selectedItem()?.config as TableItemConfig);
  barcodeCfg = computed(() => this.selectedItem()?.config as BarcodeItemConfig);
  imageCfg = computed(() => this.selectedItem()?.config as ImageItemConfig);
  lineCfg = computed(() => this.selectedItem()?.config as LineItemConfig);
  rectangleCfg = computed(() => this.selectedItem()?.config as RectangleItemConfig);
  qrCodeCfg = computed(() => this.selectedItem()?.config as QrCodeItemConfig);

  updatePosition(value: number, prop: 'x' | 'y' | 'width' | 'height'): void {
    const item = this.selectedItem();
    if (item) {
      this.propertyChanged.emit({ ...item, [prop]: value });
    }
  }

  toggleVisible(value: boolean): void {
    const item = this.selectedItem();
    if (item) {
      this.propertyChanged.emit({ ...item, visible: value });
    }
  }

  parseYFields(value: string): void {
    this.updateConfig('yFields', value.split(',').map(s => s.trim()).filter(s => s.length > 0));
  }

  updateConfig(key: string, value: any): void {
    const item = this.selectedItem();
    if (item) {
      this.propertyChanged.emit({
        ...item,
        config: { ...item.config, [key]: value } as ReportItemConfig
      });
    }
  }

  updateTableHeader(visible: boolean): void {
    const item = this.selectedItem();
    if (item && item.type === 'table') {
      const cfg = item.config as TableItemConfig;
      this.propertyChanged.emit({
        ...item,
        config: {
          ...cfg,
          headerRow: { ...(cfg.headerRow || {}), visible }
        } as ReportItemConfig
      });
    }
  }

  updateTableZebra(alternating: boolean): void {
    const item = this.selectedItem();
    if (item && item.type === 'table') {
      const cfg = item.config as TableItemConfig;
      this.propertyChanged.emit({
        ...item,
        config: {
          ...cfg,
          dataRow: { ...(cfg.dataRow || {}), alternatingColors: alternating }
        } as ReportItemConfig
      });
    }
  }
}
