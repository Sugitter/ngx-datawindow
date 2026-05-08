# ngx-datawindow Architecture v2

> Data is the first citizen. UI is just a lens.

## 1. Design Philosophy

### 1.1 DataWindow Heritage

PowerBuilder DataWindow 的核心设计理念不是"表格控件"，而是**以数据为中心的交互范式**：

- **Data as First Citizen** — 数据是主体，UI 是数据的投影
- **Reversible Operations** — 所有操作可撤销，Change Tracking 是原生能力
- **Traceable Changes** — 列级变更跟踪，知道什么变了、何时变的
- **Real-time Validation** — ItemChanged 事件链，每次变更即时校验
- **Intervenable Event Chain** — 开发者可在事件链任意节点介入

这些理念与 UI 框架无关。它们是**数据交互的本质需求**，不管你用 Angular、Vue 还是 React，用户对数据操作的需求是一样的。

### 1.2 Inclusive & Open

ngx-datawindow 的使命不是做"最好的 Angular 表格组件"，而是：

**把 DataWindow 优秀的数据交互范式带给所有关注数据的人。**

- Angular 开发者能用，Vue 开发者也能用，React 开发者也能用
- 不绑定任何 UI 框架，但拥抱每个 UI 框架的最佳实践
- 核心引擎零 UI 依赖，只需一个轻薄适配层即可对接任意 UI 生态

### 1.3 Design Principles

| 原则 | 说明 |
|------|------|
| Core is Framework-Free | DataStore Engine 零 UI 框架依赖，纯 TypeScript |
| Thin Adapter | 每个 UI 框架只需一个薄适配层（< 500 行） |
| Data Drives UI | 数据变更驱动 UI 更新，不是 UI 事件驱动数据操作 |
| 80/20 Rule | 20% 的功能覆盖 80% 的场景，高级功能按需加载 |
| Zero Config | 开箱即用，默认配置覆盖最常见场景 |
| < 50KB gzip | Core + 任一适配层 < 50KB（tree-shakeable） |

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Application Layer                                │
│  (Developer uses DataWindow component in their framework of choice)     │
└──────────────┬──────────────────────┬──────────────────────┬────────────┘
               │                      │                      │
    ┌──────────▼──────────┐ ┌────────▼────────┐ ┌──────────▼──────────┐
    │  Angular Adapter    │ │  Vue Adapter     │ │  React Adapter      │
    │  (CDK + Material)   │ │  (Element Plus / │ │  (MUI / Ant Design  │
    │                     │ │   Vuetify /       │ │   / Arco Design)    │
    │  - Signal bindings  │ │   Naive UI)       │ │  - Hook bindings    │
    │  - CDK VirtualScroll│ │  - Ref/Reactive   │ │  - React Virtual    │
    │  - Material themes  │ │  - Vue VirtualSc  │ │  - CSS-in-JS themes │
    └──────────┬──────────┘ └────────┬─────────┘ └──────────┬──────────┘
               │                      │                      │
    ═══════════╪══════════════════════╪══════════════════════╪═══════════
               │        Adapter Interface (Framework-Free)    │
    ═══════════╪══════════════════════╪══════════════════════╪═══════════
               │                      │                      │
┌──────────────▼──────────────────────▼──────────────────────▼────────────┐
│                         Presentation Engine                             │
│                                                                         │
│  Renderer Registry — 11 Display Modes (按需加载)                        │
│                                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │  Grid    │ │  Form    │ │  Group   │ │  Tree    │ │  Report  │     │
│  │  (P0)    │ │  (P1)    │ │  (P1)    │ │  (P1)    │ │  (P1)    │     │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │  Card    │ │  Master  │ │ TreeGrid │ │  Export  │ │  Pivot   │     │
│  │  (P2)    │ │  Detail  │ │  (P2)    │ │  (P2)    │ │  (P3)    │     │
│  │          │ │  (P2)    │ │          │ │          │ │          │     │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
│  ┌──────────┐                                                          │
│  │  Gantt   │                                                          │
│  │  (P3)    │                                                          │
│  └──────────┘                                                          │
│                                                                         │
│  Each Renderer receives: DataWindowState → emits: UserInteraction      │
│  Renderers are framework-free. Adapter translates to framework API.     │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────────┐
│                         DataStore Engine                                │
│                    (Pure TypeScript — Zero UI Dependency)                │
│                                                                         │
│  ┌────────────────┐  ┌─────────────┐  ┌──────────────┐                 │
│  │  Three-Buffer  │  │  Column-    │  │  UndoStack   │                 │
│  │  Architecture  │  │  Level      │  │  Manager     │                 │
│  │  main/filtered │  │  Change     │  │  (Command    │                 │
│  │  /deleted      │  │  Tracking   │  │   Pattern)   │                 │
│  └────────────────┘  └─────────────┘  └──────────────┘                 │
│                                                                         │
│  ┌────────────────┐  ┌─────────────┐  ┌──────────────┐                 │
│  │  FilterEngine  │  │  SortEngine │  │  Aggregation │                 │
│  │  (15 operators)│  │             │  │  Engine      │                 │
│  └────────────────┘  └─────────────┘  └──────────────┘                 │
│                                                                         │
│  ┌────────────────┐  ┌─────────────┐                                   │
│  │  ItemChanged   │  │  DataFeed   │                                   │
│  │  Event Chain   │  │  (Real-time)│                                   │
│  └────────────────┘  └─────────────┘                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. DataStore Engine — The Core

### 3.1 Design Contract

DataStore Engine 是整个架构的基石。它必须满足：

1. **零 UI 依赖** — 不引用任何 UI 框架的包（@angular/*, vue, react 等）
2. **纯 TypeScript** — 可在任何 JS 运行时运行（浏览器、Node.js、Deno、Bun）
3. **Reactive Protocol** — 通过 Observer/Callback 模式通知数据变更，不绑定任何响应式框架
4. **Feature Complete** — CRUD、Change Tracking、Undo、Filter、Sort、Aggregation、Real-time Feed

### 3.2 Reactive Protocol

DataStore 不依赖 Angular Signal / Vue Ref / React State。它定义自己的响应式协议：

```typescript
// DataStore 内部协议 — 与 UI 框架无关
interface DataStoreObserver {
  onRowsChanged(change: RowChange): void;
  onRowStatusChanged(rowId: string, status: RowStatus): void;
  onFilterChanged(filteredCount: number): void;
  onSortChanged(): void;
  onAggregationChanged(results: Map<string, any>): void;
  onUndoStackChanged(canUndo: boolean, canRedo: boolean): void;
  onItemChanged(event: ItemChangedEvent): void;  // 可拦截、可拒绝
  onValidationChanged(errors: ValidationError[]): void;
}

// DataStore 提供 subscribe/unsubscribe
interface DataStore {
  subscribe(observer: DataStoreObserver): Subscription;
  unsubscribe(subscription: Subscription): void;
}
```

### 3.3 Adapter 将协议翻译为框架响应式

```typescript
// Angular Adapter: DataStoreObserver → Signal
class AngularDataStoreAdapter implements DataStoreObserver {
  private _rows = signal<DataRow[]>([]);
  private _totalRows = signal(0);
  private _loading = signal(false);
  // ...

  onRowsChanged(change: RowChange): void {
    this._rows.set(change.rows);
    this._totalRows.set(change.total);
  }
  // Adapter 把 DataStore 事件翻译成 Angular Signal 更新
}

// Vue Adapter: DataStoreObserver → Ref/Reactive
class VueDataStoreAdapter implements DataStoreObserver {
  rows = ref<DataRow[]>([]);
  totalRows = ref(0);
  // ...

  onRowsChanged(change: RowChange): void {
    this.rows.value = change.rows;
    this.totalRows.value = change.total;
  }
  // Adapter 把 DataStore 事件翻译成 Vue Ref 更新
}

// React Adapter: DataStoreObserver → State
class ReactDataStoreAdapter implements DataStoreObserver {
  private setState: React.Dispatch<React.SetStateAction<DataWindowState>>;

  onRowsChanged(change: RowChange): void {
    this.setState(prev => ({ ...prev, rows: change.rows, total: change.total }));
  }
  // Adapter 把 DataStore 事件翻译成 React setState 更新
}
```

### 3.4 DataStore 现有能力（已实现）

| 能力 | 实现 | 代码量 |
|------|------|--------|
| Three-Buffer Architecture | mainRows / filteredRows / deletedRows | ~200 行 |
| Column-Level Change Tracking | FieldChangeRecord, _changeHistory | ~150 行 |
| UndoStackManager | Command Pattern, undo/redo | ~200 行 |
| ItemChanged Event Chain | handler chain + itemValidate | ~100 行 |
| FilterEvaluator | 15 operators (eq, ne, gt, lt, contains, regex, null...) | ~250 行 |
| Sorter | multi-field sort | ~80 行 |
| AggregatorImpl | 8 types (sum, avg, count, min, max, first, last, custom) + groupBy | ~200 行 |
| DataFeed | replace / merge / append modes | ~100 行 |
| CRUD API | addRow, updateRow, deleteRow, restoreRow | ~200 行 |
| Query API | filter + sort + skip/take + includeFiltered/Deleted | ~100 行 |

---

## 4. Presentation Engine — Framework-Free Renderers

### 4.1 Renderer Interface

Renderer 是纯逻辑的视图计算器，不直接操作 DOM。它接收 DataStore 状态，输出视图描述：

```typescript
// Renderer 接口 — 与 UI 框架无关
interface DataWindowRenderer {
  readonly mode: DisplayMode;

  /** 输入：当前数据 + 配置 */
  update(state: DataWindowState): void;

  /** 输出：视图描述（Adapter 将其翻译为 DOM） */
  readonly view: DataWindowView;
}

// 视图描述 — 纯数据结构，不含 DOM 操作
interface DataWindowView {
  headerRows: ViewRow[];       // 表头行
  bodyRows: ViewRow[];         // 数据行（虚拟滚动时只包含可见行）
  footerRows: ViewRow[];       // 表尾行（合计等）
  totalScrollHeight: number;   // 虚拟滚动总高度
  scrollOffset: number;        // 当前滚动偏移
  collapsedGroups: Set<string>; // 折叠的分组
  treeExpanded: Set<string>;   // 展开的树节点
}

interface ViewRow {
  id: string;
  type: 'data' | 'group' | 'tree' | 'header' | 'footer';
  cells: ViewCell[];
  depth: number;              // 树形/分组缩进级别
  status: RowStatus;          // normal | new | modified | deleted
  raw: any;                   // 原始数据引用
}

interface ViewCell {
  field: string;
  value: any;
  formatted: string;          // 格式化后的显示文本
  editable: boolean;
  editType?: 'text' | 'number' | 'select' | 'date';
  sticky?: 'start' | 'end';
  highlighted: boolean;       // 实时数据变更高亮
  colspan?: number;
}
```

### 4.2 Grid Renderer — Virtual Scroll Core

Grid Renderer 是最复杂的渲染器，处理虚拟滚动逻辑：

```typescript
class GridRenderer implements DataWindowRenderer {
  readonly mode = 'grid';

  private _state!: DataWindowState;
  private _scrollOffset = 0;
  private _rowHeight = 36;          // 固定行高
  private _bufferSize = 10;         // 缓冲行数

  update(state: DataWindowState): void {
    this._state = state;
  }

  onScroll(scrollOffset: number): void {
    this._scrollOffset = scrollOffset;
  }

  get view(): DataWindowView {
    const allRows = this._state.rows;
    const viewportHeight = this._state.viewportHeight || 600;
    const rowHeight = this._rowHeight;

    // 计算可见范围 + 缓冲区
    const firstVisible = Math.floor(this._scrollOffset / rowHeight);
    const visibleCount = Math.ceil(viewportHeight / rowHeight);
    const start = Math.max(0, firstVisible - this._bufferSize);
    const end = Math.min(allRows.length, firstVisible + visibleCount + this._bufferSize);

    return {
      headerRows: this._buildHeaderRows(),
      bodyRows: allRows.slice(start, end).map(row => this._toViewRow(row, start)),
      footerRows: this._buildFooterRows(),
      totalScrollHeight: allRows.length * rowHeight,
      scrollOffset: start * rowHeight,
      collapsedGroups: new Set(),
      treeExpanded: new Set(),
    };
  }

  private _buildHeaderRows(): ViewRow[] { /* ... */ }
  private _buildFooterRows(): ViewRow[] { /* ... */ }
  private _toViewRow(row: DataRow, offsetIndex: number): ViewRow { /* ... */ }
}
```

**关键**：Grid Renderer 不依赖 CDK。它只计算"哪些行应该可见"。Angular Adapter 拿到 view 后，用 CDK 的 `CdkVirtualScrollViewport` 来渲染。

### 4.3 Group Renderer

```typescript
class GroupRenderer implements DataWindowRenderer {
  readonly mode = 'group';

  get view(): DataWindowView {
    const grouped = this._groupBy(this._state.rows, this._state.config.groupBy!.field);
    const flatRows: ViewRow[] = [];

    for (const [key, rows] of grouped) {
      // 分组行
      flatRows.push({
        id: `group-${key}`,
        type: 'group',
        cells: [{ field: '__group', value: key, formatted: `${key} (${rows.length})`, editable: false, highlighted: false }],
        depth: 0,
        status: 'normal',
        raw: null,
      });

      // 数据行（如果未折叠）
      if (!this._state.collapsedGroups.has(key)) {
        for (const row of rows) {
          flatRows.push(this._toViewRow(row, 1)); // depth=1, 缩进一级
        }
      }
    }

    return { /* ... */ bodyRows: flatRows, /* ... */ };
  }
}
```

### 4.4 Tree Renderer

```typescript
class TreeRenderer implements DataWindowRenderer {
  readonly mode = 'tree';

  get view(): DataWindowView {
    const tree = this._buildTree(this._state.rows, this._state.config.treeField!);
    const flatRows: ViewRow[] = [];

    const traverse = (nodes: TreeNode[], depth: number) => {
      for (const node of nodes) {
        flatRows.push(this._toViewRow(node.row, depth));
        if (node.children.length > 0 && this._state.treeExpanded.has(node.row._id)) {
          traverse(node.children, depth + 1);
        }
      }
    };

    traverse(tree, 0);
    return { /* ... */ bodyRows: flatRows, /* ... */ };
  }
}
```

### 4.5 Display Mode Priority

| Mode | Priority | Description | Dependencies |
|------|----------|-------------|-------------|
| Grid | P0 | 虚拟滚动表格，10万+ 行 | Virtual Scroll |
| Form | P1 | 单行编辑表单 | — |
| Group | P1 | 分组折叠视图 | Grid |
| Tree | P1 | 树形展示 | Grid |
| Report | P1 | 打印友好布局 | Grid |
| Card | P2 | 卡片布局 | — |
| MasterDetail | P2 | 主从联动 | Grid + Form |
| TreeGrid | P2 | 树形 × Grid | Tree + Grid |
| Export | P2 | 导出视图 | — |
| Pivot | P3 | 行列转换 | Aggregation |
| Gantt | P3 | 时间轴 | Custom Cell |

---

## 5. Adapter Layer — Framework Bridge

### 5.1 Adapter Interface

每个 UI 框架的适配层实现相同的接口：

```typescript
interface DataWindowAdapter {
  // 生命周期
  mount(container: Element, config: DataWindowConfig): void;
  unmount(): void;

  // 数据绑定
  bindDataStore(store: DataStore): void;

  // 渲染
  render(view: DataWindowView): void;

  // 事件转发
  onUserAction(action: UserAction): void;

  // 主题
  applyTheme(theme: DataWindowTheme): void;
}

type UserAction =
  | { type: 'row-click'; rowId: string; event: MouseEvent }
  | { type: 'cell-edit'; rowId: string; field: string; value: any }
  | { type: 'sort'; field: string; direction: 'asc' | 'desc' | '' }
  | { type: 'filter'; field: string; value: any }
  | { type: 'scroll'; offset: number }
  | { type: 'group-toggle'; groupKey: string }
  | { type: 'tree-toggle'; nodeId: string }
  | { type: 'page-change'; pageIndex: number; pageSize: number }
  | { type: 'selection-change'; selectedIds: Set<string> }
  | { type: 'column-resize'; field: string; width: number }
  | { type: 'column-reorder'; fromIndex: number; toIndex: number };
```

### 5.2 Angular Adapter

Angular 适配层的职责：

1. **DataStoreObserver → Signal** — 把 DataStore 事件翻译成 Angular Signal 更新
2. **View → Template** — 把 DataWindowView 翻译成 Angular 模板渲染
3. **UserAction → DataStore** — 把用户操作翻译成 DataStore API 调用
4. **CDK Integration** — 用 CdkVirtualScrollViewport 实现虚拟滚动
5. **Material Theme** — 用 Material 主题系统

```typescript
// Angular Adapter 核心 — 约 300-500 行
@Component({
  selector: 'dw-data-window',
  template: `
    <dw-grid-renderer *ngIf="mode === 'grid'"
      [view]="view()"
      [theme]="theme()"
      (userAction)="handleUserAction($event)">
    </dw-grid-renderer>
    <!-- 其他模式组件 -->
  `
})
class AngularDataWindowComponent implements OnInit, OnDestroy {
  // Signal 绑定
  view = computed(() => this._renderer.view);
  private _adapter = new AngularDataStoreAdapter();
  private _renderer: DataWindowRenderer;

  // CDK 虚拟滚动集成
  @ViewChild(CdkVirtualScrollViewport) viewport!: CdkVirtualScrollViewport;

  ngOnInit() {
    this._dataStore.subscribe(this._adapter);
    this._adapter.rows$.subscribe(rows => {
      this._renderer.update({ rows, config: this._config, ... });
    });
  }

  handleUserAction(action: UserAction) {
    switch (action.type) {
      case 'scroll':
        this._renderer.onScroll(action.offset);
        break;
      case 'cell-edit':
        this._dataStore.updateRow(action.rowId, { [action.field]: action.value });
        break;
      // ...
    }
  }
}
```

### 5.3 Vue Adapter

```typescript
// Vue 3 Composable — 约 300-500 行
function useDataWindow(config: DataWindowConfig) {
  const store = new DataStoreImpl(config);
  const adapter = new VueDataStoreAdapter();
  const renderer = createRenderer(config.mode || 'grid');

  const view = ref<DataWindowView>(renderer.view);
  const loading = ref(false);

  store.subscribe({
    ...adapter,
    onRowsChanged(change) {
      adapter.onRowsChanged(change);
      renderer.update({ rows: adapter.rows.value, config, ... });
      view.value = renderer.view;
    }
  });

  function handleUserAction(action: UserAction) {
    // 同 Angular — 翻译为 DataStore API 调用
  }

  return { view, loading, handleUserAction, store };
}
```

### 5.4 React Adapter

```typescript
// React Hook — 约 300-500 行
function useDataWindow(config: DataWindowConfig) {
  const storeRef = useRef(new DataStoreImpl(config));
  const rendererRef = useRef(createRenderer(config.mode || 'grid'));
  const [view, setView] = useState<DataWindowView>(rendererRef.current.view);

  useEffect(() => {
    const store = storeRef.current;
    const renderer = rendererRef.current;
    const adapter = new ReactDataStoreAdapter((state) => {
      renderer.update(state);
      setView(renderer.view);
    });
    store.subscribe(adapter);
    return () => store.unsubscribe(adapter);
  }, []);

  const handleUserAction = useCallback((action: UserAction) => {
    // 同 Angular — 翻译为 DataStore API 调用
  }, []);

  return { view, handleUserAction, store: storeRef.current };
}
```

### 5.5 Adapter 代码量估算

| Adapter | 预估代码量 | 依赖 |
|---------|-----------|------|
| Angular | 300-500 行 | @angular/core, @angular/cdk, @angular/material |
| Vue 3 | 300-500 行 | vue, element-plus / vuetify (可选) |
| React | 300-500 行 | react, react-dom, @mui/material (可选) |
| Vanilla JS | 200-400 行 | 无 |

---

## 6. Virtual Scroll Architecture

### 6.1 Problem Recap

CDK `CdkVirtualScrollViewport` + `mat-table` 不兼容：
- mat-table 渲染 `<table>→<tbody>→<tr>` 三层嵌套
- CDK viewport 期望 `*cdkVirtualFor` 直接控制子元素渲染
- 包裹 mat-table 在 viewport 里只做了视觉裁剪，不是真正的虚拟滚动

### 6.2 Solution: CDK VirtualScrollStrategy + Div Rows

**不放弃 CDK，正确使用 CDK：**

1. 用 `cdk-virtual-scroll-viewport` 作为滚动容器（CDK 处理滚动事件、触摸手势、键盘导航）
2. 自研 `DataWindowVirtualScrollStrategy` 继承 CDK 的 `VirtualScrollStrategy`（CDK 设计就是可扩展的）
3. 用 div 行代替 mat-table 行（Renderer 输出 ViewRow，Adapter 翻译为 div）
4. 固定行高 36px，bufferSize 可配置

```typescript
// 自研滚动策略 — 继承 CDK 协议
class DataWindowVirtualScrollStrategy extends VirtualScrollStrategy {
  private _viewport: CdkVirtualScrollViewport | null = null;
  private _itemSize = 36;
  private _bufferSize = 10;

  attach(viewport: CdkVirtualScrollViewport): void {
    this._viewport = viewport;
    this._updateRenderedRange();
  }

  detach(): void {
    this._viewport = null;
  }

  onContentScrolled(): void {
    this._updateRenderedRange();
  }

  setDataLength(length: number): void {
    this._viewport?.setTotalContentSize(length * this._itemSize);
    this._updateRenderedRange();
  }

  scrollToIndex(index: number): void {
    this._viewport?.scrollToOffset(index * this._itemSize);
  }

  private _updateRenderedRange(): void {
    const vp = this._viewport;
    if (!vp) return;

    const scrollOffset = vp.measureScrollOffset();
    const viewportSize = vp.getViewportSize();
    const dataLength = vp.getDataLength();

    const firstVisible = Math.floor(scrollOffset / this._itemSize);
    const visibleCount = Math.ceil(viewportSize / this._itemSize);

    const start = Math.max(0, firstVisible - this._bufferSize);
    const end = Math.min(dataLength, firstVisible + visibleCount + this._bufferSize);

    vp.setRenderedRange({ start, end });
    vp.setRenderedContentOffset(start * this._itemSize);
  }
}
```

### 6.3 Why Not Pure Custom (Self-Built) Virtual Scroll?

| 对比项 | 纯自研 | CDK VirtualScrollStrategy |
|--------|--------|--------------------------|
| 滚动事件节流 | 自己写 rAF | CDK 内置 |
| 触摸手势 | 自己处理 | CDK 内置 |
| 键盘导航 | 自己写 | CDK 内置 |
| Angular OnPush 集成 | 需特殊处理 | CDK 原生支持 |
| 维护成本 | 高 | 低（Google 维护核心） |
| 跨框架复用 | 可以 | 仅 Angular（但 Renderer 层可复用） |

**结论**：Angular Adapter 用 CDK Strategy；Vue/React Adapter 用各自生态的虚拟滚动方案（Vue Virtual Scroller / React Window）。Renderer 层的虚拟滚动计算逻辑完全可复用。

### 6.4 Fixed Row Height vs Dynamic

当前选择**固定行高 36px**。原因：
1. 虚拟滚动计算简单高效 O(1)
2. 10万+ 行性能无压力
3. 后续可扩展：引入 Fenwick Tree（RowHeightCache）支持动态行高

```typescript
// 预留动态行高接口
interface RowHeightStrategy {
  getHeight(rowIndex: number, row: DataRow): number;
  getTotalHeight(rows: DataRow[]): number;
  getRowIndexAtOffset(offset: number): number;
}

// 固定行高实现（当前）
class FixedRowHeightStrategy implements RowHeightStrategy {
  constructor(private _height = 36) {}
  getHeight() { return this._height; }
  getTotalHeight(rows: DataRow[]) { return rows.length * this._height; }
  getRowIndexAtOffset(offset: number) { return Math.floor(offset / this._height); }
}

// 动态行高实现（v2.0 计划）— Fenwick Tree
class DynamicRowHeightStrategy implements RowHeightStrategy {
  private _cache = new RowHeightCache(); // Fenwick Tree
  getHeight(index: number) { return this._cache.getHeight(index); }
  getTotalHeight() { return this._cache.getCumulativeHeight(-1); }
  getRowIndexAtOffset(offset: number) { return this._cache.findRowIndex(offset); }
}
```

---

## 7. Data Flow

### 7.1 Read Path (Data → UI)

```
DataStore._mainRows
    │
    ├── DataStore.query(options)  ────  Filter + Sort + Pagination
    │
    ▼
DataStoreObserver.onRowsChanged(change)
    │
    ├── AngularAdapter._rows.set(change.rows)
    │   VueAdapter.rows.value = change.rows
    │   ReactAdapter.setState(...)
    │
    ▼
Renderer.update(state)
    │
    ├── 计算 ViewRow[]（虚拟滚动范围、分组、树形展开等）
    │
    ▼
Adapter.render(view)
    │
    ├── Angular: Signal → Template → DOM
    │   Vue: Ref → Template → DOM
    │   React: State → JSX → DOM
```

### 7.2 Write Path (UI → Data)

```
User Interaction (click / edit / sort / filter)
    │
    ▼
Adapter.onUserAction(action)
    │
    ├── UserAction → DataStore API 调用
    │   cell-edit → DataStore.updateRow()
    │   sort → DataStore.sort() → onRowsChanged
    │   filter → DataStore.applyFilter() → onRowsChanged
    │   selection → DataStore.selectRow()
    │
    ▼
DataStore 内部处理
    │
    ├── ItemChanged 事件链（可拦截、可拒绝）
    ├── Change Tracking（列级变更记录）
    ├── UndoStack（Command 入栈）
    │
    ▼
DataStoreObserver 回调
    │
    ▼
Adapter 更新 Signal/Ref/State → UI 刷新
```

### 7.3 Initialization Flow

```
1. Component 创建
2. Adapter.mount(container, config)
3. DataStore 初始化
4. DataStore.query() → 首次数据加载
5. Renderer.update(state) → 计算 View
6. Adapter.render(view) → 首次渲染
7. 用户交互 → Write Path 循环
```

---

## 8. Theme System

### 8.1 CSS Custom Properties

所有视觉样式通过 CSS Custom Properties 暴露，不绑定任何 CSS 框架：

```css
:root {
  /* 布局 */
  --dw-row-height: 36px;
  --dw-header-height: 36px;
  --dw-footer-height: 36px;
  --dw-cell-padding: 0 12px;
  --dw-border-color: #e0e0e0;

  /* 行状态 */
  --dw-row-selected-bg: #bbdefb;
  --dw-row-new-bg: #c8e6c9;
  --dw-row-modified-bg: #fff9c4;
  --dw-row-deleted-bg: #ffcdd2;
  --dw-row-hover-bg: #f5f5f5;

  /* 高亮（实时数据变更） */
  --dw-highlight-bg: #fff176;
  --dw-highlight-duration: 2000ms;

  /* 固定列 */
  --dw-sticky-shadow: -2px 0 6px rgba(0, 0, 0, 0.08);
  --dw-sticky-z-index: 10;

  /* 虚拟滚动 */
  --dw-virtual-buffer: 10;
  --dw-resize-handle-width: 4px;
}
```

### 8.2 Adapter Theme Mapping

```typescript
// Angular: CSS Variables → Material Theme
// (CSS Variables 直接生效，无需映射)

// Vue: CSS Variables → Element Plus Theme
// (CSS Variables 直接生效，无需映射)

// React: CSS Variables → MUI Theme
// (CSS Variables 直接生效，无需映射)
```

CSS Custom Properties 的优势：所有 UI 框架的组件都运行在浏览器里，都支持 CSS Variables。一次定义，处处生效。

---

## 9. Package Structure

### 9.1 Monorepo Layout

```
ngx-datawindow/
├── packages/
│   ├── core/                    # DataStore Engine (Framework-Free)
│   │   ├── src/
│   │   │   ├── datastore.ts
│   │   │   ├── filter.ts
│   │   │   ├── sorter.ts
│   │   │   ├── aggregator.ts
│   │   │   ├── undo-stack.ts
│   │   │   ├── change-tracking.ts
│   │   │   ├── item-changed.ts
│   │   │   ├── models.ts
│   │   │   ├── renderer/            # Presentation Engine
│   │   │   │   ├── renderer.ts      # Renderer interface
│   │   │   │   ├── grid.ts          # GridRenderer (virtual scroll)
│   │   │   │   ├── form.ts          # FormRenderer
│   │   │   │   ├── group.ts         # GroupRenderer
│   │   │   │   ├── tree.ts          # TreeRenderer
│   │   │   │   ├── report.ts        # ReportRenderer
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── angular/                 # Angular Adapter
│   │   ├── src/
│   │   │   ├── adapter.ts           # AngularDataStoreAdapter
│   │   │   ├── component.ts         # DataWindowComponent
│   │   │   ├── virtual-scroll.ts    # DataWindowVirtualScrollStrategy
│   │   │   ├── templates/           # Angular templates
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── vue/                     # Vue Adapter (Phase 2)
│   │   ├── src/
│   │   │   ├── adapter.ts
│   │   │   ├── composable.ts        # useDataWindow()
│   │   │   ├── components/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── react/                   # React Adapter (Phase 2)
│       ├── src/
│       │   ├── adapter.ts
│       │   ├── hook.ts              # useDataWindow()
│       │   ├── components/
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── examples/
│   ├── angular-demo/            # Angular + Material demo
│   ├── vue-demo/                # Vue + Element Plus demo
│   └── react-demo/              # React + MUI demo
│
├── docs/
│   ├── architecture-v2.md       # 本文档
│   ├── virtual-scroll-redesign.md
│   ├── roadmap-v1.1.0.md
│   └── cdk-research.md
│
└── package.json                 # Workspace root
```

### 9.2 Package Dependencies

```
@datawindow/core        → 零依赖 (纯 TypeScript)
@datawindow/angular     → @datawindow/core, @angular/core, @angular/cdk
@datawindow/vue         → @datawindow/core, vue
@datawindow/react       → @datawindow/core, react
```

---

## 10. Migration Guide

### 10.1 From Current ngx-datawindow to Architecture v2

当前状态：DataStore + Service + Component 紧耦合在 Angular 项目中。

迁移步骤：

1. **提取 Core** — 将 DataStore Engine 从 `projects/ngx-datawindow/src/lib/` 移到 `packages/core/src/`
2. **提取 Renderer** — 将虚拟滚动计算逻辑从 Component 移到 `packages/core/src/renderer/`
3. **创建 Angular Adapter** — 将 Angular 特定代码（Signal、CDK、Material）移到 `packages/angular/`
4. **验证** — Angular Demo 使用新架构运行，功能不变
5. **创建 Vue/React Adapter** — 基于相同的 Core，各自实现薄适配层

### 10.2 Breaking Changes

- `DataTableService` 拆分：数据逻辑归 Core，Angular Signal 归 Adapter
- `datatable.component.ts` 大幅瘦身：只保留 Angular 模板和 Adapter 调用
- Virtual Scroll 模板从 `mat-table` 改为 div 行结构
- `models.ts` 类型从 Angular 项目移到 Core 包

### 10.3 Compatibility Layer

迁移期间提供兼容层：

```typescript
// 兼容层 — 让现有用户代码不需要修改
import { DataTableComponent } from 'ngx-datawindow';
// 内部自动路由到 @datawindow/angular
```

---

## 11. Implementation Roadmap

### Phase 1: Core + Angular Virtual Scroll (2-3 days)

1. 重构 `packages/core/` — 提取 DataStore + Renderer
2. 实现 `DataWindowVirtualScrollStrategy`
3. 实现 `GridRenderer` — 虚拟滚动计算
4. 实现 `AngularDataStoreAdapter`
5. Angular Demo 虚拟滚动正常工作
6. 10万行数据流畅滚动

### Phase 2: Angular Display Modes (2-3 days)

1. FormRenderer — 单行编辑表单
2. GroupRenderer — 分组折叠
3. TreeRenderer — 树形展示
4. ReportRenderer — 打印布局
5. 模式切换动画

### Phase 3: Polish & Release (1-2 days)

1. Theme System (CSS Variables)
2. Accessibility (ARIA)
3. Unit Tests
4. API Documentation
5. npm publish @datawindow/core + @datawindow/angular

### Phase 4: Cross-Framework (3-5 days)

1. Vue Adapter + Demo
2. React Adapter + Demo
3. Vanilla JS Adapter + Demo
4. Framework comparison documentation

### Phase 5: Advanced Features (Ongoing)

1. Dynamic Row Height (Fenwick Tree)
2. Column Reorder (Drag & Drop)
3. Pivot Table
4. Gantt Chart
5. WebSocket Real-time Feed Demo

---

## 12. Success Metrics

| 指标 | 目标 |
|------|------|
| 10万行虚拟滚动 | < 16ms frame time, 60fps |
| Core 包大小 | < 20KB gzip |
| Angular Adapter | < 15KB gzip |
| Vue/React Adapter | < 15KB gzip |
| 总包大小 (Core + 1 Adapter) | < 50KB gzip |
| 跨框架功能一致性 | 100% API 一致 |
| Tree-shaking | 未使用的 Display Mode 不打包 |

---

> **DataWindow is not a table component. It's a data interaction paradigm.**
> **Tables are just one way to look at data.**
