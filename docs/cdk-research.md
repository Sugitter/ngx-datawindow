# Angular CDK Table + Virtual Scroll 深入研究

> 学习日期: 2026-04-30
> 目标: 为 ngx-datawindow 重构做准备

---

## 一、CDK Table 核心架构

### 1.1 核心概念

CDK Table 是 Material Table 的底层实现，提供：

- **CdkTable** — 容器组件，管理行渲染
- **CdkColumnDef** — 列定义指令
- **CdkCellDef / CdkHeaderCellDef / CdkFooterCellDef** — 单元格模板
- **CdkHeaderRowDef / CdkRowDef / CdkFooterRowDef** — 行定义

### 1.2 列定义机制

```typescript
class CdkColumnDef {
  name: string;           // 列标识
  sticky: boolean;        // 左固定
  stickyEnd: boolean;     // 右固定

  cell: CdkCellDef;       // 单元格模板
  headerCell: CdkHeaderCellDef;
  footerCell: CdkFooterCellDef;
}
```

**关键点：**
- `sticky` / `stickyEnd` 实现列冻结
- `ContentChild` 查询获取模板引用
- CSS 类名自动生成 (`cdk-column-{name}`)

### 1.3 行渲染机制

```typescript
class CdkRowDef<T> {
  columns: Iterable<string>;  // 显示的列
  when: (index: number, rowData: T) => boolean;  // 条件渲染

  // 行数据通过 template context 传入
}
```

**渲染流程：**
1. `CdkTable` 接收 `dataSource`
2. 遍历数据，为每行创建 `CdkRow`
3. 根据 `CdkRowDef.columns` 渲染单元格
4. 单元格使用 `CdkCellDef.template` 渲染

### 1.4 DataSource 抽象

```typescript
abstract class DataSource<T> {
  abstract connect(collectionViewer: CollectionViewer): Observable<T[]>;
  abstract disconnect(): void;
}
```

**自定义 DataSource 示例：**

```typescript
class RealtimeDataSource extends DataSource<StockQuote> {
  private data$ = new BehaviorSubject<StockQuote[]>([]);

  connect(): Observable<StockQuote[]> {
    return this.data$;
  }

  disconnect() {
    this.data$.complete();
  }

  update(data: StockQuote[]) {
    this.data$.next(data);
  }
}
```

---

## 二、CDK Virtual Scroll 核心机制

### 2.1 虚拟滚动原理

CDK 虚拟滚动通过以下方式实现：

1. **固定高度容器** — 只渲染可视区域
2. **占位空间** — 用 `transform` 模拟总高度
3. **动态渲染范围** — 滚动时更新 `renderedRange`

### 2.2 FixedSizeVirtualScrollStrategy

```typescript
class FixedSizeVirtualScrollStrategy {
  itemSize: number;       // 固定行高
  minBufferPx: number;    // 最小缓冲区
  maxBufferPx: number;    // 最大缓冲区

  attach(viewport: CdkVirtualScrollViewport) {}
  detach() {}

  onContentScrolled() {
    this._updateRenderedRange();
  }

  _updateRenderedRange() {
    // 计算可见范围 + 缓冲区
    // 设置 viewport.setRenderedRange(newRange)
  }
}
```

**关键点：**
- 只支持固定行高 (`itemSize`)
- 缓冲区减少滚动闪烁
- 通过 `renderedRange` 控制渲染项

### 2.3 CdkVirtualScrollViewport

```typescript
class CdkVirtualScrollViewport {
  setRenderedRange(range: ListRange): void;
  setRenderedContentOffset(offset: number): void;
  setTotalContentSize(size: number): void;
  measureScrollOffset(): number;
  getViewportSize(): number;
  getDataLength(): number;
}
```

### 2.4 虚拟滚动与表格的兼容性问题

**问题：** `cdk-virtual-scroll-viewport` 与 `mat-table` 渲染机制冲突

原因：
1. `cdk-virtual-scroll-viewport` 期望直接的子元素结构
2. `mat-table` 使用 `<table>` 结构，行是 `<tr>`
3. 两者对 DOM 结构的期望不一致

**解决方案：**

方案 A：放弃 `<table>` 结构，使用 `<div>` 模拟表格
- 优点：完全兼容 CDK 虚拟滚动
- 缺点：丢失表格语义，屏幕阅读器不友好

方案 B：自研虚拟滚动，基于 `<table>` 结构
- 优点：保留表格语义
- 缺点：需要实现 `RowHeightCache`（Fenwick Tree）

方案 C：使用 `@angular/cdk/scrolling` 的 `CdkVirtualForOf` 指令
- 在 `<tbody>` 上使用虚拟渲染
- 需要特殊处理表头固定

---

## 三、Material Table 扩展点

### 3.1 自定义单元格渲染

```html
<ng-container matColumnDef="price">
  <th mat-header-cell *matHeaderCellDef> Price </th>
  <td mat-cell *matCellDef="let row">
    <span [style.color]="row.change >= 0 ? 'green' : 'red'">
      {{ row.price | currency }}
    </span>
  </td>
  <td mat-footer-cell *matFooterCellDef>
    {{ totalPrice | currency }}
  </td>
</ng-container>
```

### 3.2 粘性行/列

```html
<tr mat-header-row *matHeaderRowDef="columns; sticky: true"></tr>
<tr mat-row *matRowDef="let row; columns: columns"></tr>
<tr mat-footer-row *matFooterRowDef="columns; sticky: true"></tr>
```

**列粘性：**
```html
<ng-container matColumnDef="name" sticky>
  ...
</ng-container>
```

### 3.3 自定义 DataSource

```typescript
@Injectable()
class PaginatedDataSource extends DataSource<any> {
  private pageSize = new BehaviorSubject<number>(10);
  private pageIndex = new BehaviorSubject<number>(0);

  connect(): Observable<any[]> {
    return combineLatest([
      this.pageSize,
      this.pageIndex
    ]).pipe(
      switchMap(([size, index]) =>
        this.http.get(`/api/data?page=${index}&size=${size}`)
      )
    );
  }
}
```

---

## 四、重构建议

### 4.1 架构调整

**当前问题：**
- DataStore 是外部状态，组件需要同步
- 虚拟滚动与 MatTable 不兼容
- 列固定需要使用 Material 的 sticky 机制

**建议方向：**

1. **保留 MatTable，放弃 CDK 虚拟滚动**
   - 使用 MatTable 原生 sticky
   - 大数据量使用分页，不做虚拟滚动
   - 简化实现，聚焦核心功能

2. **如果必须支持虚拟滚动**
   - 放弃 `<table>` 结构
   - 使用 `<div>` 布局 + CDK 虚拟滚动
   - 参考 ngx-datatable 的实现

### 4.2 列冻结实现

```typescript
// 在 ColumnConfig 中添加
interface ColumnConfig {
  field: string;
  sticky?: 'left' | 'right';  // 列冻结
}

// 组件中设置
columnDef.sticky = config.sticky === 'left';
columnDef.stickyEnd = config.sticky === 'right';
```

### 4.3 固定汇总行实现

**方案：** 分离汇总行，固定在底部

```html
<div class="dt-container">
  <div class="dt-scroll-body">
    <table mat-table [dataSource]="dataSource">
      <!-- columns -->
    </table>
  </div>
  <div class="dt-fixed-footer" *ngIf="aggregations">
    <table class="dt-footer-table">
      <!-- 汇总行，与主表格列宽对齐 -->
    </table>
  </div>
</div>
```

**CSS：**
```scss
.dt-scroll-body {
  overflow-y: auto;
  max-height: calc(100vh - 200px);
}

.dt-fixed-footer {
  position: sticky;
  bottom: 0;
  background: white;
  border-top: 2px solid #e0e0e0;
}
```

---

## 五、后续研究

### 5.1 ngx-datatable 架构

需要研究：
- `RowHeightCache` (Fenwick Tree) 实现
- `CellContext` 接口设计
- 模板系统 (`cellTemplate`, `headerTemplate`)

### 5.2 动态行高

CDK 的 `AutoSizeVirtualScrollStrategy` 支持动态行高，但：
- 需要测量每个元素
- 性能开销大
- 与 MatTable 不兼容

### 5.3 树形/分组展示

- 使用 `when` predicate 条件渲染不同行
- 展开/折叠通过数据驱动
- 需要维护扁平化后的展示数据

---

## 六、参考资料

- [CDK Table API](https://material.angular.io/cdk/table/overview)
- [CDK Virtual Scroll](https://material.angular.io/cdk/scrolling/overview)
- [Material Table](https://material.angular.io/components/table/overview)
- ngx-datatable 源码 (node_modules/@swimlane/ngx-datatable)
