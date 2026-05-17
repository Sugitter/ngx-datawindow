import { Component, input, output, computed, signal, ElementRef, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  ReportTemplate, ReportBand, ReportItem, ReportItemType,
  TextItemConfig, ChartItemConfig, TableItemConfig
} from '../report-template.model';

@Component({
  selector: 'report-designer-canvas',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="canvas-wrapper">
      @if (showRuler()) {
        <div class="ruler ruler-top">
          @for (mark of rulerMarks(); track mark) {
            <span class="ruler-mark" [style.left.px]="mark">{{ mark }}</span>
          }
        </div>
      }

      <div class="canvas-scroll" #canvasScroll
           (dragover)="onCanvasDragOver($event)"
           (drop)="onCanvasDrop($event)">
        <div class="canvas" #canvas
             [style.width.px]="pageWidth()"
             [style.transform]="'scale(' + zoom() / 100 + ')'"
             (mousedown)="onCanvasMouseDown($event)">

          @if (showGrid()) {
            <div class="grid-background"></div>
          }

          @for (band of template().bands; track band.id) {
            <div class="canvas-band"
                 [style.height.px]="band.height"
                 [class.active]="band.id === activeBandId()"
                 (click)="onBandClick($event, band.id)"
                 [attr.data-band-id]="band.id">

              <div class="band-header">
                <span class="band-type">{{ getBandLabel(band.type) }}</span>
                <span class="band-height">{{ band.height }}px</span>
              </div>

              <div class="band-content">
                @for (item of band.items; track item.id) {
                  <div class="report-item"
                       [class.selected]="item.id === selectedItemId()"
                       [style.left.px]="item.x"
                       [style.top.px]="item.y"
                       [style.width.px]="item.width"
                       [style.height.px]="item.height"
                       [attr.data-item-id]="item.id"
                       (mousedown)="onItemMouseDown($event, item.id, item)">

                    @switch (item.type) {
                      @case ('text') {
                        <div class="item-text"
                             [style.font-size.px]="getTextConfig(item).fontSize || 14"
                             [style.font-weight]="getTextConfig(item).fontWeight"
                             [style.color]="getTextConfig(item).color">
                          {{ getTextConfig(item).text || '文本框' }}
                        </div>
                      }
                      @case ('field') {
                        <div class="item-field">
                          <mat-icon>data_object</mat-icon>
                          <span>{{ getFieldConfig(item).field || '字段' }}</span>
                        </div>
                      }
                      @case ('image') {
                        <div class="item-image">
                          <mat-icon>image</mat-icon>
                          <span>图片</span>
                        </div>
                      }
                      @case ('table') {
                        <div class="item-table">
                          <mat-icon>table_chart</mat-icon>
                          <span>表格</span>
                        </div>
                      }
                      @case ('chart') {
                        <div class="item-chart">
                          <mat-icon>bar_chart</mat-icon>
                          <span>{{ getChartConfig(item).chartType || '图表' }}</span>
                        </div>
                      }
                      @case ('line') {
                        <div class="item-line"></div>
                      }
                      @case ('rectangle') {
                        <div class="item-rect"></div>
                      }
                      @case ('barcode') {
                        <div class="item-barcode">
                          <mat-icon>qr_code_2</mat-icon>
                          <span>条形码</span>
                        </div>
                      }
                      @case ('qrcode') {
                        <div class="item-qrcode">
                          <mat-icon>qr_code</mat-icon>
                          <span>二维码</span>
                        </div>
                      }
                      @default {
                        <div class="item-unknown">
                          <mat-icon>widgets</mat-icon>
                          <span>{{ item.type }}</span>
                        </div>
                      }
                    }

                    @if (item.id === selectedItemId()) {
                      <div class="selection-border">
                        <div class="resize-handle nw" (mousedown)="onResizeStart($event, item.id, 'nw')"></div>
                        <div class="resize-handle ne" (mousedown)="onResizeStart($event, item.id, 'ne')"></div>
                        <div class="resize-handle sw" (mousedown)="onResizeStart($event, item.id, 'sw')"></div>
                        <div class="resize-handle se" (mousedown)="onResizeStart($event, item.id, 'se')"></div>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .canvas-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: relative;
    }

    .ruler {
      background: #f5f5f5;
      border-bottom: 1px solid #e0e0e0;
      overflow: hidden;
      position: relative;
    }
    .ruler-top {
      height: 20px;
      margin-left: 20px;
    }
    .ruler-mark {
      position: absolute;
      font-size: 10px;
      color: #999;
    }

    .canvas-scroll {
      flex: 1;
      overflow: auto;
      background: #e8e8e8;
      padding: 24px;
    }

    .canvas {
      position: relative;
      margin: 0 auto;
      background: white;
      box-shadow: 0 1px 4px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08);
      transform-origin: top center;
    }

    .grid-background {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background-image:
        linear-gradient(to right, #f0f0f0 1px, transparent 1px),
        linear-gradient(to bottom, #f0f0f0 1px, transparent 1px);
      background-size: 10px 10px;
      pointer-events: none;
      z-index: 0;
    }

    .canvas-band {
      position: relative;
      border-bottom: 1px dashed #ccc;
      min-height: 20px;
      z-index: 1;
    }
    .canvas-band.active {
      background-color: rgba(63, 81, 181, 0.04);
    }
    .canvas-band.active .band-header {
      background: #e8eaf6;
      border-bottom-color: #3f51b5;
    }

    .band-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 2px 8px;
      background: #f5f5f5;
      border-bottom: 1px solid #e0e0e0;
      font-size: 11px;
      color: #666;
      user-select: none;
    }
    .band-type { font-weight: 500; }
    .band-height { color: #999; font-size: 10px; }

    .band-content {
      position: relative;
      min-height: 20px;
    }

    .report-item {
      position: absolute;
      cursor: move;
      border: 1px solid transparent;
      padding: 2px;
      transition: border-color 0.15s;
      z-index: 2;
      user-select: none;
    }
    .report-item:hover {
      border-color: #3f51b5;
    }
    .report-item.selected {
      border-color: #3f51b5;
      box-shadow: 0 0 0 1px #3f51b5;
      z-index: 3;
    }

    .item-text {
      width: 100%; height: 100%;
      display: flex; align-items: center;
      overflow: hidden; white-space: nowrap;
      text-overflow: ellipsis;
    }
    .item-field, .item-image, .item-table, .item-chart, .item-barcode, .item-qrcode, .item-unknown {
      width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center;
      gap: 6px;
      background: #f9f9f9;
      border: 1px dashed #ccc;
      border-radius: 4px;
      color: #999;
      font-size: 11px;
    }
    .item-line {
      width: 100%; height: 2px;
      background: #333;
      margin-top: 50%;
    }
    .item-rect {
      width: 100%; height: 100%;
      border: 2px solid #333;
      border-radius: 2px;
    }

    .selection-border {
      position: absolute;
      top: -2px; left: -2px; right: -2px; bottom: -2px;
      border: 2px solid #3f51b5;
      pointer-events: none;
    }
    .resize-handle {
      position: absolute;
      width: 8px; height: 8px;
      background: white;
      border: 1px solid #3f51b5;
      pointer-events: auto;
    }
    .resize-handle.nw { top: -4px; left: -4px; cursor: nw-resize; }
    .resize-handle.ne { top: -4px; right: -4px; cursor: ne-resize; }
    .resize-handle.sw { bottom: -4px; left: -4px; cursor: sw-resize; }
    .resize-handle.se { bottom: -4px; right: -4px; cursor: se-resize; }
  `]
})
export class ReportDesignerCanvasComponent implements OnDestroy {
  private el = inject(ElementRef);

  template = input.required<ReportTemplate>();
  zoom = input<number>(100);
  showGrid = input<boolean>(true);
  showRuler = input<boolean>(false);
  activeBandId = input<string>('');
  selectedItemId = input<string>('');

  bandSelected = output<string>();
  itemSelected = output<string>();
  itemDropped = output<{ type: ReportItemType; x: number; y: number; bandId: string }>();
  itemMoved = output<{ itemId: string; x: number; y: number }>();
  itemResized = output<{ itemId: string; x: number; y: number; width: number; height: number }>();

  pageWidth = computed(() => {
    const page = this.template().page;
    if (!page) return 800;
    if (page.paperSize === 'Custom' && page.paperWidth) return page.paperWidth;
    const sizes: Record<string, number> = {
      A4: page.orientation === 'portrait' ? 794 : 1123,
      A3: page.orientation === 'portrait' ? 1123 : 1587,
      A5: page.orientation === 'portrait' ? 559 : 794,
      Letter: page.orientation === 'portrait' ? 816 : 1056,
      Legal: page.orientation === 'portrait' ? 816 : 1344,
    };
    return sizes[page.paperSize] || 800;
  });

  rulerMarks = computed(() => {
    const width = this.pageWidth();
    const marks: number[] = [];
    for (let i = 0; i <= width; i += 50) marks.push(i);
    return marks;
  });

  // 内部拖拽状态
  private dragState: {
    type: 'move' | 'resize';
    itemId: string;
    startX: number;
    startY: number;
    itemStartX: number;
    itemStartY: number;
    itemStartW: number;
    itemStartH: number;
    resizeDir: string;
  } | null = null;

  private globalMouseUpHandler = (e: MouseEvent) => this.onGlobalMouseUp(e);
  private globalMouseMoveHandler = (e: MouseEvent) => this.onGlobalMouseMove(e);

  constructor() {
    document.addEventListener('mousemove', this.globalMouseMoveHandler);
    document.addEventListener('mouseup', this.globalMouseUpHandler);
  }

  ngOnDestroy(): void {
    document.removeEventListener('mousemove', this.globalMouseMoveHandler);
    document.removeEventListener('mouseup', this.globalMouseUpHandler);
  }

  // ===== 工具箱拖入画布 (HTML5 drag-drop) =====

  onCanvasDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
  }

  onCanvasDrop(event: DragEvent): void {
    event.preventDefault();
    const itemType = event.dataTransfer?.getData('text/plain') as ReportItemType;
    if (!itemType) return;

    const canvasEl = this.el.nativeElement.querySelector('.canvas');
    if (!canvasEl) return;

    const rect = canvasEl.getBoundingClientRect();
    const scale = this.zoom() / 100;
    const x = Math.max(0, Math.round((event.clientX - rect.left) / scale));
    const y = Math.max(0, Math.round((event.clientY - rect.top) / scale));

    const bandId = this.findBandAtY(y);
    this.itemDropped.emit({ type: itemType, x, y, bandId });
  }

  private findBandAtY(canvasY: number): string {
    let accumulatedY = 0;
    for (const band of this.template().bands) {
      accumulatedY += band.height;
      if (canvasY < accumulatedY) return band.id;
    }
    const bands = this.template().bands;
    return bands.length > 0 ? bands[bands.length - 1].id : '';
  }

  // ===== 画布鼠标事件 =====

  onCanvasMouseDown(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.closest('.report-item') || target.closest('.resize-handle')) return;
    this.itemSelected.emit('');
  }

  onBandClick(event: MouseEvent, bandId: string): void {
    event.stopPropagation();
    this.bandSelected.emit(bandId);
  }

  onItemMouseDown(event: MouseEvent, itemId: string, item: ReportItem): void {
    if ((event.target as HTMLElement).classList.contains('resize-handle')) return;
    event.stopPropagation();
    event.preventDefault();
    this.itemSelected.emit(itemId);

    this.dragState = {
      type: 'move',
      itemId,
      startX: event.clientX,
      startY: event.clientY,
      itemStartX: item.x,
      itemStartY: item.y,
      itemStartW: item.width,
      itemStartH: item.height,
      resizeDir: ''
    };
  }

  onResizeStart(event: MouseEvent, itemId: string, direction: string): void {
    event.stopPropagation();
    event.preventDefault();

    const item = this.findItem(itemId);
    if (!item) return;

    this.dragState = {
      type: 'resize',
      itemId,
      startX: event.clientX,
      startY: event.clientY,
      itemStartX: item.x,
      itemStartY: item.y,
      itemStartW: item.width,
      itemStartH: item.height,
      resizeDir: direction
    };
  }

  private onGlobalMouseMove(event: MouseEvent): void {
    if (!this.dragState) return;

    const scale = this.zoom() / 100;
    const dx = (event.clientX - this.dragState.startX) / scale;
    const dy = (event.clientY - this.dragState.startY) / scale;

    if (this.dragState.type === 'move') {
      const newX = Math.max(0, Math.round(this.dragState.itemStartX + dx));
      const newY = Math.max(0, Math.round(this.dragState.itemStartY + dy));
      this.itemMoved.emit({ itemId: this.dragState.itemId, x: newX, y: newY });
    } else if (this.dragState.type === 'resize') {
      let newX = this.dragState.itemStartX;
      let newY = this.dragState.itemStartY;
      let newW = this.dragState.itemStartW;
      let newH = this.dragState.itemStartH;

      const dir = this.dragState.resizeDir;
      if (dir.includes('e')) newW = Math.max(20, this.dragState.itemStartW + dx);
      if (dir.includes('s')) newH = Math.max(10, this.dragState.itemStartH + dy);
      if (dir.includes('w')) {
        newW = Math.max(20, this.dragState.itemStartW - dx);
        newX = this.dragState.itemStartX + dx;
        if (newW <= 20) newX = this.dragState.itemStartX + this.dragState.itemStartW - 20;
      }
      if (dir.includes('n')) {
        newH = Math.max(10, this.dragState.itemStartH - dy);
        newY = this.dragState.itemStartY + dy;
        if (newH <= 10) newY = this.dragState.itemStartY + this.dragState.itemStartH - 10;
      }

      this.itemResized.emit({
        itemId: this.dragState.itemId,
        x: Math.round(newX), y: Math.round(newY),
        width: Math.round(newW), height: Math.round(newH)
      });
    }
  }

  private onGlobalMouseUp(_event: MouseEvent): void {
    this.dragState = null;
  }

  private findItem(itemId: string): ReportItem | null {
    for (const band of this.template().bands) {
      const found = band.items.find(i => i.id === itemId);
      if (found) return found;
    }
    return null;
  }

  // ===== 类型安全 config 访问 =====

  getTextConfig(item: ReportItem): TextItemConfig {
    return item.config as TextItemConfig;
  }

  getFieldConfig(item: ReportItem): { field?: string } {
    return item.config as { field: string };
  }

  getChartConfig(item: ReportItem): ChartItemConfig {
    return item.config as ChartItemConfig;
  }

  getTableConfig(item: ReportItem): TableItemConfig {
    return item.config as TableItemConfig;
  }

  getBandLabel(type: string): string {
    const labels: Record<string, string> = {
      'page-header': '页眉',
      'report-header': '报表头',
      'group-header': '分组头',
      'data': '数据区',
      'group-footer': '分组尾',
      'report-footer': '报表尾',
      'page-footer': '页脚',
    };
    return labels[type] || type;
  }
}
