import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReportItemType } from '../report-template.model';

interface ToolboxItem {
  type: ReportItemType;
  label: string;
  icon: string;
  category: 'basic' | 'data';
}

@Component({
  selector: 'report-designer-toolbox',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatTooltipModule
  ],
  template: `
    <div class="toolbox-container">
      <h3 class="toolbox-title">工具箱</h3>

      <div class="toolbox-section">
        <div class="section-title">基础组件</div>

        @for (item of basicItems; track item.type) {
          <div class="toolbox-item" draggable="true"
               (dragstart)="onDragStart($event, item.type)"
               matTooltip="{{ item.label }}" matTooltipPosition="right">
            <mat-icon>{{ item.icon }}</mat-icon>
            <span>{{ item.label }}</span>
          </div>
        }
      </div>

      <div class="toolbox-section">
        <div class="section-title">数据组件</div>

        @for (item of dataItems; track item.type) {
          <div class="toolbox-item" draggable="true"
               (dragstart)="onDragStart($event, item.type)"
               matTooltip="{{ item.label }}" matTooltipPosition="right">
            <mat-icon>{{ item.icon }}</mat-icon>
            <span>{{ item.label }}</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .toolbox-container {
      width: 200px;
      height: 100%;
      background: #fafafa;
      border-right: 1px solid #e0e0e0;
      overflow-y: auto;
      padding: 8px;
    }
    .toolbox-title {
      font-size: 14px;
      font-weight: 500;
      color: #333;
      margin: 0 0 12px 0;
      padding-bottom: 8px;
      border-bottom: 1px solid #e0e0e0;
    }
    .toolbox-section { margin-bottom: 16px; }
    .section-title {
      font-size: 12px;
      color: #666;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .toolbox-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      margin-bottom: 4px;
      border-radius: 4px;
      cursor: grab;
      font-size: 13px;
      background: white;
      border: 1px solid #e0e0e0;
      transition: all 0.15s ease;
    }
    .toolbox-item:hover {
      box-shadow: 0 2px 6px rgba(0,0,0,0.12);
      border-color: #3f51b5;
      color: #3f51b5;
      transform: translateY(-1px);
    }
    .toolbox-item:active { cursor: grabbing; }
    .toolbox-item mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
  `]
})
export class ReportDesignerToolboxComponent {
  basicItems: ToolboxItem[] = [
    { type: 'text',      label: '文本框', icon: 'text_fields',     category: 'basic' },
    { type: 'field',     label: '数据字段', icon: 'data_object', category: 'basic' },
    { type: 'image',     label: '图片',   icon: 'image',          category: 'basic' },
    { type: 'line',      label: '线条',   icon: 'remove',         category: 'basic' },
    { type: 'rectangle', label: '矩形',   icon: 'crop_square',    category: 'basic' },
  ];

  dataItems: ToolboxItem[] = [
    { type: 'table',   label: '表格',   icon: 'table_chart', category: 'data' },
    { type: 'chart',   label: '图表',   icon: 'bar_chart',   category: 'data' },
    { type: 'barcode', label: '条形码', icon: 'qr_code_2',   category: 'data' },
    { type: 'qrcode',  label: '二维码', icon: 'qr_code',     category: 'data' },
  ];

  onDragStart(event: DragEvent, type: ReportItemType): void {
    event.dataTransfer?.setData('text/plain', type);
    event.dataTransfer!.effectAllowed = 'copy';
  }
}
