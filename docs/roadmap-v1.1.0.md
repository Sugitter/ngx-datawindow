# ngx-datawindow v1.1.0 开发计划

> 基于 @swimlane/ngx-datatable (4669 stars) 架构分析，2026-04-29 制定

## 阶段 A（1-2天）：基础设施增强

### Feature 4: 多选模式增强
**参考 ngx-datatable SelectionType**:
```typescript
enum SelectionType {
  single     = 'single',     // 单选（单击行选中）
  multi      = 'multi',      // 多选（Ctrl/Shift + 点击）
  multiClick = 'multiClick', // 点击即多选
  checkbox   = 'checkbox',  // 复选框（已有）
  cell       = 'cell',       // 单元格选择
}
```
**实现要点**:
- DataTableService 增加 `setSelectionType(type)` 方法
- Ctrl+点击追加选择，Shift+点击范围选择
- `selectedRows: Set<RowId>` 输出事件

### Feature 5: 列固定 (Column Pinning)
**参考 ngx-datatable**: `frozenLeft`, `frozenRight`
```typescript
{ field: 'id', header: 'ID', frozenLeft: true }
{ field: 'actions', header: '操作', frozenRight: true }
```
**实现要点**:
- CDK Virtual Scroll 不支持多列 sticky，用三个 table 分别渲染 left/center/right
- 或用 CSS `position: sticky` 配合 `z-index`

---

## 阶段 B（2-3天）：高级特性

### Feature 3: 模板系统 (Template System)
**参考 ngx-datatable**: `cellTemplate`, `headerTemplate`
```
<ngx-datawindow>
  <!-- 单元格自定义 -->
  <ng-template dtCell let-row let-col="col">
    @if (col.field === 'avatar') { <img [src]="row.avatar"> }
    @else if (col.field === 'actions') { <button>编辑</button> }
    @else { {{ row[col.field] }} }
  </ng-template>

  <!-- 表头自定义 -->
  <ng-template dtHeader let-col>
    {{ col.header }}
    @if (col.sortable) { <mat-icon>sort</mat-icon> }
  </ng-template>

  <!-- 行详情展开 -->
  <ng-template dtDetail let-row>
    详情信息: {{ row.description }}
  </ng-template>
</ngx-datawindow>
```
**实现要点**:
- Angular `ContentChild` + `TemplateRef` 接收投影模板
- CellContext / HeaderContext / RowDetailContext 接口
- 支持 `ngTemplateOutlet` 动态渲染

### Feature 1: 行分组 (Row Grouping)
**参考 ngx-datatable**: `DatatableGroupHeaderDirective`
```
分组字段: category
├── 电子产品 (5)
│   ├── MacBook Pro ...
│   └── iPhone 15 ...
├── 办公用品 (3)
└── ...
```
**实现要点**:
- DataStore 增加 `groupBy(field)` 方法，按字段值分组
- 组件增加 `groupHeaderTemplate` Input
- 展开/折叠分组，聚合统计（count/sum/avg）
- 分组行特殊样式（背景 #f5f5f5，加粗字体）

### Feature 2: 树形展示 (Tree Display)
**参考 ngx-datatable**: `isTreeColumn` + `treeLevelIndent`
```
├── 研发部
│   ├── 前端组
│   │   ├── 张三
│   │   └── 李四
│   └── 后端组
└── ...
```
**实现要点**:
- DataStore 增加 `treeData` 支持（`level`, `expanded`, `children`）
- 组件增加 `treeColumn` Input（指定哪列显示展开箭头）
- CDK Tree 或手写递归模板
- 懒加载子节点支持（`loadChildren` callback）
- 展开/折叠图标，支持 loading 状态

---

## 阶段 C（1天）

- Demo 截图更新
- 文档更新
- v1.1.0 release

---

## ngx-datatable 关键架构参考

### 组件自管理状态（vs DataStore 外部化）
ngx-datatable 组件内部管理 rows/selection/sort/filter/group/tree，DataStore 是内部实现细节。
当前 ngx-datawindow 的 DataStore 外部化设计（组件通过 service 读写 DataStore）需要重新评估是否契合 Angular 响应式模式。

### CSS 变量主题系统
```scss
--dt-primary: #1976d2;
--dt-selected-active-background: #bbdefb;
--dt-header-cell-background: #fafafa;
--dt-body-row-border-bottom: #e0e0e0;
```
统一设计令牌，便于主题切换。

### RowHeightCache (Fenwick Tree)
虚拟滚动行高 O(log n) 查询，支持动态行高（展开详情后自动调整）。

### CellContext 接口
```typescript
interface CellContext {
  row: any;
  value: any;
  column: ColumnConfig;
  rowIndex: number;
  rowHeight: number;
  isSelected: boolean;
  treeStatus: 'collapsed' | 'expanded' | 'loading';
  activateFn: () => void;
  onCheckboxChangeFn: (checked: boolean) => void;
}
```

## 已知架构问题（待决策）

1. **DataStore 位置**: 组件自管理 vs 服务外部化？当前设计可能导致状态同步复杂性
2. **虚拟滚动**: CDK 不支持动态行高（分组展开、树形），需自研或替换
3. **事件方向**: 当前事件从组件流向 DataStore（反向），ngx-datatable 是组件内部处理后输出最终状态