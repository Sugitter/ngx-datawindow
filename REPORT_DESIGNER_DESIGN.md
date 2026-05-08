# ngx-datawindow Report Designer 集成方案

> 调研时间：2026-05-05
> 目标：为 ngx-datawindow 设计报表设计器集成架构

---

## 一、现有报表设计器方案对比

### 1.1 商业方案

| 方案 | Angular 支持 | 授权方式 | 国内生态 | 推荐度 |
|------|-------------|----------|----------|--------|
| **ActiveReportsJS** | ✅ 纯JS核心包 | IP/域名绑定，¥10,800+ | 葡萄城，文档丰富 | ⭐⭐⭐⭐ |
| **Stimulsoft Reports.JS** | ✅ `@stimulsoft/designer-angular` | 按部署收费，价高 | 中文网但资料少 | ⭐⭐⭐ |
| **FastReport.Core** | ⚠️ 仅.NET后端 | 免费开源/.NET专版 | 国内较多使用 | ⭐⭐⭐ |
| **Crystal Reports** | ❌ 无 | 企业授权 | 老系统残留 | ⭐ |

### 1.2 开源/免费方案

| 方案 | Angular 支持 | 说明 | 推荐度 |
|------|-------------|------|--------|
| **Lucky-Report** | ⚠️ 基于Luckysheet | 类Excel在线表格，非专业报表 | ⭐⭐ |
| **ReportHub** | ❌ | 社区项目，不成熟 | ⭐ |
| **自研** | ✅ | 成本高，适合有特殊需求 | ⭐⭐⭐ |

### 1.3 推荐方案

**结论：采用「双轨策略」**

```
短期：ActiveReportsJS（商业授权，已有成熟Angular集成）
长期：自研 ReportPlugin 接口（允许自由切换商业/自研报表引擎）
```

---

## 二、架构设计

### 2.1 核心理念

ngx-datawindow **不内置** 报表引擎，而是定义 **ReportPlugin 接口**，
任何实现了该接口的报表设计器都可以作为插件接入。

```
ngx-datawindow
├── DataStore          ← 数据来源（单一数据真相）
├── DataTableComponent ← UI 组件
├── ReportPlugin API   ← 报表插件标准接口（NEW）
│   ├── ReportDesignerComponent
│   ├── ReportViewerComponent
│   └── ReportService（桥接层）
│
├── adapters/
│   ├── ActiveReportsJSAdapter  ← 实现 ReportPlugin
│   └── StimulsoftAdapter        ← 实现 ReportPlugin
│
└── report/
    ├── report-plugin.interface.ts   ← 核心接口
    ├── report-designer.component.ts ← 插件包装组件
    ├── report-viewer.component.ts   ← 报表预览组件
    └── report.service.ts            ← 插件调度服务
```

### 2.2 ReportPlugin 核心接口

```typescript
// report/report-plugin.interface.ts

/**
 * 报表插件接口
 * 所有报表设计器都必须实现此接口
 */
export interface ReportPlugin {
  /** 插件标识 */
  readonly id: string;

  /** 插件显示名称 */
  readonly displayName: string;

  /** 报表设计器 Angular 组件类型 */
  designerComponent: Type<ReportDesignerHostComponent>;

  /** 报表预览组件类型 */
  viewerComponent: Type<ReportViewerHostComponent>;

  /**
   * 初始化插件
   * @param config 插件配置（如授权码、数据源等）
   */
  initialize(config: ReportPluginConfig): Promise<void>;

  /**
   * 从 DataStore 导出报表数据
   * @param store DataStore 实例
   * @param options 导出选项
   */
  exportData(
    store: DataStoreImpl,
    options: ReportExportOptions
  ): ReportDataSource;

  /**
   * 从报表模板 JSON 创建预览
   * @param template 报表模板（引擎特定格式）
   */
  createViewer(template: unknown): ReportViewerRef;

  /**
   * 销毁插件，释放资源
   */
  dispose(): void;
}

/**
 * 报表插件配置
 */
export interface ReportPluginConfig {
  /** 插件 ID */
  pluginId: string;

  /** 授权码（商业报表引擎必需） */
  licenseKey?: string;

  /** 语言设置 */
  locale?: string;

  /** 主题配置 */
  theme?: ReportTheme;

  /** 额外参数 */
  extra?: Record<string, unknown>;
}

/**
 * 报表导出选项
 */
export interface ReportExportOptions {
  /** 数据范围：'all' | 'selected' | 'page' */
  dataScope?: 'all' | 'selected' | 'page';

  /** 要导出的字段列表（空=全部） */
  fields?: string[];

  /** 是否包含聚合结果 */
  includeAggregations?: boolean;

  /** 是否包含计算列 */
  includeComputedColumns?: boolean;
}

/**
 * 报表数据源（统一格式）
 * 插件负责将此格式转换为引擎特定的数据格式
 */
export interface ReportDataSource {
  /** 数据集名称 */
  name: string;

  /** 字段定义 */
  fields: ReportField[];

  /** 数据行 */
  rows: Record<string, unknown>[];

  /** 聚合结果 */
  aggregations?: Record<string, AggregationResult>;

  /** 数据时间戳（用于缓存/版本控制） */
  timestamp?: number;
}

/**
 * 报表字段定义
 */
export interface ReportField {
  name: string;
  label: string;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'currency';
  format?: string;
  aggregate?: AggregationType;
}

/**
 * 报表主题
 */
export interface ReportTheme {
  primaryColor?: string;
  fontFamily?: string;
  fontSize?: number;
}

/**
 * 报表设计器宿主组件接口
 * 报表插件返回的组件必须实现此接口
 */
export interface ReportDesignerHostComponent {
  /** 当前报表模板 JSON */
  template: unknown;

  /** 模板变更回调 */
  templateChange: EventEmitter<unknown>;

  /** 保存报表回调 */
  onSave: EventEmitter<unknown>;

  /** 预览报表回调 */
  onPreview: EventEmitter<unknown>;

  /** 注入的数据源 */
  dataSource: ReportDataSource;

  /** 主题 */
  theme?: ReportTheme;
}

/**
 * 报表预览宿主组件接口
 */
export interface ReportViewerHostComponent {
  /** 报表模板 */
  template: unknown;

  /** 数据源 */
  dataSource: unknown;

  /** 导出回调 */
  onExport: EventEmitter<{ format: ExportFormat; data: unknown }>;

  /** 打印回调 */
  onPrint: EventEmitter<void>;
}

/** 导出格式 */
export type ExportFormat = 'pdf' | 'excel' | 'word' | 'html' | 'json';
```

---

## 三、ActiveReportsJS 适配器实现

### 3.1 包安装

```bash
npm install @grapecity/activereports
npm install @grapecity/activereports-core  # 如果需要核心API
```

### 3.2 适配器实现

```typescript
// report/adapters/activereports-js.adapter.ts

import {
  Component, ElementRef, ViewChild, OnDestroy,
  signal, EventEmitter, Type, ChangeDetectorRef
} from '@angular/core';
import { Core } from '@grapecity/activereports/core';
import {
  ReportPlugin, ReportPluginConfig, ReportExportOptions,
  ReportDataSource, ReportDesignerHostComponent, ReportViewerHostComponent
} from '../report-plugin.interface';

export const ACTIVEREPORTSJS_PLUGIN_ID = 'activereportsjs';

/**
 * ActiveReportsJS 报表设计器宿主组件
 */
@Component({
  selector: 'dw-ar-designer',
  template: `
    <div #designerHost class="dw-ar-designer-host"></div>
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100%; }
    .dw-ar-designer-host { width: 100%; height: 100%; }
  `]
})
export class ActiveReportsDesignerHostComponent implements ReportDesignerHostComponent {
  @ViewChild('designerHost', { static: true }) hostRef!: ElementRef;

  template: unknown = null;
  templateChange = new EventEmitter<unknown>();
  onSave = new EventEmitter<unknown>();
  onPreview = new EventEmitter<unknown>();

  private _designer: any = null;
  private _initialized = false;

  set dataSource(ds: ReportDataSource) {
    // ActiveReportsJS 通过 reportStorage.getReportData() 获取数据
    if (this._designer) {
      this._designer.setReportData(ds);
    }
  }

  set theme(t: any) {
    // 设置主题
  }

  async ngAfterViewInit() {
    await this.initDesigner();
  }

  private async initDesigner() {
    if (this._initialized) return;

    const { Designer } = await import('@grapecity/activereports/designer');
    this._designer = new Designer({
      renderTo: this.hostRef.nativeElement,
      reportStorage: {
        getReportData: () => null, // 数据由外部注入
      },
      localization: this.getLocalization(),
    });

    if (this.template) {
      this._designer.openReport(this.template);
    }

    this._designer.on('reportChanged', () => {
      const report = this._designer.getReport();
      this.templateChange.emit(report);
    });

    this._designer.on('save', () => {
      this.onSave.emit(this._designer.getReport());
    });

    this._designer.on('preview', () => {
      this.onPreview.emit(this._designer.getReport());
    });

    this._initialized = true;
  }

  private getLocalization() {
    // 中文本地化
  }

  ngOnDestroy() {
    this._designer?.dispose();
  }
}

/**
 * ActiveReportsJS 报表预览宿主组件
 */
@Component({
  selector: 'dw-ar-viewer',
  template: `<div #viewerHost class="dw-ar-viewer-host"></div>`,
})
export class ActiveReportsViewerHostComponent implements ReportViewerHostComponent {
  @ViewChild('viewerHost', { static: true }) hostRef!: ElementRef;

  template: unknown = null;
  dataSource: unknown = null;
  onExport = new EventEmitter<{ format: string; data: unknown }>();
  onPrint = new EventEmitter<void>();

  private _viewer: any = null;

  async ngAfterViewInit() {
    const { Viewer } = await import('@grapecity/activereports/core');
    this._viewer = new Viewer(this.hostRef.nativeElement, {
      export: {
        handlers: {
          onExport: (args: any) => {
            this.onExport.emit({ format: args.format, data: args.report });
          }
        }
      }
    });
    if (this.template) {
      this._viewer.open(this.template);
    }
  }

  ngOnDestroy() {
    // dispose viewer
  }
}

/**
 * ActiveReportsJS 报表插件
 */
export class ActiveReportsJSPlugin implements ReportPlugin {
  readonly id = ACTIVEREPORTSJS_PLUGIN_ID;
  readonly displayName = 'ActiveReportsJS 报表设计器';

  designerComponent: Type<ReportDesignerHostComponent> = ActiveReportsDesignerHostComponent;
  viewerComponent: Type<ReportViewerHostComponent> = ActiveReportsViewerHostComponent;

  private _licenseKey?: string;
  private _locale = 'zh-CN';

  async initialize(config: ReportPluginConfig): Promise<void> {
    Core.setLicenseKey(config.licenseKey ?? '');
    this._locale = config.locale ?? 'zh-CN';
    this._licenseKey = config.licenseKey;
  }

  exportData(store: DataStoreImpl, options: ReportExportOptions): ReportDataSource {
    const state = store.getState();

    // 确定数据范围
    let rows: DataRow[];
    if (options.dataScope === 'selected') {
      rows = store.getSelectedRows();
    } else if (options.dataScope === 'page') {
      rows = store.getRows({ take: 999999 }).rows;
    } else {
      rows = store.getRows({ take: 999999 }).rows;
    }

    // 获取字段定义
    const fields: ReportField[] = (state.fields || []).map((f: FieldDefinition) => ({
      name: f.name,
      label: f.label ?? f.name,
      dataType: this.inferDataType(f),
      format: f.format,
    }));

    // 包含计算列
    if (options.includeComputedColumns) {
      const computedFields = this.getComputedFields(store);
      fields.push(...computedFields);
    }

    // 包含聚合结果
    const aggregations = options.includeAggregations
      ? store.computeAllAggregations?.() ?? {}
      : undefined;

    return {
      name: state.name ?? 'DataSource1',
      fields,
      rows: rows.map(r => r.raw),
      aggregations,
      timestamp: Date.now(),
    };
  }

  createViewer(template: unknown): any {
    // 返回预览实例引用
    return { template };
  }

  dispose(): void {
    // 清理资源
  }

  private inferDataType(field: FieldDefinition): ReportField['dataType'] {
    if (field.dataType) return field.dataType;
    return 'string'; // 默认
  }

  private getComputedFields(store: DataStoreImpl): ReportField[] {
    // 从 DataStore 的 computedColumns 获取
    return [];
  }
}
```

---

## 四、ngx-datawindow ReportService

```typescript
// report/report.service.ts

import { Injectable, signal, Type, Injector, inject } from '@angular/core';
import {
  ReportPlugin, ReportPluginConfig, ReportDataSource,
  ReportDesignerHostComponent, ReportViewerHostComponent,
  ExportFormat
} from './report-plugin.interface';
import { DataStoreImpl } from '../datastore';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private _injector = inject(Injector);

  /** 当前激活的插件 */
  private _activePlugin = signal<ReportPlugin | null>(null);
  readonly activePlugin = this._activePlugin.asReadonly();

  /** 当前报表模板 */
  private _currentTemplate = signal<unknown>(null);
  readonly currentTemplate = this._currentTemplate.asReadonly();

  /** 当前报表数据 */
  private _currentData = signal<ReportDataSource | null>(null);
  readonly currentData = this._currentData.asReadonly();

  /** 设计器组件类型 */
  private _designerComponent = signal<Type<ReportDesignerHostComponent> | null>(null);
  readonly designerComponent = this._designerComponent.asReadonly();

  /** 预览器组件类型 */
  private _viewerComponent = signal<Type<ReportViewerHostComponent> | null>(null);
  readonly viewerComponent = this._viewerComponent.asReadonly();

  /**
   * 注册报表插件
   */
  async registerPlugin(plugin: ReportPlugin, config: ReportPluginConfig): Promise<void> {
    await plugin.initialize(config);
    this._activePlugin.set(plugin);
    this._designerComponent.set(plugin.designerComponent);
    this._viewerComponent.set(plugin.viewerComponent);
  }

  /**
   * 从 DataStore 导出数据并同步到报表
   */
  syncFromDataStore(store: DataStoreImpl, options?: {
    dataScope?: 'all' | 'selected' | 'page';
    fields?: string[];
    includeAggregations?: boolean;
  }): ReportDataSource {
    const plugin = this._activePlugin();
    if (!plugin) {
      throw new Error('No report plugin registered. Call registerPlugin() first.');
    }

    const data = plugin.exportData(store, {
      dataScope: options?.dataScope ?? 'all',
      fields: options?.fields,
      includeAggregations: options?.includeAggregations ?? true,
      includeComputedColumns: true,
    });

    this._currentData.set(data);
    return data;
  }

  /**
   * 设置当前报表模板
   */
  setTemplate(template: unknown): void {
    this._currentTemplate.set(template);
  }

  /**
   * 获取当前模板 JSON（用于保存到后端）
   */
  getTemplateJson(): string {
    const template = this._currentTemplate();
    return JSON.stringify(template, null, 2);
  }

  /**
   * 从 JSON 加载报表模板
   */
  loadTemplateFromJson(json: string): void {
    try {
      const template = JSON.parse(json);
      this._currentTemplate.set(template);
    } catch (e) {
      throw new Error(`Invalid report template JSON: ${e}`);
    }
  }

  /**
   * 导出报表（设计器 -> 预览）
   */
  async exportReport(format: ExportFormat): Promise<Blob> {
    const plugin = this._activePlugin();
    if (!plugin) throw new Error('No active plugin');

    // 触发预览器的导出逻辑
    // 具体实现取决于预览器组件
    throw new Error('Not implemented');
  }

  /**
   * 注销当前插件
   */
  dispose(): void {
    this._activePlugin()?.dispose();
    this._activePlugin.set(null);
    this._designerComponent.set(null);
    this._viewerComponent.set(null);
    this._currentTemplate.set(null);
    this._currentData.set(null);
  }
}
```

---

## 五、报表设计器组件

```typescript
// report/report-designer.component.ts

import {
  Component, input, output, ViewChild, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportService } from './report.service';
import type { ReportDesignerHostComponent } from './report-plugin.interface';

/**
 * 报表设计器容器组件
 *
 * 使用方式：
 * <dw-report-designer
 *   [template]="templateJson"
 *   [dataSource]="reportData"
 *   (save)="onReportSave($event)"
 *   (preview)="onReportPreview($event)"
 * />
 */
@Component({
  selector: 'dw-report-designer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (designerComp()) {
      <ng-container *ngComponentOutlet="designerComp(); inputs: hostInputs()"></ng-container>
    } @else {
      <div class="dw-report-no-plugin">
        <p>未注册报表插件。请先调用 ReportService.registerPlugin()</p>
      </div>
    }
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100%; }
    .dw-report-no-plugin {
      display: flex; align-items: center; justify-content: center;
      height: 100%; color: #999; font-size: 14px;
    }
  `]
})
export class ReportDesignerComponent {
  private _reportService = inject(ReportService);

  /** 报表模板 JSON */
  template = input<unknown>(null);

  /** 数据源 */
  dataSource = input<any>(null);

  /** 保存事件 */
  save = output<unknown>();

  /** 预览事件 */
  preview = output<unknown>();

  designerComp = this._reportService.designerComponent;

  hostInputs(): Record<string, unknown> {
    return {
      template: this.template(),
      dataSource: this.dataSource(),
      onSave: this.save,
      onPreview: this.preview,
    };
  }
}

/**
 * 报表预览组件
 */
@Component({
  selector: 'dw-report-viewer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (viewerComp()) {
      <ng-container *ngComponentOutlet="viewerComp(); inputs: hostInputs()"></ng-container>
    } @else {
      <div class="dw-report-no-plugin">
        <p>未注册报表插件</p>
      </div>
    }
  `,
})
export class ReportViewerComponent {
  private _reportService = inject(ReportService);

  template = input<unknown>(null);
  dataSource = input<any>(null);
  export = output<{ format: string; data: unknown }>();
  print = output<void>();

  viewerComp = this._reportService.viewerComponent;

  hostInputs() {
    return {
      template: this.template(),
      dataSource: this.dataSource(),
      onExport: this.export,
      onPrint: this.print,
    };
  }
}
```

---

## 六、ngx-datawindow 中的集成方式

### 6.1 DataTableComponent 新增报表按钮

```typescript
// 在 datatable.component.ts 中添加

@Output() openReportDesigner = new EventEmitter<void>();

onOpenReportDesigner() {
  this.openReportDesigner.emit();
}
```

```html
<!-- 工具栏模板中增加报表按钮 -->
<button mat-icon-button (click)="onOpenReportDesigner()" title="报表设计">
  <mat-icon>assessment</mat-icon>
</button>
```

### 6.2 使用示例

```typescript
// app.component.ts
import { Component, inject } from '@angular/core';
import { DataTableComponent } from 'ngx-datawindow';
import { ReportDesignerComponent, ReportService } from 'ngx-datawindow/report';
import { ActiveReportsJSPlugin } from 'ngx-datawindow/report/adapters';
import { FileService } from './services/file.service';

@Component({
  standalone: true,
  imports: [DataTableComponent, ReportDesignerComponent],
  template: `
    <!-- 数据管理 -->
    <dw-data-table
      [datastoreConfig]="datastoreConfig"
      [columns]="columns"
      [data]="rows"
      (openReportDesigner)="openDesigner()"
    />

    <!-- 报表设计器弹窗 -->
    @if (showDesigner) {
      <div class="designer-overlay">
        <dw-report-designer
          [template]="currentTemplate"
          [dataSource]="reportData"
          (save)="onReportSave($event)"
          (preview)="onReportPreview($event)"
        />
      </div>
    }
  `
})
export class AppComponent {
  private _reportService = inject(ReportService);
  private _fileService = inject(FileService);

  showDesigner = false;
  currentTemplate: unknown = null;
  reportData: any = null;

  async ngOnInit() {
    // 注册 ActiveReportsJS 插件
    await this._reportService.registerPlugin(
      new ActiveReportsJSPlugin(),
      { licenseKey: 'YOUR-LICENSE-KEY', locale: 'zh-CN' }
    );
  }

  openDesigner() {
    // 同步 DataStore 数据到报表
    const store = this._dataTable.getDataStore();
    this.reportData = this._reportService.syncFromDataStore(store, {
      dataScope: 'all',
      includeAggregations: true,
    });

    // 加载上次保存的模板（或新建空白模板）
    this.currentTemplate = this._fileService.loadReportTemplate();
    this.showDesigner = true;
  }

  async onReportSave(template: unknown) {
    this.currentTemplate = template;
    await this._fileService.saveReportTemplate(template);
    this.showDesigner = false;
  }

  onReportPreview(template: unknown) {
    // 打开预览窗口
    this.currentTemplate = template;
    this.showPreview = true;
  }
}
```

---

## 七、文件结构规划

```
projects/ngx-datawindow/src/lib/
├── report/                           ← 新建报表模块
│   ├── index.ts                      ← 导出全部 report API
│   ├── report-plugin.interface.ts    ← 核心接口（最重要）
│   ├── report.service.ts             ← ReportService
│   ├── report-designer.component.ts  ← 设计器容器组件
│   ├── report-viewer.component.ts   ← 预览器容器组件
│   └── adapters/
│       ├── index.ts
│       └── activereports-js.adapter.ts
│
├── datatable.component.ts            ← 增加 openReportDesigner EventEmitter
├── datatable.service.ts
└── datastore.ts
```

---

## 八、Phase 规划

### Phase 1：核心接口（1-2天）
- [ ] 定义 `ReportPlugin` 接口
- [ ] 定义 `ReportDataSource` / `ReportField` 等类型
- [ ] 实现 `ReportService`
- [ ] 实现 `ReportDesignerComponent` / `ReportViewerComponent`
- [ ] 实现 `ActiveReportsJSAdapter`
- [ ] 单元测试

### Phase 2：ActiveReportsJS 集成（2-3天）
- [ ] 完成 ActiveReportsJS 适配器
- [ ] 实现设计器宿主组件
- [ ] 实现预览器宿主组件
- [ ] 实现数据导出（DataStore → ARJS JSON）
- [ ] 实现保存/加载报表模板
- [ ] Demo 示例页面

### Phase 3：增强功能（1-2天）
- [ ] Stimulsoft 适配器（可选）
- [ ] 多语言支持（zh-CN/en/ja）
- [ ] 主题定制
- [ ] 报表模板版本管理
- [ ] 报表历史记录

---

## 九、关键决策点

| 问题 | 建议 |
|------|------|
| 是否需要实时数据报表？ | 延迟实现；先做静态报表 |
| 报表存储在后端还是 IndexedDB？ | IndexedDB（离线场景）+ 后端同步 |
| 是否需要报表设计器离线使用？ | 是；模板和数据都走 OfflineService |
| 是否支持报表嵌套（主子报表）？ | 延迟；Phase 2 考虑 |
| 多语言（en/zh-CN/ja）？ | 通过 Angular i18n 机制支持 |

---

## 十、风险与注意事项

1. **ActiveReportsJS 授权**：必须购买正式授权，试用版有水印
2. **数据导出性能**：10万行数据导出需加进度提示和分批处理
3. **报表模板版本**：报表设计器版本升级可能破坏旧模板，需做兼容性处理
4. **数据安全**：报表模板中可能包含 SQL 等敏感信息，加密存储
5. **Angular 兼容**：确保 ActiveReportsJS 版本与 Angular 21 兼容
