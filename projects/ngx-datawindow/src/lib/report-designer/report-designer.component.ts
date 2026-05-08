/**
 * 报表设计器组件 — ngx-datawindow Report Designer
 *
 * 功能：
 * 1. 工具箱（Toolbox）：从左侧面板拖拽报表项到画布
 * 2. 画布（Canvas）：设计报表布局，支持选中/移动/调整大小
 * 3. 属性面板（Properties）：编辑选中项的属性
 * 4. 数据源面板（DataSource）：显示 DataStore 字段，支持拖拽绑定
 * 5. 工具栏（Toolbar）：保存/加载/预览/导出
 *
 * 使用方式：
 * <dw-report-designer [datastore]="store" [(template)]="template" />
 */
import {
  Component, input, output, signal, computed, inject,
  ChangeDetectionStrategy, OnInit, OnDestroy,
  ElementRef, ViewChild, AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import {
  ReportTemplate, ReportBand, ReportItem, ReportStyle,
  createEmptyTemplate, ReportItemType, BandType,
  TableColumn,
} from './report-template.model';
import { ReportEngine, ReportPages } from './report-engine';
import { DataStoreImpl } from '../datastore';

interface ToolboxItem {
  type: ReportItemType;
  label: string;
  icon: string;
  description: string;
}

interface CanvasItem extends ReportItem {
  selected: boolean;
  dragging: boolean;
}

// ══════════════════════════════════════════════════════════════
// 主组件
// ══════════════════════════════════════════════════════════════

@Component({
  selector: 'dw-report-designer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    DragDropModule,
    MatToolbarModule, MatButtonModule, MatIconModule,
    MatSelectModule, MatInputModule, MatFormFieldModule,
    MatTabsModule, MatTooltipModule, MatDialogModule, MatSnackBarModule,
  ],
  template: `
    <div class="designer-root">

      <!-- 工具栏 -->
      <mat-toolbar class="designer-toolbar">
        <span class="toolbar-title">报表设计器</span>

        <div class="toolbar-actions">
          <!-- 文件操作 -->
          <button mat-icon-button (click)="onNew()" matTooltip="新建报表">
            <mat-icon>add_circle_outline</mat-icon>
          </button>
          <button mat-icon-button (click)="onOpen()" matTooltip="加载模板">
            <mat-icon>folder_open</mat-icon>
          </button>
          <button mat-icon-button (click)="onSave()" matTooltip="保存模板">
            <mat-icon>save</mat-icon>
          </button>

          <mat-divider vertical />

          <!-- 视图操作 -->
          <button mat-icon-button (click)="togglePreview()" [matTooltip]="previewMode() ? '返回编辑' : '预览报表'">
            <mat-icon>{{ previewMode() ? 'edit' : 'preview' }}</mat-icon>
          </button>
          <button mat-icon-button (click)="onExport()" matTooltip="导出">
            <mat-icon>download</mat-icon>
          </button>

          <mat-divider vertical />

          <!-- 缩放 -->
          <span class="zoom-label">{{ zoom() }}%</span>
          <button mat-icon-button (click)="zoomOut()" matTooltip="缩小">
            <mat-icon>remove</mat-icon>
          </button>
          <button mat-icon-button (click)="zoomIn()" matTooltip="放大">
            <mat-icon>add</mat-icon>
          </button>
          <button mat-icon-button (click)="zoomFit()" matTooltip="适应窗口">
            <mat-icon>fit_screen</mat-icon>
          </button>

          <mat-divider vertical />

          <!-- 帮助 -->
          <button mat-icon-button (click)="showHelp()" matTooltip="帮助">
            <mat-icon>help_outline</mat-icon>
          </button>
        </div>
      </mat-toolbar>

      <!-- 主工作区 -->
      <div class="designer-body">

        @if (!previewMode()) {
          <!-- 左侧工具箱 + 数据源面板 -->
          <div class="designer-left" cdkDropList
               [cdkDropListData]="toolboxItems"
               cdkDropListSortingDisabled>

            <mat-tab-group class="left-tabs" animationDuration="150ms">
              <!-- 工具箱 Tab -->
              <mat-tab label="工具箱">
                <div class="toolbox-list">
                  @for (item of toolboxItems; track item.type) {
                    <div class="toolbox-item"
                         cdkDrag
                         [cdkDragData]="item.type"
                         (cdkDragDropped)="onToolboxDrop($event)">
                      <mat-icon>{{ item.icon }}</mat-icon>
                      <span>{{ item.label }}</span>
                    </div>
                  }
                </div>
              </mat-tab>

              <!-- 数据源 Tab -->
              <mat-tab label="数据源">
                <div class="datasource-list">
                  @if (fields().length > 0) {
                    <div class="ds-section-title">可用字段</div>
                    @for (field of fields(); track field.name) {
                      <div class="ds-field"
                           cdkDrag
                           [cdkDragData]="{type: 'field', field: field.name}"
                           (cdkDragDropped)="onFieldDropToCanvas($event)">
                        <mat-icon class="ds-field-icon">text_fields</mat-icon>
                        <div class="ds-field-info">
                          <span class="ds-field-name">{{ field.name }}</span>
                          <span class="ds-field-type">{{ field.dataType }}</span>
                        </div>
                      </div>
                    }

                    <div class="ds-section-title" style="margin-top:16px">聚合函数</div>
                    @for (agg of aggregationTypes; track agg) {
                      <div class="ds-field ds-agg"
                           cdkDrag
                           [cdkDragData]="{type: 'computed', func: agg}"
                           (cdkDragDropped)="onFieldDropToCanvas($event)">
                        <mat-icon class="ds-field-icon">calculate</mat-icon>
                        <span class="ds-field-name">{{ agg }}()</span>
                      </div>
                    }
                  } @else {
                    <div class="ds-empty">
                      <mat-icon>info</mat-icon>
                      <p>未绑定 DataStore</p>
                      <p class="ds-empty-hint">请在父组件传入 datastore 输入属性</p>
                    </div>
                  }
                </div>
              </mat-tab>

              <!-- 带区管理 Tab -->
              <mat-tab label="带区">
                <div class="bands-list">
                  @for (band of template().bands; track band.id) {
                    <div class="band-item"
                         [class.band-active]="activeBandId() === band.id"
                         (click)="selectBand(band.id)">
                      <mat-icon class="band-icon">{{ getBandIcon(band.type) }}</mat-icon>
                      <div class="band-info">
                        <span class="band-type">{{ band.type }}</span>
                        <span class="band-label">{{ band.label }}</span>
                      </div>
                      <div class="band-actions">
                        <button mat-icon-button class="band-toggle-btn"
                                (click)="toggleBandVisibility(band, $event)">
                          <mat-icon>{{ band.visible !== false ? 'visibility' : 'visibility_off' }}</mat-icon>
                        </button>
                      </div>
                    </div>
                  }
                </div>
              </mat-tab>
            </mat-tab-group>
          </div>

          <!-- 中央画布 -->
          <div class="designer-canvas-wrapper">
            <div class="canvas-rulers">
              <div class="ruler-h ruler">
                @for (tick of hTicks(); track tick) {
                  <span class="tick" [style.left.px]="tick * zoom() / 100">{{ tick }}</span>
                }
              </div>
              <div class="ruler-v ruler">
                @for (tick of vTicks(); track tick) {
                  <span class="tick" [style.top.px]="tick * zoom() / 100">{{ tick }}</span>
                }
              </div>
            </div>

            <div class="canvas-scroll" #canvasScroll>
              <!-- 页边距参考线 -->
              <div class="page-margin" [style.transform]="getCanvasTransform()">

                <!-- 页面画布 -->
                <div class="page-canvas"
                     [style.width.px]="pageWidth"
                     [style.height.px]="pageHeight"
                     [style.background]="'#fff'"
                     [style.boxShadow]="'0 2px 8px rgba(0,0,0,0.15)'"
                     cdkDropList
                     [cdkDropListData]="activeBandItems()"
                     (cdkDropListDropped)="onCanvasDrop($event)"
                     (click)="deselectAll($event)">

                  <!-- 各带区 -->
                  @for (band of template().bands; track band.id) {
                    @if (band.visible !== false) {
                      <div class="canvas-band"
                           [class.band-active]="activeBandId() === band.id"
                           [style.height.px]="band.height"
                           [style.border-bottom]="band.separatorLine ? '1px dashed #ccc' : 'none'"
                           (click)="selectBand(band.id); $event.stopPropagation()">

                        <!-- 带区标签 -->
                        <div class="band-label-overlay">
                          <span class="band-label-text">{{ band.label ?? band.type }}</span>
                        </div>

                        <!-- 带区内的报表项 -->
                        @for (item of band.items; track item.id) {
                          <div class="canvas-item"
                               [class.item-selected]="selectedItemId() === item.id"
                               [style.left.px]="item.x"
                               [style.top.px]="item.y"
                               [style.width.px]="item.width"
                               [style.height.px]="item.height"
                               [style.zIndex]="item.zIndex ?? 1"
                               (click)="selectItem(item.id, $event)"
                               (mousedown)="onItemMouseDown($event, item)">

                            <!-- 选中手柄 -->
                            @if (selectedItemId() === item.id) {
                              <div class="resize-handles">
                                <div class="resize-handle n"  (mousedown)="onResize($event, item, 'n')"  (click)="$event.stopPropagation()"></div>
                                <div class="resize-handle s"  (mousedown)="onResize($event, item, 's')"  (click)="$event.stopPropagation()"></div>
                                <div class="resize-handle e"  (mousedown)="onResize($event, item, 'e')"  (click)="$event.stopPropagation()"></div>
                                <div class="resize-handle w"  (mousedown)="onResize($event, item, 'w')"  (click)="$event.stopPropagation()"></div>
                                <div class="resize-handle ne" (mousedown)="onResize($event, item, 'ne')" (click)="$event.stopPropagation()"></div>
                                <div class="resize-handle nw" (mousedown)="onResize($event, item, 'nw')" (click)="$event.stopPropagation()"></div>
                                <div class="resize-handle se" (mousedown)="onResize($event, item, 'se')" (click)="$event.stopPropagation()"></div>
                                <div class="resize-handle sw" (mousedown)="onResize($event, item, 'sw')" (click)="$event.stopPropagation()"></div>
                              </div>
                            }

                            <!-- 报表项预览内容 -->
                            <div class="item-content" [style.pointerEvents]="'none'">
                              {{ getItemPreviewText(item) }}
                            </div>

                            <!-- 删除按钮 -->
                            @if (selectedItemId() === item.id) {
                              <button class="item-delete-btn"
                                      (click)="deleteItem(item.id, $event)">
                                <mat-icon>close</mat-icon>
                              </button>
                            }
                          </div>
                        }
                      </div>
                    }
                  }
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧属性面板 -->
          <div class="designer-right">
            <mat-tab-group class="right-tabs" animationDuration="150ms">
              <!-- 选中项属性 -->
              <mat-tab [label]="selectedItem() ? '属性' : '属性'">
                @if (selectedItem(); as item) {
                  <div class="props-panel">
                    <div class="prop-section">
                      <div class="prop-section-title">基本信息</div>

                      <div class="prop-row">
                        <label>类型</label>
                        <span class="prop-badge">{{ item.type }}</span>
                      </div>

                      <div class="prop-row">
                        <label>ID</label>
                        <input class="prop-input" [(ngModel)]="item.id" readonly />
                      </div>

                      <div class="prop-row">
                        <label>名称</label>
                        <input class="prop-input" [(ngModel)]="item.name"
                               placeholder="用户友好名称" />
                      </div>

                      <div class="prop-row">
                        <label>可见性</label>
                        <mat-checkbox [(ngModel)]="item.visible">显示</mat-checkbox>
                      </div>
                    </div>

                    <div class="prop-section">
                      <div class="prop-section-title">位置与尺寸</div>

                      <div class="prop-grid-2">
                        <div class="prop-field">
                          <label>X</label>
                          <input class="prop-input small" type="number"
                                 [(ngModel)]="item.x" (ngModelChange)="onItemGeometryChange(item)" />
                        </div>
                        <div class="prop-field">
                          <label>Y</label>
                          <input class="prop-input small" type="number"
                                 [(ngModel)]="item.y" (ngModelChange)="onItemGeometryChange(item)" />
                        </div>
                        <div class="prop-field">
                          <label>宽</label>
                          <input class="prop-input small" type="number"
                                 [(ngModel)]="item.width" (ngModelChange)="onItemGeometryChange(item)" />
                        </div>
                        <div class="prop-field">
                          <label>高</label>
                          <input class="prop-input small" type="number"
                                 [(ngModel)]="item.height" (ngModelChange)="onItemGeometryChange(item)" />
                        </div>
                      </div>
                    </div>

                    <!-- 类型特定属性 -->
                    @switch (item.type) {
                      @case ('text') {
                        <div class="prop-section">
                          <div class="prop-section-title">文本内容</div>
                          <textarea class="prop-textarea"
                                    [(ngModel)]="item.config['text']"
                                    placeholder="输入静态文本..."
                                    rows="3"></textarea>

                          <div class="prop-row">
                            <label>字号</label>
                            <input class="prop-input small" type="number"
                                   [(ngModel)]="item.config['fontSize']"
                                   placeholder="12" />
                          </div>
                          <div class="prop-row">
                            <label>字重</label>
                            <select class="prop-select" [(ngModel)]="item.config['fontWeight']">
                              <option value="normal">正常</option>
                              <option value="bold">粗体</option>
                            </select>
                          </div>
                          <div class="prop-row">
                            <label>对齐</label>
                            <div class="align-buttons">
                              @for (a of alignOptions; track a.value) {
                                <button class="align-btn"
                                        [class.active]="item.config['align'] === a.value"
                                        (click)="item.config['align'] = a.value">
                                  <mat-icon>{{ a.icon }}</mat-icon>
                                </button>
                              }
                            </div>
                          </div>
                        </div>
                      }

                      @case ('field') {
                        <div class="prop-section">
                          <div class="prop-section-title">数据绑定</div>
                          <div class="prop-row">
                            <label>字段</label>
                            <select class="prop-select" [(ngModel)]="item.config['field']">
                              <option value="">-- 选择字段 --</option>
                              @for (f of fields(); track f.name) {
                                <option [value]="f.name">{{ f.label ?? f.name }}</option>
                              }
                            </select>
                          </div>
                          <div class="prop-row">
                            <label>格式</label>
                            <input class="prop-input" [(ngModel)]="item.config['format']"
                                   placeholder="如 #,##0.00" />
                          </div>
                          <div class="prop-row">
                            <label>空值文本</label>
                            <input class="prop-input" [(ngModel)]="item.config['nullText']"
                                   placeholder="空值显示..." />
                          </div>
                          <div class="prop-row">
                            <label>对齐</label>
                            <select class="prop-select" [(ngModel)]="item.config['align']">
                              <option value="left">左对齐</option>
                              <option value="center">居中</option>
                              <option value="right">右对齐</option>
                            </select>
                          </div>
                        </div>
                      }

                      @case ('computed') {
                        <div class="prop-section">
                          <div class="prop-section-title">计算表达式</div>
                          <textarea class="prop-textarea mono"
                                    [(ngModel)]="item.config['expression']"
                                    placeholder="{field1 + field2} 或 {SUM(sales)}"
                                    rows="3"></textarea>
                          <div class="expr-hint">
                            支持表达式：{field}、{SUM(x)}、{IIF(x>0,'+','-')}
                          </div>
                          <div class="prop-row">
                            <label>数据类型</label>
                            <select class="prop-select" [(ngModel)]="item.config['dataType']">
                              <option value="string">文本</option>
                              <option value="number">数字</option>
                              <option value="currency">货币</option>
                              <option value="date">日期</option>
                            </select>
                          </div>
                          <div class="prop-row">
                            <label>格式</label>
                            <input class="prop-input" [(ngModel)]="item.config['format']"
                                   placeholder="如 ¥#,##0.00" />
                          </div>
                        </div>
                      }

                      @case ('image') {
                        <div class="prop-section">
                          <div class="prop-section-title">图片属性</div>
                          <div class="prop-row">
                            <label>图片来源</label>
                            <select class="prop-select" [(ngModel)]="item.config['source']">
                              <option value="url">URL</option>
                              <option value="base64">Base64</option>
                              <option value="field">数据字段</option>
                              <option value="embedded">内嵌</option>
                            </select>
                          </div>
                          @if (item.config['source'] === 'url') {
                            <div class="prop-row">
                              <label>图片地址</label>
                              <input class="prop-input" [(ngModel)]="item.config['url']"
                                     placeholder="https://..." />
                            </div>
                          }
                          @if (item.config['source'] === 'field') {
                            <div class="prop-row">
                              <label>绑定字段</label>
                              <select class="prop-select" [(ngModel)]="item.config['field']">
                                <option value="">-- 选择字段 --</option>
                                @for (f of fields(); track f.name) {
                                  <option [value]="f.name">{{ f.label ?? f.name }}</option>
                                }
                              </select>
                            </div>
                          }
                          <div class="prop-row">
                            <label>适应方式</label>
                            <select class="prop-select" [(ngModel)]="item.config['fit']">
                              <option value="contain">完整显示</option>
                              <option value="cover">填充</option>
                              <option value="fill">拉伸</option>
                              <option value="none">原始大小</option>
                            </select>
                          </div>
                        </div>
                      }

                      @case ('line') {
                        <div class="prop-section">
                          <div class="prop-section-title">线条属性</div>
                          <div class="prop-row">
                            <label>方向</label>
                            <select class="prop-select" [(ngModel)]="item.config['direction']">
                              <option value="horizontal">水平</option>
                              <option value="vertical">垂直</option>
                            </select>
                          </div>
                          <div class="prop-row">
                            <label>线宽</label>
                            <input class="prop-input small" type="number"
                                   [(ngModel)]="item.config['thickness']" />
                          </div>
                          <div class="prop-row">
                            <label>样式</label>
                            <select class="prop-select" [(ngModel)]="item.config['style']">
                              <option value="solid">实线</option>
                              <option value="dashed">虚线</option>
                              <option value="dotted">点线</option>
                            </select>
                          </div>
                          <div class="prop-row">
                            <label>颜色</label>
                            <input class="prop-input" type="color"
                                   [(ngModel)]="item.config['color']" />
                          </div>
                        </div>
                      }

                      @case ('rectangle') {
                        <div class="prop-section">
                          <div class="prop-section-title">矩形属性</div>
                          <div class="prop-row">
                            <label>填充色</label>
                            <input class="prop-input" type="color"
                                   [(ngModel)]="item.config['fill']" />
                          </div>
                          <div class="prop-row">
                            <label>边框宽</label>
                            <input class="prop-input small" type="number"
                                   [(ngModel)]="item.config['border']['width']" />
                          </div>
                          <div class="prop-row">
                            <label>边框色</label>
                            <input class="prop-input" type="color"
                                   [(ngModel)]="item.config['border']['color']" />
                          </div>
                          <div class="prop-row">
                            <label>圆角</label>
                            <input class="prop-input small" type="number"
                                   [(ngModel)]="item.config['border']['radius']" />
                          </div>
                        </div>
                      }

                      @case ('barcode') {
                        <div class="prop-section">
                          <div class="prop-section-title">条形码属性</div>
                          <div class="prop-row">
                            <label>格式</label>
                            <select class="prop-select" [(ngModel)]="item.config['format']">
                              @for (fmt of barcodeFormats; track fmt) {
                                <option [value]="fmt">{{ fmt }}</option>
                              }
                            </select>
                          </div>
                          <div class="prop-row">
                            <label>绑定字段/值</label>
                            <input class="prop-input" [(ngModel)]="item.config['value']"
                                   placeholder="字段名或静态值" />
                          </div>
                          <div class="prop-row">
                            <mat-checkbox [(ngModel)]="item.config['showText']">显示文字</mat-checkbox>
                          </div>
                        </div>
                      }

                      @case ('chart') {
                        <div class="prop-section">
                          <div class="prop-section-title">图表属性</div>
                          <div class="prop-row">
                            <label>图表类型</label>
                            <select class="prop-select" [(ngModel)]="item.config['chartType']">
                              @for (ct of chartTypes; track ct.value) {
                                <option [value]="ct.value">{{ ct.label }}</option>
                              }
                            </select>
                          </div>
                          <div class="prop-row">
                            <label>X轴字段</label>
                            <select class="prop-select" [(ngModel)]="item.config['xField']">
                              <option value="">-- 选择字段 --</option>
                              @for (f of fields(); track f.name) {
                                <option [value]="f.name">{{ f.label ?? f.name }}</option>
                              }
                            </select>
                          </div>
                          <div class="prop-row">
                            <label>Y轴字段（逗号分隔）</label>
                            <input class="prop-input" [(ngModel)]="yFieldsInput"
                                   placeholder="sales, quantity"
                                   (ngModelChange)="updateChartYFields($event)" />
                          </div>
                          <div class="prop-row">
                            <label>显示图例</label>
                            <mat-checkbox [(ngModel)]="item.config['showLegend']">显示</mat-checkbox>
                          </div>
                          <div class="prop-row">
                            <label>显示数据标签</label>
                            <mat-checkbox [(ngModel)]="item.config['showDataLabels']">显示</mat-checkbox>
                          </div>
                        </div>
                      }

                      @case ('table') {
                        <div class="prop-section">
                          <div class="prop-section-title">表格属性</div>
                          <div class="prop-row">
                            <label>列宽合计（像素）</label>
                            <span class="prop-hint">表格列宽总和：{{ calcTableColWidths(item) }}px</span>
                          </div>
                          <div class="prop-row">
                            <label>斑马纹</label>
                            <mat-checkbox [(ngModel)]="item.config['dataRow']['alternatingColors']">
                              启用
                            </mat-checkbox>
                          </div>
                          <div class="prop-row">
                            <label>合计行</label>
                            <mat-checkbox [(ngModel)]="item.config['summaryRow']['visible']">
                              显示
                            </mat-checkbox>
                          </div>
                        </div>
                      }

                      @default {
                        <div class="prop-section">
                          <div class="prop-empty">该类型暂无专属属性</div>
                        </div>
                      }
                    }

                    <!-- 样式 -->
                    <div class="prop-section">
                      <div class="prop-section-title">样式</div>
                      <div class="prop-row">
                        <label>命名样式</label>
                        <select class="prop-select" [(ngModel)]="item.style">
                          <option value="">-- 无 --</option>
                          @for (styleName of styleNames(); track styleName) {
                            <option [value]="styleName">{{ styleName }}</option>
                          }
                        </select>
                      </div>
                      <div class="prop-row">
                        <label>文字颜色</label>
                        <input class="prop-input" type="color"
                               [(ngModel)]="item.styleInline['color']" />
                      </div>
                      <div class="prop-row">
                        <label>背景色</label>
                        <input class="prop-input" type="color"
                               [(ngModel)]="item.styleInline['backgroundColor']" />
                      </div>
                      <div class="prop-row">
                        <label>字号</label>
                        <input class="prop-input small" type="number"
                               [(ngModel)]="item.styleInline['fontSize']" />
                      </div>
                    </div>

                    <!-- 位置数值调整 -->
                    <div class="prop-section">
                      <div class="prop-section-title">对齐辅助</div>
                      <div class="align-grid">
                        <button class="grid-btn" (click)="alignItem(item, 'left')"
                                matTooltip="左对齐"><mat-icon>align_horizontal_left</mat-icon></button>
                        <button class="grid-btn" (click)="alignItem(item, 'center-h')"
                                matTooltip="水平居中"><mat-icon>align_horizontal_center</mat-icon></button>
                        <button class="grid-btn" (click)="alignItem(item, 'right')"
                                matTooltip="右对齐"><mat-icon>align_horizontal_right</mat-icon></button>
                        <button class="grid-btn" (click)="alignItem(item, 'top')"
                                matTooltip="顶对齐"><mat-icon>align_vertical_top</mat-icon></button>
                        <button class="grid-btn" (click)="alignItem(item, 'middle')"
                                matTooltip="垂直居中"><mat-icon>align_vertical_center</mat-icon></button>
                        <button class="grid-btn" (click)="alignItem(item, 'bottom')"
                                matTooltip="底对齐"><mat-icon>align_vertical_bottom</mat-icon></button>
                        <button class="grid-btn" (click)="alignItem(item, 'same-width')"
                                matTooltip="等宽"><mat-icon>width_normal</mat-icon></button>
                        <button class="grid-btn" (click)="alignItem(item, 'same-height')"
                                matTooltip="等高"><mat-icon>height</mat-icon></button>
                      </div>
                    </div>

                    <button mat-stroked-button color="warn" class="delete-item-btn"
                            (click)="deleteItem(item.id)">
                      <mat-icon>delete</mat-icon> 删除此报表项
                    </button>
                  </div>
                } @else {
                  <div class="props-empty">
                    <mat-icon>touch_app</mat-icon>
                    <p>点击画布上的报表项以编辑属性</p>
                  </div>
                }
              </mat-tab>

              <!-- 页面设置 -->
              <mat-tab label="页面">
                <div class="props-panel">
                  <div class="prop-section">
                    <div class="prop-section-title">纸张</div>
                    <div class="prop-row">
                      <label>纸张尺寸</label>
                      <select class="prop-select" [(ngModel)]="template().page.paperSize">
                        <option value="A4">A4</option>
                        <option value="A3">A3</option>
                        <option value="A5">A5</option>
                        <option value="Letter">Letter</option>
                        <option value="Legal">Legal</option>
                      </select>
                    </div>
                    <div class="prop-row">
                      <label>方向</label>
                      <div class="orientation-toggle">
                        <button [class.active]="template().page.orientation === 'portrait'"
                                (click)="setOrientation('portrait')">
                          <mat-icon>crop_portrait</mat-icon>纵向
                        </button>
                        <button [class.active]="template().page.orientation === 'landscape'"
                                (click)="setOrientation('landscape')">
                          <mat-icon>crop_landscape</mat-icon>横向
                        </button>
                      </div>
                    </div>
                  </div>

                  <div class="prop-section">
                    <div class="prop-section-title">页边距 (mm)</div>
                    <div class="prop-grid-2">
                      <div class="prop-field">
                        <label>上</label>
                        <input class="prop-input small" type="number"
                               [(ngModel)]="template().page.margin.top" />
                      </div>
                      <div class="prop-field">
                        <label>下</label>
                        <input class="prop-input small" type="number"
                               [(ngModel)]="template().page.margin.bottom" />
                      </div>
                      <div class="prop-field">
                        <label>左</label>
                        <input class="prop-input small" type="number"
                               [(ngModel)]="template().page.margin.left" />
                      </div>
                      <div class="prop-field">
                        <label>右</label>
                        <input class="prop-input small" type="number"
                               [(ngModel)]="template().page.margin.right" />
                      </div>
                    </div>
                  </div>

                  <div class="prop-section">
                    <div class="prop-section-title">页码</div>
                    <div class="prop-row">
                      <mat-checkbox [(ngModel)]="template().page.printPageNumber">显示页码</mat-checkbox>
                    </div>
                    @if (template().page.printPageNumber) {
                      <div class="prop-row">
                        <label>页码格式</label>
                        <input class="prop-input" [(ngModel)]="template().page.pageNumberFormat"
                               placeholder="第 {page} 页，共 {total} 页" />
                      </div>
                    }
                    <div class="prop-row">
                      <mat-checkbox [(ngModel)]="template().page.printTimestamp">显示打印时间</mat-checkbox>
                    </div>
                  </div>
                </div>
              </mat-tab>

              <!-- 样式管理 -->
              <mat-tab label="样式">
                <div class="styles-panel">
                  @for (style of allStyles(); track style.name) {
                    <div class="style-card">
                      <div class="style-card-header">
                        <strong>{{ style.name }}</strong>
                      </div>
                      <div class="style-card-body">
                        <span>字号: {{ style.fontSize ?? 12 }}px</span>
                        <span>颜色: <span class="color-swatch"
                          [style.background]="style.color ?? '#000'"></span></span>
                      </div>
                    </div>
                  }
                </div>
              </mat-tab>
            </mat-tab-group>
          </div>
        }

        @if (previewMode()) {
          <!-- 预览模式 -->
          <div class="preview-panel">
            <div class="preview-toolbar">
              <button mat-icon-button (click)="togglePreview()">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button (click)="exportPdf()" matTooltip="导出 PDF">
                <mat-icon>picture_as_pdf</mat-icon>
              </button>
              <button mat-icon-button (click)="exportExcel()" matTooltip="导出 Excel">
                <mat-icon>table_chart</mat-icon>
              </button>
            </div>

            <div class="preview-pages">
              @for (page of previewPages()?.pages ?? []; track page.pageNumber) {
                <div class="preview-page-wrapper">
                  <div class="preview-page-label">第 {{ page.pageNumber }} 页 / 共 {{ previewPages()?.totalPages }} 页</div>
                  <div class="preview-page">
                    @for (section of page.sections; track $index) {
                      <div class="preview-section" [style.height.px]="section.height">
                        @for (row of section.rows; track row.index) {
                          <div class="preview-row" [style.height.px]="row.height">
                            @for (cell of row.cells; track $index) {
                              <div class="preview-cell"
                                   [style.width.px]="getItemWidth(cell.item)"
                                   [style.height.px]="getItemHeight(cell.item)"
                                   [style.textAlign]="cell.style.align"
                                   [style.color]="cell.style.color"
                                   [style.background]="cell.style.backgroundColor"
                                   [style.fontSize.px]="cell.style.fontSize"
                                   [style.fontWeight]="cell.style.fontWeight"
                                   [style.padding.px]="cell.style.padding?.left ?? 4">
                                {{ cell.text }}
                              </div>
                            }
                          </div>
                        }
                      </div>
                    }

                    <!-- 页码 -->
                    <div class="preview-page-number">
                      {{ page.pageNumberText }}
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .designer-root {
      display: flex;
      flex-direction: column;
      height: 100vh;
      font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
      font-size: 13px;
      overflow: hidden;
    }

    /* 工具栏 */
    .designer-toolbar {
      display: flex;
      align-items: center;
      background: #fafafa;
      border-bottom: 1px solid #e0e0e0;
      padding: 0 8px;
      height: 48px;
      gap: 4px;
      flex-shrink: 0;
    }
    .toolbar-title {
      font-weight: 600;
      font-size: 15px;
      color: #333;
      margin-right: 16px;
    }
    .toolbar-actions { display: flex; align-items: center; gap: 2px; }
    .zoom-label { font-size: 12px; color: #666; min-width: 40px; text-align: center; }

    /* 工作区 */
    .designer-body {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    /* 左侧面板 */
    .designer-left {
      width: 220px;
      border-right: 1px solid #e0e0e0;
      background: #fafafa;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      flex-shrink: 0;
    }
    .left-tabs { flex: 1; display: flex; flex-direction: column; }
    ::ng-deep .left-tabs .mat-mdc-tab-body-wrapper { flex: 1; overflow: auto; }
    ::ng-deep .left-tabs .mat-mdc-tab-header { min-height: 36px; }
    ::ng-deep .left-tabs .mdc-tab { min-height: 36px !important; font-size: 12px !important; }

    /* 工具箱 */
    .toolbox-list { padding: 8px; display: flex; flex-direction: column; gap: 4px; }
    .toolbox-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 10px;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      cursor: grab;
      font-size: 12px;
      transition: all 0.15s;
    }
    .toolbox-item:hover { border-color: #3f51b5; background: #f0f0ff; }
    .toolbox-item mat-icon { font-size: 16px; width: 16px; height: 16px; color: #666; }
    .toolbox-item:active { cursor: grabbing; }

    /* 数据源面板 */
    .datasource-list { padding: 8px; }
    .ds-section-title { font-size: 11px; color: #999; font-weight: 600; text-transform: uppercase; margin-bottom: 6px; padding: 0 4px; }
    .ds-field {
      display: flex; align-items: center; gap: 8px;
      padding: 5px 8px; background: white; border: 1px solid #e8e8e8;
      border-radius: 4px; margin-bottom: 4px; cursor: grab; font-size: 12px;
    }
    .ds-field:hover { border-color: #4caf50; background: #f8fff8; }
    .ds-field-icon { font-size: 14px; width: 14px; height: 14px; color: #4caf50; }
    .ds-field-info { display: flex; flex-direction: column; flex: 1; }
    .ds-field-name { font-size: 12px; color: #333; }
    .ds-field-type { font-size: 10px; color: #999; }
    .ds-agg { border-color: #ff9800; }
    .ds-agg .ds-field-icon { color: #ff9800; }
    .ds-empty { display: flex; flex-direction: column; align-items: center; padding: 24px 16px; color: #999; text-align: center; }
    .ds-empty mat-icon { font-size: 32px; width: 32px; height: 32px; margin-bottom: 8px; }
    .ds-empty-hint { font-size: 11px; margin-top: 4px; }

    /* 带区面板 */
    .bands-list { padding: 8px; display: flex; flex-direction: column; gap: 4px; }
    .band-item {
      display: flex; align-items: center; gap: 8px;
      padding: 6px 8px; background: white; border: 1px solid #e0e0e0;
      border-radius: 4px; cursor: pointer; font-size: 12px;
    }
    .band-item:hover { border-color: #3f51b5; }
    .band-active { border-color: #3f51b5 !important; background: #f0f4ff; }
    .band-icon { font-size: 16px; width: 16px; height: 16px; color: #666; }
    .band-info { display: flex; flex-direction: column; flex: 1; }
    .band-type { font-size: 11px; color: #999; }
    .band-label { font-size: 12px; color: #333; font-weight: 500; }
    .band-actions { opacity: 0; transition: opacity 0.15s; }
    .band-item:hover .band-actions { opacity: 1; }
    .band-toggle-btn { width: 24px; height: 24px; line-height: 24px; }
    .band-toggle-btn mat-icon { font-size: 14px; width: 14px; height: 14px; }

    /* 画布 */
    .designer-canvas-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: #e8e8e8;
      position: relative;
    }
    .canvas-rulers { position: relative; height: 24px; background: #f0f0f0; border-bottom: 1px solid #ccc; }
    .ruler { position: absolute; display: flex; overflow: hidden; }
    .ruler-h { top: 0; left: 24px; right: 0; height: 24px; }
    .ruler-v { top: 24px; left: 0; bottom: 0; width: 24px; flex-direction: column; }
    .tick { position: absolute; font-size: 9px; color: #999; }
    .ruler-h .tick { border-left: 1px solid #ccc; padding-left: 2px; }
    .ruler-v .tick { border-top: 1px solid #ccc; padding-top: 1px; }

    .canvas-scroll { flex: 1; overflow: auto; padding: 40px; background: #e8e8e8; }
    .page-margin { display: inline-block; transform-origin: top left; }

    .page-canvas {
      position: relative;
      user-select: none;
    }

    /* 带区 */
    .canvas-band {
      position: relative;
      border: 1px dashed transparent;
      transition: border-color 0.15s;
      box-sizing: border-box;
    }
    .canvas-band:hover { border-color: #c0c0e0; }
    .band-active { border-color: #3f51b5 !important; background: rgba(63,81,181,0.03); }

    .band-label-overlay {
      position: absolute;
      top: -14px;
      left: 0;
      font-size: 10px;
      color: #999;
      pointer-events: none;
      z-index: 0;
    }

    /* 报表项 */
    .canvas-item {
      position: absolute;
      cursor: move;
      box-sizing: border-box;
      border: 1px solid transparent;
      border-radius: 2px;
      transition: border-color 0.1s;
      overflow: hidden;
    }
    .canvas-item:hover { border-color: #90a4ae; }
    .item-selected {
      border: 2px solid #3f51b5 !important;
      box-shadow: 0 0 0 2px rgba(63,81,181,0.2);
    }
    .item-content {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      padding: 2px 4px;
      font-size: 11px;
      color: #333;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      box-sizing: border-box;
    }

    /* 选中状态 */
    .resize-handles .resize-handle {
      position: absolute;
      width: 8px;
      height: 8px;
      background: white;
      border: 1px solid #3f51b5;
      border-radius: 1px;
      z-index: 10;
    }
    .resize-handle.n  { top: -4px;  left: 50%; transform: translateX(-50%); cursor: n-resize; }
    .resize-handle.s  { bottom: -4px; left: 50%; transform: translateX(-50%); cursor: s-resize; }
    .resize-handle.e  { right: -4px; top: 50%; transform: translateY(-50%); cursor: e-resize; }
    .resize-handle.w  { left: -4px;  top: 50%; transform: translateY(-50%); cursor: w-resize; }
    .resize-handle.ne { top: -4px;  right: -4px;  cursor: ne-resize; }
    .resize-handle.nw { top: -4px;  left: -4px;   cursor: nw-resize; }
    .resize-handle.se { bottom: -4px; right: -4px; cursor: se-resize; }
    .resize-handle.sw { bottom: -4px; left: -4px;  cursor: sw-resize; }

    .item-delete-btn {
      position: absolute;
      top: -10px;
      right: -10px;
      width: 20px;
      height: 20px;
      background: #f44336;
      color: white;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 20;
      padding: 0;
      line-height: 20px;
    }
    .item-delete-btn mat-icon { font-size: 14px; width: 14px; height: 14px; }

    /* 拖拽占位符 */
    .cdk-drag-placeholder {
      background: rgba(63,81,181,0.1);
      border: 2px dashed #3f51b5;
      border-radius: 2px;
      opacity: 0.5;
    }

    /* 右侧属性面板 */
    .designer-right {
      width: 280px;
      border-left: 1px solid #e0e0e0;
      background: #fafafa;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      flex-shrink: 0;
    }
    .right-tabs { flex: 1; display: flex; flex-direction: column; }
    ::ng-deep .right-tabs .mat-mdc-tab-body-wrapper { flex: 1; overflow: auto; }
    ::ng-deep .right-tabs .mat-mdc-tab-header { min-height: 36px; }

    .props-panel { padding: 12px; }
    .prop-section {
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #eee;
    }
    .prop-section-title {
      font-size: 11px;
      font-weight: 600;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 8px;
      letter-spacing: 0.5px;
    }
    .prop-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; min-height: 28px; }
    .prop-row label { width: 70px; font-size: 12px; color: #666; flex-shrink: 0; }
    .prop-input {
      flex: 1;
      height: 28px;
      padding: 0 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 12px;
      font-family: inherit;
      background: white;
    }
    .prop-input.small { width: 70px; flex: none; }
    .prop-input:focus { border-color: #3f51b5; outline: none; }
    .prop-textarea { width: 100%; padding: 6px 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px; font-family: inherit; resize: vertical; }
    .prop-textarea.mono { font-family: 'Consolas', 'Courier New', monospace; font-size: 11px; }
    .prop-select { flex: 1; height: 28px; padding: 0 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px; font-family: inherit; background: white; }
    .prop-badge { background: #e8eaf6; color: #3f51b5; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }
    .prop-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .prop-field { display: flex; flex-direction: column; gap: 2px; }
    .prop-field label { width: auto; font-size: 10px; }
    .prop-hint { font-size: 11px; color: #999; }
    .prop-empty { font-size: 12px; color: #999; padding: 16px; text-align: center; }
    .props-empty { display: flex; flex-direction: column; align-items: center; padding: 32px 16px; color: #999; text-align: center; }
    .props-empty mat-icon { font-size: 32px; width: 32px; height: 32px; margin-bottom: 8px; }
    .props-empty p { font-size: 12px; margin: 0; }
    .expr-hint { font-size: 10px; color: #999; margin-top: 4px; padding: 4px 8px; background: #f5f5f5; border-radius: 4px; }

    /* 对齐按钮 */
    .align-buttons { display: flex; gap: 2px; }
    .align-btn {
      width: 28px; height: 28px;
      display: flex; align-items: center; justify-content: center;
      border: 1px solid #ddd; border-radius: 4px; background: white;
      cursor: pointer; padding: 0;
    }
    .align-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .align-btn:hover { border-color: #3f51b5; }
    .align-btn.active { background: #e8eaf6; border-color: #3f51b5; }
    .align-grid { display: grid; grid-template-columns: repeat(4, 28px); gap: 4px; }
    .grid-btn {
      width: 28px; height: 28px;
      display: flex; align-items: center; justify-content: center;
      border: 1px solid #ddd; border-radius: 4px; background: white;
      cursor: pointer; padding: 0;
    }
    .grid-btn mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .grid-btn:hover { border-color: #3f51b5; background: #f0f0ff; }

    /* 样式管理 */
    .styles-panel { padding: 12px; display: flex; flex-direction: column; gap: 8px; }
    .style-card { background: white; border: 1px solid #e0e0e0; border-radius: 4px; overflow: hidden; }
    .style-card-header { padding: 6px 10px; background: #f5f5f5; font-size: 12px; border-bottom: 1px solid #eee; }
    .style-card-body { padding: 6px 10px; display: flex; gap: 12px; font-size: 11px; color: #666; }
    .color-swatch { display: inline-block; width: 12px; height: 12px; border-radius: 2px; vertical-align: middle; border: 1px solid #ddd; }

    /* 方向切换 */
    .orientation-toggle { display: flex; gap: 4px; }
    .orientation-toggle button {
      display: flex; align-items: center; gap: 4px;
      padding: 4px 10px; border: 1px solid #ddd; border-radius: 4px;
      background: white; cursor: pointer; font-size: 12px; font-family: inherit;
    }
    .orientation-toggle button mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .orientation-toggle button.active { background: #e8eaf6; border-color: #3f51b5; color: #3f51b5; }

    /* 删除按钮 */
    .delete-item-btn { width: 100%; margin-top: 16px; }

    /* 预览模式 */
    .preview-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #e0e0e0;
      overflow: hidden;
    }
    .preview-toolbar {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 8px 16px;
      background: #fafafa;
      border-bottom: 1px solid #e0e0e0;
    }
    .preview-pages {
      flex: 1;
      overflow: auto;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 24px;
      align-items: center;
    }
    .preview-page-wrapper { display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .preview-page-label { font-size: 11px; color: #666; }
    .preview-page {
      background: white;
      box-shadow: 0 2px 12px rgba(0,0,0,0.2);
      position: relative;
      overflow: hidden;
    }
    .preview-section { position: relative; box-sizing: border-box; }
    .preview-row { display: flex; align-items: center; }
    .preview-cell { flex-shrink: 0; box-sizing: border-box; font-size: 12px; overflow: hidden; }
    .preview-page-number {
      position: absolute;
      bottom: 8px;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 11px;
      color: #999;
    }

    /* 分隔线 */
    mat-divider[vertical] {
      height: 24px;
      margin: 0 4px;
      vertical-align: middle;
    }
  `]
})
export class ReportDesignerComponent implements OnInit, OnDestroy {
  // ══════════════════════════════════════════════════════════════
  // 输入/输出
  // ══════════════════════════════════════════════════════════════

  datastore = input<DataStoreImpl | null>(null);
  templateInput = input<ReportTemplate | null>(null, { alias: 'template' });

  templateChange = output<ReportTemplate>();
  previewChange = output<ReportPages | null>();

  // ══════════════════════════════════════════════════════════════
  // 状态
  // ══════════════════════════════════════════════════════════════

  template = signal<ReportTemplate>(createEmptyTemplate('新报表'));
  selectedItemId = signal<string | null>(null);
  activeBandId = signal<string>('report-header-1');
  zoom = signal(100);
  previewMode = signal(false);
  previewPages = signal<ReportPages | null>(null);

  // ══════════════════════════════════════════════════════════════
  // 工具箱配置
  // ══════════════════════════════════════════════════════════════

  toolboxItems: ToolboxItem[] = [
    { type: 'text', label: '文本', icon: 'text_fields', description: '静态文本' },
    { type: 'field', label: '数据字段', icon: 'data_object', description: '绑定到数据列' },
    { type: 'computed', label: '计算字段', icon: 'calculate', description: '表达式计算' },
    { type: 'line', label: '线条', icon: 'horizontal_rule', description: '分隔线' },
    { type: 'rectangle', label: '矩形', icon: 'crop_square', description: '矩形框' },
    { type: 'image', label: '图片', icon: 'image', description: '图片' },
    { type: 'barcode', label: '条形码', icon: 'qr_code', description: '条形码' },
    { type: 'qrcode', label: '二维码', icon: 'qr_code_2', description: '二维码' },
    { type: 'chart', label: '图表', icon: 'bar_chart', description: '图表' },
    { type: 'table', label: '表格', icon: 'table_chart', description: '数据表格' },
  ];

  chartTypes = [
    { value: 'bar', label: '柱状图' },
    { value: 'line', label: '折线图' },
    { value: 'pie', label: '饼图' },
    { value: 'doughnut', label: '环形图' },
    { value: 'radar', label: '雷达图' },
    { value: 'scatter', label: '散点图' },
  ];

  barcodeFormats = ['CODE128', 'CODE39', 'EAN13', 'EAN8', 'UPC', 'ITF', 'CODABAR', 'CODE93'];

  aggregationTypes = ['SUM', 'AVG', 'COUNT', 'MIN', 'MAX', 'FIRST', 'LAST'];

  alignOptions = [
    { value: 'left', icon: 'format_align_left' },
    { value: 'center', icon: 'format_align_center' },
    { value: 'right', icon: 'format_align_right' },
  ];

  // ══════════════════════════════════════════════════════════════
  // 计算属性
  // ══════════════════════════════════════════════════════════════

  fields = computed(() => {
    const store = this.datastore();
    if (!store) return [];
    const cols = (store as any)._state?.columns ?? [];
    return cols.map((c: any) => ({ name: c.field, label: c.header ?? c.field, dataType: 'string' }));
  });

  activeBandItems = computed(() => {
    const bandId = this.activeBandId();
    const tpl = this.template();
    return tpl.bands.find(b => b.id === bandId)?.items ?? [];
  });

  selectedItem = computed(() => {
    const id = this.selectedItemId();
    if (!id) return null;
    for (const band of this.template().bands) {
      const item = band.items.find(i => i.id === id);
      if (item) return item;
    }
    return null;
  });

  styleNames = computed(() => Object.keys(this.template().styles ?? {}));

  allStyles = computed(() => Object.values(this.template().styles ?? {}));

  pageWidth = computed(() => {
    const m = this.template().page.margin;
    const dpi = 96;
    const mmToPx = (mm: number) => Math.round(mm / 25.4 * dpi);
    const paper = this.template().page.paperSize;
    const isLand = this.template().page.orientation === 'landscape';
    let w = mmToPx(paper === 'A4' ? 210 : paper === 'A3' ? 297 : 148);
    let h = mmToPx(paper === 'A4' ? 297 : paper === 'A3' ? 420 : 210);
    if (isLand) [w, h] = [h, w];
    return w - mmToPx(m.left + m.right);
  });

  pageHeight = computed(() => {
    const m = this.template().page.margin;
    const dpi = 96;
    const mmToPx = (mm: number) => Math.round(mm / 25.4 * dpi);
    const paper = this.template().page.paperSize;
    const isLand = this.template().page.orientation === 'landscape';
    let w = mmToPx(paper === 'A4' ? 210 : paper === 'A3' ? 297 : 148);
    let h = mmToPx(paper === 'A4' ? 297 : paper === 'A3' ? 420 : 210);
    if (isLand) [w, h] = [h, w];
    return h - mmToPx(m.top + m.bottom);
  });

  hTicks = computed(() => {
    const w = this.pageWidth();
    const ticks: number[] = [];
    for (let i = 0; i <= w; i += 50) ticks.push(i);
    return ticks;
  });

  vTicks = computed(() => {
    const h = this.pageHeight();
    const ticks: number[] = [];
    for (let i = 0; i <= h; i += 50) ticks.push(i);
    return ticks;
  });

  yFieldsInput = '';

  // ══════════════════════════════════════════════════════════════
  // 拖拽状态（用于画布内移动）
  // ══════════════════════════════════════════════════════════════

  private _dragState: {
    item: ReportItem;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    mode: 'move' | 'resize';
    dir?: string;
  } | null = null;

  private _snackBar = inject(MatSnackBar);
  private _reportEngine = new ReportEngine();

  ngOnInit(): void {
    // 同步外部 template 输入
    const tpl = this.templateInput();
    if (tpl) {
      this.template.set(tpl);
    }
    // 监听键盘快捷键
    document.addEventListener('keydown', this._onKeyDown);
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this._onKeyDown);
  }

  // ══════════════════════════════════════════════════════════════
  // 工具栏操作
  // ══════════════════════════════════════════════════════════════

  onNew(): void {
    this.template.set(createEmptyTemplate('新报表'));
    this.selectedItemId.set(null);
    this.previewPages.set(null);
    this._snackBar.open('已新建空白报表', '关闭', { duration: 2000 });
  }

  onOpen(): void {
    const json = prompt('粘贴报表模板 JSON：');
    if (!json) return;
    try {
      const tpl = JSON.parse(json) as ReportTemplate;
      this.template.set(tpl);
      this._snackBar.open('模板加载成功', '关闭', { duration: 2000 });
    } catch {
      this._snackBar.open('JSON 格式错误，请检查', '关闭', { duration: 3000 });
    }
  }

  onSave(): void {
    const json = JSON.stringify(this.template(), null, 2);
    // 触发输出事件，父组件负责保存
    this.templateChange.emit(this.template());

    // 同时复制到剪贴板
    navigator.clipboard.writeText(json).then(() => {
      this._snackBar.open('模板已复制到剪贴板', '关闭', { duration: 2000 });
    }).catch(() => {
      this._snackBar.open('模板已更新', '关闭', { duration: 2000 });
    });
  }

  onExport(): void {
    this.togglePreview();
  }

  togglePreview(): void {
    const store = this.datastore();
    if (!store) {
      this._snackBar.open('请先绑定 DataStore', '关闭', { duration: 2000 });
      return;
    }

    if (!this.previewMode()) {
      const pages = this._reportEngine.render(this.template(), store, {});
      this.previewPages.set(pages);
      this.previewChange.emit(pages);
    }
    this.previewMode.update(v => !v);
  }

  exportPdf(): void {
    this._snackBar.open('PDF 导出功能开发中', '关闭', { duration: 2000 });
  }

  exportExcel(): void {
    this._snackBar.open('Excel 导出功能开发中', '关闭', { duration: 2000 });
  }

  zoomIn(): void { this.zoom.update(z => Math.min(z + 10, 200)); }
  zoomOut(): void { this.zoom.update(z => Math.max(z - 10, 30)); }
  zoomFit(): void { this.zoom.set(100); }

  showHelp(): void {
    this._snackBar.open('拖拽工具箱中的组件到画布即可添加 | 点击选中后可编辑属性 | Delete键删除选中项', '关闭', { duration: 5000 });
  }

  // ══════════════════════════════════════════════════════════════
  // 工具箱拖放 → 画布
  // ══════════════════════════════════════════════════════════════

  onToolboxDrop(event: CdkDragDrop<string>): void {
    const type = event.item.data as ReportItemType;
    const bandId = this.activeBandId();
    const band = this.template().bands.find(b => b.id === bandId);
    if (!band) return;

    const item = this._createItem(type, bandId);
    band.items.push(item);
    this.selectedItemId.set(item.id);
    this.template.update(t => ({ ...t })); // 触发更新
  }

  onFieldDropToCanvas(event: CdkDragDrop<any>): void {
    const dragData = event.item.data;
    const bandId = this.activeBandId();
    const band = this.template().bands.find(b => b.id === bandId);
    if (!band) return;

    let item: ReportItem;
    if (dragData.type === 'field') {
      item = this._createItem('field', bandId);
      item.config = { type: 'field', field: dragData.field, align: 'left', nullText: '' };
    } else if (dragData.type === 'computed') {
      item = this._createItem('computed', bandId);
      item.config = {
        type: 'computed',
        expression: `{${dragData.func}(${dragData.field ?? 'field_name'})}`,
        dataType: 'number',
      };
    } else {
      return;
    }

    // 放在鼠标位置
    item.x = 10;
    item.y = 5;
    item.width = 150;
    item.height = 25;

    band.items.push(item);
    this.selectedItemId.set(item.id);
    this.template.update(t => ({ ...t }));
  }

  onCanvasDrop(event: CdkDragDrop<ReportItem[]>): void {
    // 同带区内排序（暂时不实现）
  }

  // ══════════════════════════════════════════════════════════════
  // 画布交互
  // ══════════════════════════════════════════════════════════════

  selectBand(bandId: string): void {
    this.activeBandId.set(bandId);
  }

  selectItem(id: string, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedItemId.set(id);
  }

  deselectAll(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('page-canvas') ||
        (event.target as HTMLElement).classList.contains('canvas-band')) {
      this.selectedItemId.set(null);
    }
  }

  toggleBandVisibility(band: ReportBand, event: MouseEvent): void {
    event.stopPropagation();
    band.visible = band.visible === false ? true : false;
    this.template.update(t => ({ ...t }));
  }

  onItemMouseDown(event: MouseEvent, item: ReportItem): void {
    if (event.button !== 0) return;
    event.preventDefault();

    this._dragState = {
      item,
      startX: event.clientX,
      startY: event.clientY,
      origX: item.x,
      origY: item.y,
      mode: 'move',
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!this._dragState) return;
      const dx = (e.clientX - this._dragState.startX) * 100 / this.zoom();
      const dy = (e.clientY - this._dragState.startY) * 100 / this.zoom();
      this._dragState.item.x = Math.max(0, this._dragState.origX + dx);
      this._dragState.item.y = Math.max(0, this._dragState.origY + dy);
      this.template.update(t => ({ ...t }));
    };

    const onMouseUp = () => {
      this._dragState = null;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  onResize(event: MouseEvent, item: ReportItem, dir: string): void {
    event.stopPropagation();
    event.preventDefault();

    const startX = event.clientX;
    const startY = event.clientY;
    const origW = item.width;
    const origH = item.height;

    const onMouseMove = (e: MouseEvent) => {
      const dx = (e.clientX - startX) * 100 / this.zoom();
      const dy = (e.clientY - startY) * 100 / this.zoom();

      if (dir.includes('e')) item.width = Math.max(20, origW + dx);
      if (dir.includes('w')) { item.x += dx; item.width = Math.max(20, origW - dx); }
      if (dir.includes('s')) item.height = Math.max(15, origH + dy);
      if (dir.includes('n')) { item.y += dy; item.height = Math.max(15, origH - dy); }

      this.template.update(t => ({ ...t }));
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  deleteItem(id: string, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    for (const band of this.template().bands) {
      const idx = band.items.findIndex(i => i.id === id);
      if (idx >= 0) {
        band.items.splice(idx, 1);
        if (this.selectedItemId() === id) this.selectedItemId.set(null);
        this.template.update(t => ({ ...t }));
        return;
      }
    }
  }

  onItemGeometryChange(item: ReportItem): void {
    this.template.update(t => ({ ...t }));
  }

  // ══════════════════════════════════════════════════════════════
  // 对齐辅助
  // ══════════════════════════════════════════════════════════════

  alignItem(item: ReportItem, mode: string): void {
    const pw = this.pageWidth();
    const ph = this.pageHeight();

    switch (mode) {
      case 'left': item.x = 0; break;
      case 'right': item.x = pw - item.width; break;
      case 'center-h': item.x = (pw - item.width) / 2; break;
      case 'top': item.y = 0; break;
      case 'bottom': item.y = ph - item.height; break;
      case 'middle': item.y = (ph - item.height) / 2; break;
    }
    this.template.update(t => ({ ...t }));
  }

  // ══════════════════════════════════════════════════════════════
  // 页面设置
  // ══════════════════════════════════════════════════════════════

  setOrientation(orientation: 'portrait' | 'landscape'): void {
    this.template.update(t => ({
      ...t,
      page: { ...t.page, orientation },
    }));
  }

  // ══════════════════════════════════════════════════════════════
  // 图表 Y 轴字段
  // ══════════════════════════════════════════════════════════════

  updateChartYFields(input: string): void {
    const item = this.selectedItem();
    if (!item || item.type !== 'chart') return;
    const fields = input.split(',').map(s => s.trim()).filter(Boolean);
    (item.config as any).yFields = fields;
  }

  // ══════════════════════════════════════════════════════════════
  // 辅助方法
  // ══════════════════════════════════════════════════════════════

  getCanvasTransform(): string {
    return `scale(${this.zoom() / 100})`;
  }

  getBandIcon(type: BandType): string {
    const map: Record<BandType, string> = {
      'page-header': 'vertical_align_top',
      'report-header': 'first_page',
      'group-header': 'view_agenda',
      'data': 'table_rows',
      'group-footer': 'view_agenda',
      'report-footer': 'last_page',
      'page-footer': 'vertical_align_bottom',
    };
    return map[type] ?? 'horizontal_rule';
  }

  getItemPreviewText(item: ReportItem): string {
    const cfg = item.config as any;
    switch (item.type) {
      case 'text': return cfg.text ?? '文本';
      case 'field': return `{${cfg.field ?? '?'}}`;
      case 'computed': return cfg.expression ?? '={?}';
      case 'line': return '─────';
      case 'rectangle': return '[ 矩形 ]';
      case 'image': return '[ 图片 ]';
      case 'barcode': return `[ ${cfg.format ?? 'CODE128'} ]`;
      case 'qrcode': return '[ 二维码 ]';
      case 'chart': return `[ ${cfg.chartType ?? 'bar'} 图 ]`;
      case 'table': return '[ 数据表格 ]';
      case 'page-break': return '↵ 分页';
      default: return item.type;
    }
  }

  calcTableColWidths(item: ReportItem): number {
    const cfg = item.config as any;
    if (!cfg.columns) return 0;
    return cfg.columns.reduce((s: number, c: any) => s + (parseInt(c.width) || 100), 0);
  }

  getItemWidth(item: ReportItem): number { return item.width; }
  getItemHeight(item: ReportItem): number { return item.height; }

  // ══════════════════════════════════════════════════════════════
  // 键盘快捷键
  // ══════════════════════════════════════════════════════════════

  private _onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const id = this.selectedItemId();
      if (id) this.deleteItem(id);
    }
    if (e.key === 'Escape') {
      this.selectedItemId.set(null);
    }
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      this.onSave();
    }
  };

  // ══════════════════════════════════════════════════════════════
  // 创建新报表项
  // ══════════════════════════════════════════════════════════════

  private _idCounter = 0;
  private _genId(): string {
    return `item_${Date.now()}_${++this._idCounter}`;
  }

  private _createItem(type: ReportItemType, bandId: string): ReportItem {
    const defaults: Record<ReportItemType, Partial<ReportItem>> = {
      text: { width: 200, height: 30, config: { type: 'text', text: '新文本', fontSize: 12, fontWeight: 'normal', align: 'left' } },
      field: { width: 120, height: 25, config: { type: 'field', field: '', align: 'left', nullText: '' } },
      computed: { width: 150, height: 25, config: { type: 'computed', expression: '{}', dataType: 'string' } },
      image: { width: 120, height: 80, config: { type: 'image', source: 'url', url: '', fit: 'contain' } },
      line: { width: 200, height: 2, config: { type: 'line', direction: 'horizontal', thickness: 1, style: 'solid', color: '#000' } },
      rectangle: { width: 100, height: 60, config: { type: 'rectangle', fill: 'transparent', border: { width: 1, color: '#000' } } },
      barcode: { width: 200, height: 60, config: { type: 'barcode', format: 'CODE128', value: 'field_name', showText: true } },
      qrcode: { width: 80, height: 80, config: { type: 'qrcode', value: 'field_name', errorCorrectionLevel: 'M' } },
      chart: { width: 400, height: 250, config: { type: 'chart', chartType: 'bar', xField: '', yFields: [], showLegend: true, showDataLabels: false } },
      table: { width: 600, height: 200, config: { type: 'table', columns: [], dataRow: { alternatingColors: true }, headerRow: { visible: true, height: 30 } } },
      subreport: { width: 400, height: 200, config: { type: 'subreport', parameters: {} } },
      'page-break': { width: 20, height: 20, config: { type: 'page-break' } },
    };

    const def = defaults[type] ?? { width: 100, height: 30, config: { type } };

    return {
      id: this._genId(),
      type,
      bandId,
      x: 10 + (this._idCounter % 5) * 20,
      y: 5,
      ...def,
    } as ReportItem;
  }
}
