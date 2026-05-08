/**
 * Report Designer Demo — ngx-datawindow
 *
 * 演示如何在 Angular 应用中使用报表设计器
 *
 * 使用方式：
 *   1. 将此组件添加到你的 Angular 应用
 *   2. 将 datastoreConfig 替换为你的 DataStore 实例
 *   3. 运行应用，访问 /report-designer 路由
 */
import {
  Component, signal, OnInit,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';

import {
  ReportDesignerComponent,
  ReportTemplate,
  ReportEngine,
  createEmptyTemplate,
  ReportPages,
} from '../report-designer';
import { DataStoreImpl } from '../datastore';

@Component({
  selector: 'dw-report-designer-demo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule, MatTabsModule,
    MatCardModule, MatDividerModule,
    MatTooltipModule, MatDialogModule,
    ReportDesignerComponent,
  ],
  template: `
    <div class="demo-root">

      <!-- Demo Header -->
      <div class="demo-header">
        <div class="demo-header-info">
          <h1>报表设计器 Demo</h1>
          <p>ngx-datawindow 内置可视化报表设计器，支持拖拽布局、数据绑定、图表、导出</p>
        </div>

        <div class="demo-actions">
          <button mat-raised-button color="primary" (click)="openDesigner()">
            <mat-icon>design_services</mat-icon>
            打开设计器
          </button>

          <button mat-stroked-button (click)="loadSampleTemplate()">
            <mat-icon>article</mat-icon>
            加载示例模板
          </button>

          <button mat-stroked-button (click)="runEngineDemo()">
            <mat-icon>play_arrow</mat-icon>
            纯引擎演示
          </button>
        </div>
      </div>

      <!-- Quick Feature Overview -->
      <mat-tab-group class="demo-tabs" animationDuration="200ms">

        <mat-tab label="功能概览">
          <div class="feature-grid">
            <div class="feature-card">
              <mat-icon>drag_indicator</mat-icon>
              <h3>拖拽布局</h3>
              <p>从工具箱拖拽文本、字段、图表等到画布，自由布局</p>
            </div>
            <div class="feature-card">
              <mat-icon>table</mat-icon>
              <h3>数据绑定</h3>
              <p>直接绑定 DataStore 字段，支持表达式计算和聚合</p>
            </div>
            <div class="feature-card">
              <mat-icon>bar_chart</mat-icon>
              <h3>图表支持</h3>
              <p>柱状图、折线图、饼图等，自动从数据生成图表</p>
            </div>
            <div class="feature-card">
              <mat-icon>group_work</mat-icon>
              <h3>分组报表</h3>
              <p>支持多层分组，Group Header/Footer，小计汇总</p>
            </div>
            <div class="feature-card">
              <mat-icon>download</mat-icon>
              <h3>多格式导出</h3>
              <p>PDF、Excel、HTML、JSON，标准化导出接口</p>
            </div>
            <div class="feature-card">
              <mat-icon>history</mat-icon>
              <h3>模板管理</h3>
              <p>JSON 格式存储模板，支持版本管理和模板市场</p>
            </div>
          </div>
        </mat-tab>

        <mat-tab label="快速上手">
          <div class="quickstart">

            <div class="step">
              <div class="step-num">1</div>
              <div class="step-content">
                <h4>安装依赖</h4>
                <pre class="code-block">npm install @angular/material @angular/cdk</pre>
              </div>
            </div>

            <div class="step">
              <div class="step-num">2</div>
              <div class="step-content">
                <h4>导入模块</h4>
                <pre class="code-block">// app.component.ts
import &#123; ReportDesignerComponent &#125; from 'ngx-datawindow/report-designer';

@Component(&#123;
  imports: [ReportDesignerComponent],
&#125;)
export class AppComponent &#123;&#125;</pre>
              </div>
            </div>

            <div class="step">
              <div class="step-num">3</div>
              <div class="step-content">
                <h4>使用组件</h4>
                <pre class="code-block">&lt;!-- 报表设计器（独立窗口模式） --&gt;
&lt;dw-report-designer
  [datastore]="myDataStore"
  [(template)]="reportTemplate"
  (templateChange)="onTemplateChange($event)"
  (previewChange)="onPreview($event)"
/&gt;</pre>
              </div>
            </div>

            <div class="step">
              <div class="step-num">4</div>
              <div class="step-content">
                <h4>保存模板到后端</h4>
                <pre class="code-block">// 保存
const json = JSON.stringify(this.reportTemplate);
this.http.post('/api/reports', json).subscribe();

// 加载
this.http.get&lt;ReportTemplate&gt;('/api/reports/1')
  .subscribe(tpl => this.reportTemplate = tpl);</pre>
              </div>
            </div>

            <div class="step">
              <div class="step-num">5</div>
              <div class="step-content">
                <h4>使用纯渲染引擎（无 UI）</h4>
                <pre class="code-block">const engine = new ReportEngine();
const pages = engine.render(template, dataStore);

// pages.pages[0].sections[0].rows[0].cells[0].text
// → "¥1,234.56"</pre>
              </div>
            </div>

          </div>
        </mat-tab>

        <mat-tab label="代码示例">
          <div class="code-examples">

            <h4>绑定 DataStore 数据</h4>
            <pre class="code-block">{{ example1 }}</pre>

            <h4>自定义报表模板</h4>
            <pre class="code-block">{{ example2 }}</pre>

            <h4>表达式使用示例</h4>
            <pre class="code-block">{{ example3 }}</pre>

            <h4>分组报表配置</h4>
            <pre class="code-block">{{ example4 }}</pre>

          </div>
        </mat-tab>

        <mat-tab label="引擎输出">
          <div class="engine-output">
            @if (engineOutput(); as output) {
              <div class="engine-stats">
                <span>渲染 {{ output.totalPages }} 页</span>
                <span>{{ output.totalRows }} 行数据</span>
                <span>耗时 {{ output.renderTime.toFixed(1) }}ms</span>
              </div>

              @for (page of output.pages; track page.pageNumber) {
                <div class="engine-page">
                  <div class="engine-page-label">Page {{ page.pageNumber }} / {{ output.totalPages }}</div>
                  @for (section of page.sections; track $index) {
                    <div class="engine-section">
                      <span class="engine-section-type">{{ section.band.type }}</span>
                      @for (row of section.rows; track row.index) {
                        @for (cell of row.cells; track $index) {
                          <span class="engine-cell">{{ cell.text }}</span>
                        }
                      }
                    </div>
                  }
                  <div class="engine-page-num">{{ page.pageNumberText }}</div>
                </div>
              }
            } @else {
              <div class="engine-empty">
                <p>点击「纯引擎演示」按钮查看引擎输出</p>
              </div>
            }
          </div>
        </mat-tab>

      </mat-tab-group>

      <!-- 报表设计器（覆盖层模式） -->
      @if (showDesigner()) {
        <div class="designer-overlay">
          <div class="designer-container">
            <div class="designer-header">
              <h3>报表设计器</h3>
              <button mat-icon-button (click)="showDesigner.set(false)">
                <mat-icon>close</mat-icon>
              </button>
            </div>
            <dw-report-designer
              [datastore]="dataStore()"
              [template]="currentTemplate()"
              (templateChange)="onTemplateChange($event)"
              (templateChange)="onTemplateChange($event)"
              (previewChange)="onPreview($event)"
            />
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .demo-root {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    .demo-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      background: linear-gradient(135deg, #3f51b5, #5c6bc0);
      color: white;
      flex-shrink: 0;
    }
    .demo-header h1 {
      margin: 0 0 4px;
      font-size: 20px;
      font-weight: 600;
    }
    .demo-header p {
      margin: 0;
      font-size: 13px;
      opacity: 0.9;
    }
    .demo-actions { display: flex; gap: 8px; }

    .demo-tabs { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    ::ng-deep .demo-tabs .mat-mdc-tab-body-wrapper { flex: 1; overflow: auto; }

    .feature-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      padding: 24px;
    }
    .feature-card {
      background: white;
      border: 1px solid #e8e8e8;
      border-radius: 8px;
      padding: 20px;
    }
    .feature-card mat-icon { font-size: 32px; width: 32px; height: 32px; color: #3f51b5; margin-bottom: 8px; }
    .feature-card h3 { margin: 0 0 8px; font-size: 14px; font-weight: 600; }
    .feature-card p { margin: 0; font-size: 12px; color: #666; line-height: 1.5; }

    .quickstart { padding: 24px; max-width: 700px; }
    .step { display: flex; gap: 16px; margin-bottom: 24px; }
    .step-num {
      width: 32px; height: 32px; background: #3f51b5; color: white;
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      font-weight: bold; flex-shrink: 0;
    }
    .step-content h4 { margin: 0 0 8px; font-size: 14px; font-weight: 600; }
    .code-block {
      background: #1e1e1e; color: #d4d4d4;
      padding: 12px 16px; border-radius: 6px;
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 12px; line-height: 1.6;
      overflow-x: auto;
      margin: 0;
    }

    .code-examples { padding: 24px; max-width: 800px; }
    .code-examples h4 { font-size: 13px; font-weight: 600; margin: 0 0 8px; }
    .code-examples .code-block { margin-bottom: 16px; }

    .engine-output { padding: 24px; }
    .engine-stats {
      display: flex; gap: 24px; margin-bottom: 16px;
      font-size: 13px; color: #666;
    }
    .engine-page {
      background: white; border: 1px solid #ddd; border-radius: 4px;
      padding: 16px; margin-bottom: 12px; position: relative;
    }
    .engine-page-label { font-size: 11px; color: #999; margin-bottom: 8px; }
    .engine-section {
      display: flex; gap: 8px; flex-wrap: wrap;
      padding: 6px 0; border-bottom: 1px solid #f0f0f0;
    }
    .engine-section-type { font-size: 10px; color: #999; font-weight: 600; min-width: 80px; }
    .engine-cell { background: #f5f5f5; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
    .engine-page-num { text-align: center; font-size: 11px; color: #999; margin-top: 8px; }
    .engine-empty { padding: 40px; text-align: center; color: #999; }

    /* 设计器覆盖层 */
    .designer-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.6); z-index: 1000;
      display: flex; align-items: stretch;
    }
    .designer-container {
      flex: 1; background: white; display: flex; flex-direction: column;
      margin: 20px; border-radius: 8px; overflow: hidden;
    }
    .designer-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 16px; background: #f5f5f5; border-bottom: 1px solid #e0e0e0;
    }
    .designer-header h3 { margin: 0; font-size: 15px; }
  `]
})
export class ReportDesignerDemoComponent implements OnInit {

  dataStore = signal<DataStoreImpl | null>(null);
  showDesigner = signal(false);
  currentTemplate = signal<ReportTemplate>(createEmptyTemplate('销售报表'));
  engineOutput = signal<ReportPages | null>(null);

  // ── 代码示例文本 ────────────────────────────────────────────

  example1 = `
// 方式一：注入 DataStore
import { DataStoreImpl } from 'ngx-datawindow';

export class MyComponent {
  store = inject(DataStoreImpl);

  template = createEmptyTemplate('我的报表');
}

// 方式二：通过 input 传入
<dw-report-designer [datastore]="store" />
`;

  example2 = `
const template: ReportTemplate = {
  version: '1.0.0',
  meta: { name: '销售汇总', author: 'Admin' },
  page: {
    paperSize: 'A4', orientation: 'landscape',
    margin: { top: 15, right: 15, bottom: 15, left: 15 },
    printPageNumber: true,
  },
  bands: [
    {
      id: 'rh1', type: 'report-header', height: 60, items: [
        { id: 't1', type: 'text', x: 0, y: 10, width: 800, height: 40,
          config: { type: 'text', text: '月度销售汇总', fontSize: 22, fontWeight: 'bold', align: 'center' } }
      ]
    },
    {
      id: 'ph1', type: 'page-header', height: 35, items: [
        { id: 'f1', type: 'field', x: 0, y: 5, width: 120, height: 25,
          config: { type: 'field', field: 'order_no', align: 'center' } },
        { id: 'f2', type: 'field', x: 130, y: 5, width: 120, height: 25,
          config: { type: 'field', field: 'amount', format: '¥#,##0.00', align: 'right' } },
      ]
    },
    {
      id: 'd1', type: 'data', height: 28, items: [
        { id: 'fd1', type: 'field', x: 0, y: 2, width: 120, height: 24,
          config: { type: 'field', field: 'order_no' } },
        { id: 'fd2', type: 'field', x: 130, y: 2, width: 120, height: 24,
          config: { type: 'field', field: 'amount', format: '¥#,##0.00', align: 'right' } },
      ]
    },
    {
      id: 'rf1', type: 'report-footer', height: 40, items: [
        { id: 'cf1', type: 'computed', x: 0, y: 5, width: 120, height: 25,
          config: { type: 'computed', expression: '{SUM(amount)}',
                    format: '¥#,##0.00', dataType: 'currency' } },
      ]
    }
  ],
  groups: [],
  styles: {},
  dataSource: { name: 'SalesData', type: 'datastore', fields: [], autoLoadData: true, dataScope: 'all' },
  parameters: [], sort: [],
};
`;

  example3 = `
// 数据字段绑定
{order_no}          // → 取 order_no 字段值
{amount | #,##0.00} // → 取字段值并格式化

// 聚合（只能在 report-footer / group-footer 使用）
{SUM(amount)}       // 求和
{AVG(amount)}       // 平均
{COUNT()}           // 记录数
{MAX(amount)}       // 最大值
{MIN(amount)}       // 最小值

// 条件表达式
{IIF(amount > 1000, '高', '普通')}  // 条件判断
{amount * 1.06}                     // 数学运算

// 字符串函数
{UPPER(customer_name)}  // 大写
{TRIM(remark)}         // 去空格
{LEN(description)}     // 长度

// 日期函数
{YEAR(create_time)}    // 年份
{TODAY()}              // 今天日期
`;

  example4 = `
// 在模板中添加分组配置
groups: [
  {
    id: 'g1',
    field: 'department',
    label: '部门',
    showCount: true,
    countTemplate: '({count} 人)',
    sort: 'asc',
  }
],

// 对应添加 group-header 和 group-footer 带区
bands: [
  // 分组头
  {
    id: 'gh1', type: 'group-header', groupId: 'g1', height: 30, items: [
      { id: 'gh-label', type: 'computed', x: 0, y: 5, width: 200, height: 25,
        config: {
          type: 'computed',
          expression: '{department} + " 部门"',
        }
      }
    ]
  },
  // 数据行（自动按分组重复）
  { id: 'd1', type: 'data', height: 28, items: [...] },
  // 分组尾（小计）
  {
    id: 'gf1', type: 'group-footer', groupId: 'g1', height: 35, items: [
      { id: 'gf-sum', type: 'computed', x: 0, y: 5, width: 200, height: 25,
        config: {
          type: 'computed',
          expression: '{SUM(amount)}',
          format: '¥#,##0.00',
          dataType: 'currency',
        }
      }
    ]
  }
]
`;

  // ── 生命周期 ─────────────────────────────────────────────────

  ngOnInit(): void {
    // 创建模拟 DataStore
    this._initDataStore();
  }

  // ── 方法 ─────────────────────────────────────────────────────

  private _initDataStore(): void {
    try {
      // 实际使用中从父组件传入或注入
      // 这里创建一个模拟的 DataStore
      this.dataStore.set(null as any); // 演示时设为 null，引擎会优雅处理
    } catch (e) {
      console.warn('DataStore not initialized:', e);
    }
  }

  openDesigner(): void {
    this.showDesigner.set(true);
  }

  loadSampleTemplate(): void {
    // 使用内嵌的示例模板
    this.currentTemplate.set(this._buildSampleTemplate());
  }

  runEngineDemo(): void {
    try {
      const engine = new ReportEngine();
      const store = this.dataStore();

      // 构造模拟数据用于演示
      const mockStore = this._createMockDataStore();
      const pages = engine.render(this.currentTemplate(), mockStore);
      this.engineOutput.set(pages);
    } catch (e) {
      console.error('Engine demo failed:', e);
    }
  }

  onTemplateChange(template: ReportTemplate): void {
    this.currentTemplate.set(template);
    console.log('[Report Designer] Template saved:', template.meta?.name);
  }

  onPreview(pages: ReportPages | null): void {
    if (pages) {
      console.log(`[Report Designer] Preview: ${pages.totalPages} pages, ${pages.totalRows} rows`);
    }
  }

  // ── 私有 ─────────────────────────────────────────────────────

  private _createMockDataStore(): DataStoreImpl {
    // 创建一个有数据的模拟 DataStore
    // 实际使用时用真实 DataStore
    const mockRows = [
      { order_no: 'ORD-001', customer: '张三', amount: 1234.56, dept: '销售部', create_time: '2026-05-01' },
      { order_no: 'ORD-002', customer: '李四', amount: 8900.00, dept: '销售部', create_time: '2026-05-02' },
      { order_no: 'ORD-003', customer: '王五', amount: 456.78, dept: '市场部', create_time: '2026-05-03' },
      { order_no: 'ORD-004', customer: '赵六', amount: 2340.00, dept: '销售部', create_time: '2026-05-04' },
      { order_no: 'ORD-005', customer: '孙七', amount: 567.90, dept: '市场部', create_time: '2026-05-05' },
    ];

    // 创建一个最小化的 DataStore-like 对象
    // 注意：实际需要完整的 DataStoreImpl 实例
    return {
      getRows: (opts?: any) => ({ rows: mockRows.slice(0, opts?.take ?? 999), total: mockRows.length }),
    } as any;
  }

  private _buildSampleTemplate(): ReportTemplate {
    return {
      version: '1.0.0',
      meta: {
        name: '销售订单汇总',
        author: 'Admin',
        createdAt: new Date().toISOString(),
      },
      page: {
        paperSize: 'A4',
        orientation: 'portrait',
        margin: { top: 20, right: 20, bottom: 20, left: 20 },
        printPageNumber: true,
        pageNumberFormat: '第 {page} 页，共 {total} 页',
      },
      dataSource: {
        name: 'SalesData',
        type: 'datastore',
        fields: [
          { name: 'order_no', label: '订单号', dataType: 'string' },
          { name: 'customer', label: '客户', dataType: 'string' },
          { name: 'amount', label: '金额', dataType: 'currency' },
          { name: 'dept', label: '部门', dataType: 'string' },
          { name: 'create_time', label: '日期', dataType: 'date' },
        ],
        autoLoadData: true,
        dataScope: 'all',
      },
      bands: [
        {
          id: 'rh1', type: 'report-header', label: '报表标题', height: 50, visible: true, items: [
            {
              id: 'title1', type: 'text', x: 0, y: 10, width: 600, height: 35,
              config: {
                type: 'text', text: '销售订单汇总表',
                fontSize: 20, fontWeight: 'bold', align: 'center',
                color: '#1a237e',
              }
            }
          ]
        },
        {
          id: 'ph1', type: 'page-header', label: '列标题', height: 35, visible: true, items: [
            { id: 'ph1', type: 'field', x: 0, y: 5, width: 120, height: 25,
              config: { type: 'field', field: 'order_no', nullText: '订单号' },
              style: 'header' },
            { id: 'ph2', type: 'field', x: 130, y: 5, width: 100, height: 25,
              config: { type: 'field', field: 'customer', nullText: '客户' } },
            { id: 'ph3', type: 'field', x: 240, y: 5, width: 80, height: 25,
              config: { type: 'field', field: 'dept', nullText: '部门' } },
            { id: 'ph4', type: 'field', x: 330, y: 5, width: 120, height: 25,
              config: { type: 'field', field: 'amount', nullText: '金额', format: '¥#,##0.00', align: 'right' } },
            { id: 'ph5', type: 'field', x: 460, y: 5, width: 100, height: 25,
              config: { type: 'field', field: 'create_time', nullText: '日期' } },
          ]
        },
        {
          id: 'd1', type: 'data', label: '数据明细', height: 28, visible: true, items: [
            { id: 'd1-1', type: 'field', x: 0, y: 2, width: 120, height: 24,
              config: { type: 'field', field: 'order_no' } },
            { id: 'd1-2', type: 'field', x: 130, y: 2, width: 100, height: 24,
              config: { type: 'field', field: 'customer' } },
            { id: 'd1-3', type: 'field', x: 240, y: 2, width: 80, height: 24,
              config: { type: 'field', field: 'dept' } },
            { id: 'd1-4', type: 'field', x: 330, y: 2, width: 120, height: 24,
              config: { type: 'field', field: 'amount', format: '¥#,##0.00', align: 'right' } },
            { id: 'd1-5', type: 'field', x: 460, y: 2, width: 100, height: 24,
              config: { type: 'field', field: 'create_time' } },
          ]
        },
        {
          id: 'rf1', type: 'report-footer', label: '报表汇总', height: 40, visible: true, items: [
            { id: 'rf1-label', type: 'text', x: 0, y: 8, width: 330, height: 25,
              config: { type: 'text', text: '合计：', fontWeight: 'bold', align: 'right' } },
            { id: 'rf1-sum', type: 'computed', x: 330, y: 8, width: 120, height: 25,
              config: {
                type: 'computed',
                expression: '{SUM(amount)}',
                format: '¥#,##0.00',
                dataType: 'currency',
                fontWeight: 'bold',
                align: 'right',
              }
            },
          ]
        },
        {
          id: 'pf1', type: 'page-footer', label: '页脚', height: 30, visible: true, items: [
            { id: 'pf1-text', type: 'text', x: 0, y: 5, width: 560, height: 20,
              config: { type: 'text', text: '{pageNumber}', fontSize: 10, color: '#999', align: 'center' } },
          ]
        }
      ],
      groups: [],
      styles: {
        header: {
          name: 'header',
          fontSize: 12, fontWeight: 'bold',
          backgroundColor: '#e8eaf6',
          color: '#1a237e',
          align: 'center',
        }
      },
      parameters: [],
      sort: [],
    };
  }
}
