# ngx-datawindow 虚拟滚动重构方案

> 学习日期: 2026-04-30
> 目标: 支持 5万+ 行数据流畅滚动，保留 DataWindow 核心体验

---

## 一、问题分析

### 1.1 当前障碍

CDK viewport 与 MatTable 不兼容，原因：

```
CDK Virtual Scroll 的期望结构:
<div cdk-virtual-scroll-viewport>
  <div *cdkVirtualFor="let row of rows">   ← 每项直接是 DOM 元素
    {{ row.name }}
  </div>
</div>

MatTable 的实际结构:
<table mat-table>
  <ng-container matColumnDef="name">
    <td mat-cell>{{ row.name }}</td>   ← 嵌套在 table/tbody/tr 下
  </ng-container>
  <tr mat-row *matRowDef></tr>
</table>
```

- CDK 虚拟滚动要求直接子元素是渲染项
- MatTable 渲染 `<table>` → `<tbody>` → `<tr>`，层级太深
- CDK 无法识别 table 结构中的行，导致虚拟滚动失效

### 1.2 用户需求

- **几万条数据随意滚动**，不卡顿
- 滚动时**保持流畅 60fps**
- **保留表格语义**（排序、过滤、列固定、分组）
- **不翻页**，用户习惯于直接滚动定位

---

## 二、重构方案：div 虚拟表格

### 2.1 架构概览

```
┌─────────────────────────────────────────┐
│  dt-header (固定表头)                    │
│  ┌──────┬──────────┬────────┬─────────┐ │
│  │ 复选 │ 订单号   │ 客户   │ 操作    │ │
│  └──────┴──────────┴────────┴─────────┘ │
├─────────────────────────────────────────┤
│  dt-body (虚拟滚动区域)                  │
│  ┌─────────────────────────────────────┐ │
│  │ [rendered rows via transform]       │ │  ← 只渲染可见行
│  │                                     │ │
│  │                                     │ │
│  │ ← 滚动时动态计算可见范围 →           │ │
│  │                                     │ │
│  └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│  dt-footer (固定汇总行，可选)            │
└─────────────────────────────────────────┘
```

### 2.2 关键技术点

#### 固定行高 + transform 定位

```typescript
const ROW_HEIGHT = 36; // 固定行高
const BUFFER_SIZE = 10; // 上下缓冲区行数

// 滚动时计算可见范围
onScroll(event: Event): void {
  const scrollTop = (event.target as HTMLElement).scrollTop;
  const viewportHeight = this.viewportHeight;

  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER_SIZE);
  const endIndex = Math.min(
    this.totalRows(),
    Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + BUFFER_SIZE
  );

  this.renderedRange = { start: startIndex, end: endIndex };
}
```

#### 行渲染

```html
<div class="dt-body" (scroll)="onScroll($event)">
  <!-- 占位空间：总高度撑开滚动条 -->
  <div class="dt-spacer" [style.height.px]="totalRows() * ROW_HEIGHT">
    <!-- 可见行：相对占位空间定位 -->
    <div class="dt-rows"
      [style.transform]="'translateY(' + (renderedRange.start * ROW_HEIGHT) + 'px)'">
      @for (row of visibleRows(); track row.id) {
        <div class="dt-row"
             [style.height.px]="ROW_HEIGHT"
             [class.selected]="isSelected(row.id)">
          @for (col of columns; track col.field) {
            <div class="dt-cell" [style.width]="col.width">
              {{ row[col.field] }}
            </div>
          }
        </div>
      }
    </div>
  </div>
</div>
```

#### 列宽同步（关键）

表头和表体的列宽必须完全一致：

```scss
.dt-header, .dt-row {
  display: flex;
  .dt-cell:nth-child(1) { width: 40px; flex-shrink: 0; }  // 复选框列
  .dt-cell:nth-child(2) { width: 120px; flex-shrink: 0; } // 订单号
  .dt-cell:nth-child(3) { flex: 1; min-width: 100px; }     // 客户（弹性）
  // ...
}
```

### 2.3 固定列实现

左右固定列通过 CSS + JS 配合实现：

```scss
.dt-cell.fixed-left {
  position: sticky;
  left: 0;
  z-index: 1;
  background: white;
  box-shadow: 2px 0 4px rgba(0,0,0,0.1);
}

.dt-cell.fixed-right {
  position: sticky;
  right: 0;
  z-index: 1;
  background: white;
  box-shadow: -2px 0 4px rgba(0,0,0,0.1);
}
```

### 2.4 性能优化

1. **OnPush 变更检测 + trackBy** — 减少重渲染
2. **requestAnimationFrame** — 滚动节流
3. **DocumentFragment** — 批量 DOM 操作
4. **will-change: transform** — GPU 加速
5. **content-visibility: auto** — 离屏内容跳过布局

```scss
.dt-row {
  will-change: transform;
  content-visibility: auto;
  contain: layout style paint;
}
```

---

## 三、实现计划

### Phase 1: 核心虚拟滚动（3-4天）

**目标：** 实现 div 虚拟表格，保证 5万行流畅滚动

- [ ] 创建 `VirtualTableComponent` 基础组件
- [ ] 实现固定行高虚拟滚动（transform 定位）
- [ ] 固定表头（position: sticky）
- [ ] 滚动事件处理 + 可见范围计算
- [ ] 基础行渲染（数据列、选择列）

### Phase 2: 高级功能（2-3天）

- [ ] 列宽拖拽调整（记录到 localStorage）
- [ ] 左右固定列
- [ ] 行高动态测量（用于分组/展开行）
- [ ] 键盘导航（↑↓ 滚动、Enter 编辑）

### Phase 3: 集成 + 兼容层（2天）

- [ ] 替换现有 MatTable 渲染路径
- [ ] 保持 API 完全兼容（Input/Output 不变）
- [ ] 排序、过滤功能迁移到新渲染路径
- [ ] 单元测试 + E2E 测试

---

## 四、已知挑战

### 4.1 动态行高

分组展开、详情行会导致行高变化，与固定行高假设冲突：

**方案：**
1. 保持固定行高，展开用 accordion 形式（不改变行高）
2. 或实现 RowHeightCache（Fenwick Tree），记录每行高度
3. 初次渲染测量每行高度，缓存结果

### 4.2 固定汇总行

表尾汇总行需要：
- 固定在底部（position: sticky; bottom: 0）
- 列宽与表头完全对齐
- 滚动时保持可见

### 4.3 与现有 DataStore 集成

虚拟滚动需要：
- 直接读取 DataStore 的全量数据（不依赖分页）
- 分页模式走原有 MatTable 路径
- 虚拟滚动模式走新 div 路径

---

## 五、参考资料

- [CDK Virtual Scroll 源码分析](#cdk-researchmd)
- [Virtual Scrolling Deep Dive](https://web.dev/virtual-scrolling/)
- [ag-grid Virtual Row Rendering](https://www.ag-grid.com/javascript-data-grid/row-rendering/)
- ngx-datatable 虚拟滚动实现（需从 GitHub 克隆研究）
