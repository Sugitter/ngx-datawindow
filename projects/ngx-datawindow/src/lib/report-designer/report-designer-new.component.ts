import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ReportDesignerToolbarComponent } from './toolbar/report-designer-toolbar.component';
import { ReportDesignerToolboxComponent } from './toolbox/report-designer-toolbox.component';
import { ReportDesignerCanvasComponent } from './canvas/report-designer-canvas.component';
import { ReportDesignerPropertyPanelComponent } from './property-panel/report-designer-property-panel.component';
import { UndoRedoService } from './services/undo-redo.service';
import { ReportEngine } from './report-engine';
import {
  ReportTemplate, ReportItem, ReportItemType,
  TextItemConfig, ImageItemConfig, TableItemConfig, ChartItemConfig,
  LineItemConfig, RectangleItemConfig, BarcodeItemConfig, QrCodeItemConfig,
  FieldItemConfig, PageBreakItemConfig, ReportItemConfig, TableColumn,
  createEmptyTemplate
} from './report-template.model';
import { ConfigureColumnsDialogComponent } from './dialogs/configure-columns-dialog.component';
import * as XLSX from 'xlsx';

@Component({
  selector: 'ngx-report-designer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSidenavModule,
    MatCardModule,
    MatDialogModule,
    ReportDesignerToolbarComponent,
    ReportDesignerToolboxComponent,
    ReportDesignerCanvasComponent,
    ReportDesignerPropertyPanelComponent
  ],
  template: `
    <div class="designer-container">
      <!-- 顶部工具栏 -->
      <report-designer-toolbar
        [canUndo]="undoService.canUndo()"
        [canRedo]="undoService.canRedo()"
        [canPaste]="canPaste()"
        [zoomPercent]="zoom()"
        [showGrid]="showGrid()"
        [showRuler]="showRuler()"
        (new)="onNew()"
        (open)="onOpen()"
        (save)="onSave()"
        (undo)="onUndo()"
        (redo)="onRedo()"
        (copy)="onCopy()"
        (paste)="onPaste()"
        (delete)="onDelete()"
        (toggleGrid)="showGrid.update(v => !v)"
        (toggleRuler)="showRuler.update(v => !v)"
        (zoomChange)="zoom.set($event)"
        (preview)="onPreview()"
        (exportPdf)="onExportPdf()"
        (exportExcel)="onExportExcel()"
        (print)="onPrint()"
      ></report-designer-toolbar>

      <!-- 主体区域 -->
      <div class="designer-body">
        <!-- 左侧工具箱 -->
        <mat-card class="toolbox-panel">
          <report-designer-toolbox></report-designer-toolbox>
        </mat-card>

        <!-- 中央画布 -->
        <report-designer-canvas
          [template]="template()"
          [zoom]="zoom()"
          [showGrid]="showGrid()"
          [showRuler]="showRuler()"
          [activeBandId]="activeBandId()"
          [selectedItemId]="selectedItemId()"
          (bandSelected)="activeBandId.set($event)"
          (itemSelected)="selectedItemId.set($event)"
          (itemDropped)="onItemDropped($event)"
          (itemMoved)="onItemMoved($event)"
          (itemResized)="onItemResized($event)"
        ></report-designer-canvas>

        <!-- 右侧属性面板 -->
        <mat-card class="property-panel">
          <report-designer-property-panel
            [selectedItem]="selectedItem()"
            [dataSets]="dataSets"
            (propertyChanged)="onPropertyChanged($event)"
            (deleteItem)="onDeleteItem($event)"
            (configureColumns)="onConfigureColumns($event)"
          ></report-designer-property-panel>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .designer-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
    }
    .designer-body {
      display: flex;
      flex: 1;
      overflow: hidden;
    }
    .toolbox-panel {
      width: 200px;
      min-width: 200px;
      border-radius: 0;
      border-right: 1px solid #e0e0e0;
      overflow-y: auto;
    }
    .property-panel {
      width: 280px;
      min-width: 280px;
      border-radius: 0;
      border-left: 1px solid #e0e0e0;
      overflow-y: auto;
    }
  `]
})
export class ReportDesignerNewComponent {
  undoService = inject(UndoRedoService);
  dialog = inject(MatDialog);

  template = signal<ReportTemplate>(createEmptyTemplate('新建报表'));
  selectedItemId = signal<string>('');
  activeBandId = signal<string>('');
  zoom = signal<number>(100);
  showGrid = signal<boolean>(true);
  showRuler = signal<boolean>(false);
  dataSets = ['orders', 'customers', 'products'];

  // 复制/粘贴 clipboard
  private copiedItem = signal<ReportItem | null>(null);
  canPaste = computed(() => this.copiedItem() !== null);

  selectedItem = computed(() => {
    const id = this.selectedItemId();
    if (!id) return null;
    for (const band of this.template().bands) {
      const found = band.items.find(item => item.id === id);
      if (found) return found;
    }
    return null;
  });

  // ===== 工具栏事件 =====

  onNew(): void {
    this.template.set(createEmptyTemplate('新建报表'));
    this.selectedItemId.set('');
    this.undoService.clear();
  }

  onOpen(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.addEventListener('change', (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const tpl = JSON.parse(reader.result as string) as ReportTemplate;
          this.template.set(tpl);
          this.selectedItemId.set('');
          this.activeBandId.set('');
          this.undoService.clear();
        } catch (err) {
          console.error('打开模板失败:', err);
        }
      };
      reader.readAsText(file);
    });
    input.click();
  }

  onSave(): void {
    const json = JSON.stringify(this.template(), null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.template().meta.name || 'report'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  onUndo(): void {
    const prev = this.undoService.undo(this.template());
    if (prev) this.template.set(prev);
  }

  onRedo(): void {
    const next = this.undoService.redo(this.template());
    if (next) this.template.set(next);
  }

  onCopy(): void {
    const item = this.selectedItem();
    if (!item) return;
    // 深拷贝：展开所有属性，包括 config 对象
    const cloned: ReportItem = {
      ...item,
      id: '',       // id 留空，粘贴时重新生成
      config: { ...item.config } as ReportItemConfig,
    };
    this.copiedItem.set(cloned);
  }

  onPaste(): void {
    const src = this.copiedItem();
    if (!src) return;
    this.pushUndo();
    const newItem: ReportItem = {
      ...src,
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      x: src.x + 20,
      y: src.y + 20,
    };
    // 粘贴到当前激活的 band，否则放到第一个 band
    const targetBandId = this.activeBandId() || this.template().bands[0]?.id || '';
    const band = this.template().bands.find(b => b.id === targetBandId);
    if (band) {
      band.items.push(newItem);
    } else {
      // fallback：放到第一个 band
      if (this.template().bands.length > 0) {
        this.template().bands[0].items.push(newItem);
      }
    }
    this.selectedItemId.set(newItem.id);
    this.template.update(t => ({ ...t }));
  }

  onDelete(): void { this.deleteSelectedItem(); }

  onPreview(): void {
    // 用 ReportEngine 渲染预览（mock store，因为没有真实 DataStore 实例）
    const mockRows = [
      { id: 1, orderNo: 'ORD001', customer: '张三', amount: 1200.50, date: '2026-01-15' },
      { id: 2, orderNo: 'ORD002', customer: '李四', amount:  880.00, date: '2026-01-16' },
      { id: 3, orderNo: 'ORD003', customer: '王五', amount: 2350.00, date: '2026-01-17' },
      { id: 4, orderNo: 'ORD004', customer: '赵六', amount:  450.75, date: '2026-01-18' },
    ];
    const store: any = { getRows: () => mockRows };
    const engine = new ReportEngine();
    const pages = engine.render(this.template(), store);

    // 生成 HTML 预览
    const html = this._buildPreviewHtml(pages);
    const win = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  }

  onExportPdf(): void {
    // 先打开预览，再触发打印（用户可选择"另存为 PDF"）
    this.onPreview();
  }

  onExportExcel(): void {
    const tpl = this.template();
    const wb = XLSX.utils.book_new();

    // Sheet 1: 报表结构
    const metaRows = [
      ['报表名称', tpl.meta.name],
      ['创建时间', tpl.meta.createdAt],
      ['纸张大小', tpl.page.paperSize],
      ['方向', tpl.page.orientation],
      ['边距', `${tpl.page.margin.top}/${tpl.page.margin.bottom}/${tpl.page.margin.left}/${tpl.page.margin.right}`],
      [],
      ['带区列表'],
      ...tpl.bands.map(b => [b.type, b.label || b.type, `高:${b.height}`]),
    ];
    const metaWs = XLSX.utils.aoa_to_sheet(metaRows);
    XLSX.utils.book_append_sheet(wb, metaWs, '报表结构');

    // Sheet 2: 报表项
    const itemRows = [['带区', '类型', '名称/文本', 'X', 'Y', '宽度', '高度']];
    for (const band of tpl.bands) {
      for (const item of band.items) {
        const cfg = item.config as any;
        itemRows.push([
          band.label || band.type,
          item.type,
          cfg.text ?? cfg.field ?? cfg.value ?? '',
          item.x, item.y,
          item.width, item.height,
        ]);
      }
    }
    const itemWs = XLSX.utils.aoa_to_sheet(itemRows);
    XLSX.utils.book_append_sheet(wb, itemWs, '报表项');

    XLSX.writeFile(wb, `${tpl.meta.name || 'report'}.xlsx`);
  }
  private _buildPreviewHtml(pages: any): string {
    const p = pages.pages[0] || { sections: [], pageNumberText: '', timestampText: '' };
    let rows = '';
    for (const section of p.sections) {
      for (const row of section.rows) {
        if (row.type === 'separator') { rows += '<hr>'; continue; }
        let cells = '';
        for (const cell of row.cells) {
          cells += `<td style="border:1px solid #ddd;padding:4px 8px;${cell.style?.align ? 'text-align:'+cell.style.align+';' : ''}">${cell.chartData ? '[图表]' : (cell.text || '')}</td>`;
        }
        rows += `<tr>${cells}</tr>`;
      }
    }
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>报表预览</title><style>
      body{font-family:Microsoft YaHei,sans-serif;margin:20px;}
      table{border-collapse:collapse;width:100%;font-size:12px;}
      th{background:#f5f5f5;font-weight:bold;}
      .page-footer{text-align:right;font-size:11px;color:#999;margin-top:16px;}
      @media print{.no-print{display:none;}}
    </style></head><body>
      <h2>${this.template().meta.name || '报表预览'}</h2>
      <p style="color:#666;font-size:12px;">生成时间: ${p.timestampText}</p>
      <table><thead>${rows}</thead></table>
      <div class="page-footer">${p.pageNumberText}</div>
      <button class="no-print" onclick="window.print()" style="margin-top:16px;padding:6px 16px;">🖨️ 打印 / 另存为 PDF</button>
    </body></html>`;
  }
  onPrint(): void {
    // 简单打印：在新窗口中打开当前模板的 JSON 预览
    const json = JSON.stringify(this.template(), null, 2);
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`<pre>${json}</pre>`);
      win.print();
    }
  }

  // ===== 画布事件 =====

  onItemDropped(event: { type: ReportItemType; x: number; y: number; bandId: string }): void {
    this.pushUndo();
    const band = this.template().bands.find(b => b.id === event.bandId);
    if (!band) return;

    const newItem = this.createItem(event.type, event.x, event.y);
    band.items.push(newItem);
    this.selectedItemId.set(newItem.id);
    this.template.update(t => ({ ...t }));
  }

  onItemMoved(event: { itemId: string; x: number; y: number }): void {
    const template = this.template();
    for (const band of template.bands) {
      const item = band.items.find(i => i.id === event.itemId);
      if (item) {
        item.x = event.x;
        item.y = event.y;
        this.template.set({ ...template });
        break;
      }
    }
  }

  onItemResized(event: { itemId: string; x: number; y: number; width: number; height: number }): void {
    const template = this.template();
    for (const band of template.bands) {
      const item = band.items.find(i => i.id === event.itemId);
      if (item) {
        item.x = event.x;
        item.y = event.y;
        item.width = event.width;
        item.height = event.height;
        this.template.set({ ...template });
        break;
      }
    }
  }

  // ===== 属性面板事件 =====

  onPropertyChanged(item: ReportItem): void {
    this.pushUndo();
    const template = this.template();
    for (const band of template.bands) {
      const index = band.items.findIndex(i => i.id === item.id);
      if (index !== -1) {
        band.items[index] = { ...item };
        break;
      }
    }
    this.template.set({ ...template });
  }

  onDeleteItem(itemId: string): void { this.deleteItem(itemId); }

  onConfigureColumns(item: ReportItem): void {
    if (item.type !== 'table') return;
    const tableConfig = item.config as TableItemConfig;
    const ref = this.dialog.open(ConfigureColumnsDialogComponent, {
      width: '600px',
      data: { columns: tableConfig.columns || [] },
    });
    ref.afterClosed().subscribe((columns: TableColumn[] | null) => {
      if (!columns) return;
      this.pushUndo();
      tableConfig.columns = columns;
      this.onPropertyChanged(item);
    });
  }

  // ===== 辅助方法 =====

  private createItem(type: ReportItemType, x: number, y: number): ReportItem {
    const id = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const base: ReportItem = {
      id, type, x, y,
      width: 100, height: 30,
      visible: true,
      style: '',
      config: {} as ReportItemConfig
    };

    switch (type) {
      case 'text':
        return { ...base, config: { type: 'text', text: '文本框', fontSize: 14, color: '#000000', fontWeight: 'normal' } as TextItemConfig };
      case 'field':
        return { ...base, config: { type: 'field', field: '' } as FieldItemConfig };
      case 'image':
        return { ...base, width: 150, height: 100, config: { type: 'image', source: 'url' } as ImageItemConfig };
      case 'table':
        return { ...base, width: 400, height: 200, config: { type: 'table', columns: [], dataRow: { alternatingColors: false } } as TableItemConfig };
      case 'chart':
        return { ...base, width: 400, height: 300, config: { type: 'chart', chartType: 'bar', xField: '', yFields: [], showLegend: true, showDataLabels: false } as ChartItemConfig };
      case 'line':
        return { ...base, width: 200, height: 2, config: { type: 'line', direction: 'horizontal', thickness: 1, style: 'solid', color: '#000000' } as LineItemConfig };
      case 'rectangle':
        return { ...base, config: { type: 'rectangle' } as RectangleItemConfig };
      case 'barcode':
        return { ...base, width: 150, height: 50, config: { type: 'barcode', format: 'CODE128', value: '', showText: true } as BarcodeItemConfig };
      case 'qrcode':
        return { ...base, width: 100, height: 100, config: { type: 'qrcode', value: '', errorCorrectionLevel: 'M' } as QrCodeItemConfig };
      case 'page-break':
        return { ...base, width: 10, height: 10, config: { type: 'page-break' } as PageBreakItemConfig };
      default:
        return base;
    }
  }

  private deleteSelectedItem(): void {
    const id = this.selectedItemId();
    if (id) this.deleteItem(id);
  }

  private deleteItem(itemId: string): void {
    this.pushUndo();
    const template = this.template();
    for (const band of template.bands) {
      const index = band.items.findIndex(i => i.id === itemId);
      if (index !== -1) {
        band.items.splice(index, 1);
        break;
      }
    }
    if (this.selectedItemId() === itemId) this.selectedItemId.set('');
    this.template.set({ ...template });
  }

  private pushUndo(): void {
    this.undoService.pushSnapshot(this.template());
  }
}
