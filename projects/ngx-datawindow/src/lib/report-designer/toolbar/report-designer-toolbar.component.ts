import { Component, Output, EventEmitter, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'report-designer-toolbar',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatSelectModule,
    MatTooltipModule
  ],
  template: `
    <mat-toolbar color="primary" class="designer-toolbar">
      <!-- 文件操作 -->
      <button mat-icon-button (click)="onNew()" matTooltip="新建" matTooltipPosition="below">
        <mat-icon>note_add</mat-icon>
      </button>
      <button mat-icon-button (click)="onOpen()" matTooltip="打开" matTooltipPosition="below">
        <mat-icon>folder_open</mat-icon>
      </button>
      <button mat-icon-button (click)="onSave()" matTooltip="保存" matTooltipPosition="below">
        <mat-icon>save</mat-icon>
      </button>

      <mat-divider [vertical]="true" class="toolbar-divider"></mat-divider>

      <!-- 编辑操作 -->
      <button mat-icon-button (click)="onUndo()" [disabled]="!canUndo()" matTooltip="撤销" matTooltipPosition="below">
        <mat-icon>undo</mat-icon>
      </button>
      <button mat-icon-button (click)="onRedo()" [disabled]="!canRedo()" matTooltip="重做" matTooltipPosition="below">
        <mat-icon>redo</mat-icon>
      </button>
      <button mat-icon-button (click)="onCopy()" matTooltip="复制" matTooltipPosition="below">
        <mat-icon>content_copy</mat-icon>
      </button>
      <button mat-icon-button (click)="onPaste()" [disabled]="!canPaste()" matTooltip="粘贴" matTooltipPosition="below">
        <mat-icon>content_paste</mat-icon>
      </button>
      <button mat-icon-button (click)="onDelete()" matTooltip="删除" matTooltipPosition="below">
        <mat-icon>delete</mat-icon>
      </button>

      <mat-divider [vertical]="true" class="toolbar-divider"></mat-divider>

      <!-- 视图操作 -->
      <button mat-icon-button (click)="onToggleGrid()" [class.active]="showGrid()" matTooltip="显示/隐藏网格" matTooltipPosition="below">
        <mat-icon>grid_on</mat-icon>
      </button>
      <button mat-icon-button (click)="onToggleRuler()" [class.active]="showRuler()" matTooltip="显示/隐藏标尺" matTooltipPosition="below">
        <mat-icon>straighten</mat-icon>
      </button>

      <span class="toolbar-spacer"></span>

      <!-- 缩放 -->
      <mat-select [value]="zoomPercent()" (valueChange)="onZoomChange($event)" class="zoom-select">
        <mat-option [value]="25">25%</mat-option>
        <mat-option [value]="50">50%</mat-option>
        <mat-option [value]="75">75%</mat-option>
        <mat-option [value]="100">100%</mat-option>
        <mat-option [value]="125">125%</mat-option>
        <mat-option [value]="150">150%</mat-option>
        <mat-option [value]="200">200%</mat-option>
      </mat-select>

      <mat-divider [vertical]="true" class="toolbar-divider"></mat-divider>

      <!-- 导出操作 -->
      <button mat-icon-button (click)="onPreview()" matTooltip="预览" matTooltipPosition="below">
        <mat-icon>visibility</mat-icon>
      </button>
      <button mat-icon-button (click)="onExportPdf()" matTooltip="导出 PDF" matTooltipPosition="below">
        <mat-icon>picture_as_pdf</mat-icon>
      </button>
      <button mat-icon-button (click)="onExportExcel()" matTooltip="导出 Excel" matTooltipPosition="below">
        <mat-icon>table_chart</mat-icon>
      </button>
      <button mat-icon-button (click)="onPrint()" matTooltip="打印" matTooltipPosition="below">
        <mat-icon>print</mat-icon>
      </button>
    </mat-toolbar>
  `,
  styles: [`
    .designer-toolbar {
      background: #3f51b5;
      color: white;
      min-height: 48px;
      padding: 0 8px;
    }

    .toolbar-divider {
      height: 24px;
      margin: 0 8px;
      background-color: rgba(255, 255, 255, 0.3);
    }

    .toolbar-spacer {
      flex: 1;
    }

    .zoom-select {
      width: 80px;
      font-size: 14px;
      color: white;
    }

    .zoom-select .mat-select-value {
      color: white;
    }

    button.active {
      background-color: rgba(255, 255, 255, 0.2);
    }

    button[disabled] {
      opacity: 0.5;
    }
  `]
})
export class ReportDesignerToolbarComponent {
  @Output() new = new EventEmitter<void>();
  @Output() open = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();
  @Output() undo = new EventEmitter<void>();
  @Output() redo = new EventEmitter<void>();
  @Output() copy = new EventEmitter<void>();
  @Output() paste = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
  @Output() toggleGrid = new EventEmitter<void>();
  @Output() toggleRuler = new EventEmitter<void>();
  @Output() zoomChange = new EventEmitter<number>();
  @Output() preview = new EventEmitter<void>();
  @Output() exportPdf = new EventEmitter<void>();
  @Output() exportExcel = new EventEmitter<void>();
  @Output() print = new EventEmitter<void>();

  canUndo = input<boolean>(false);
  canRedo = input<boolean>(false);
  canPaste = input<boolean>(false);
  showGrid = input<boolean>(true);
  showRuler = input<boolean>(false);
  zoomPercent = input<number>(100);

  onNew(): void { this.new.emit(); }
  onOpen(): void { this.open.emit(); }
  onSave(): void { this.save.emit(); }
  onUndo(): void { this.undo.emit(); }
  onRedo(): void { this.redo.emit(); }
  onCopy(): void { this.copy.emit(); }
  onPaste(): void { this.paste.emit(); }
  onDelete(): void { this.delete.emit(); }

  onToggleGrid(): void {
    this.toggleGrid.emit();
  }

  onToggleRuler(): void {
    this.toggleRuler.emit();
  }

  onZoomChange(value: number): void {
    this.zoomChange.emit(value);
  }

  onPreview(): void { this.preview.emit(); }
  onExportPdf(): void { this.exportPdf.emit(); }
  onExportExcel(): void { this.exportExcel.emit(); }
  onPrint(): void { this.print.emit(); }
}
