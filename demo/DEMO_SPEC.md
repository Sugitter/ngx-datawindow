# Demo 重写规格书

## 目标
重写 `D:\workspace\ngx-datawindow\demo\src\app\pages\demo\demo.component.ts`，打造专业级演示应用。

## 技术约束
- Angular 21.2.10 standalone 组件
- 样式用内联 styles 数组（SCSS），不用外部文件
- 必须在 imports 中显式导入 DataTableComponent
- 数据字段类型用 `Record<string, RawValue>[]`
- TypeScript strict 模式

## 必须导入
```typescript
import { DataTableComponent, DataTableService, DataRow, RowId, RawValue, ToolbarEvent } from 'ngx-datawindow';
import { ToolbarAction, ColumnConfig, TableConfig, DataStoreConfig, AggregationFormula, UpdateData, ValidationResult } from 'ngx-datawindow';
```

## imports 数组必须包含
```typescript
imports: [
  CommonModule, FormsModule,
  MatTabsModule, MatCardModule, MatButtonModule, MatIconModule,
  MatDividerModule, MatChipsModule, MatBadgeModule, MatSnackBarModule,
  MatDialogModule, MatTooltipModule, MatFormFieldModule, MatInputModule,
  MatSelectModule, DataTableComponent,  // 必须有这个！
],
```

## API 注意事项

### DataTableComponent 的事件类型
- `@Output() toolbarAction` 发出 `ToolbarEvent`（即 `{ action: ToolbarAction }`）
- `@Output() rowAdded` 发出 `DataRow`
- `@Output() rowUpdated` 发出 `{ row: DataRow; changes: Record<string, unknown> }`
- `@Output() rowDeleted` 发出 `RowId`（number）
- `@Output() rowClicked` 发出 `{ row: DataRow; event: MouseEvent }`
- `@Output() selectionChanged` 发出 `Set<number>`

### DataTableService 方法
- `addRow(data: Record<string, RawValue>)` → DataRow
- `deleteRow(rowId: RowId)` → boolean
- `deleteSelected()` → number
- `restoreRow(rowId: RowId)` → boolean
- `updateRow(rowId: RowId, data)` → Promise<boolean>
- `setData(data: Record<string, RawValue>[])` → void
- `validate()` → ValidationResult
- `generateUpdates()` → UpdateData[]
- `commit()` → void
- `clearAllFilters()` → void
- `registerAggregation(formula: AggregationFormula)` → void
- `computeAllAggregations()` → Record<string, AggregationResult>
- `getDataStore()` → DataStoreImpl
- `getColumns()` → ColumnConfig[]

### ToolbarEvent 结构
```typescript
interface ToolbarEvent { action: ToolbarAction }
interface ToolbarAction { type: 'add' | 'delete' | 'refresh' | 'export' | 'custom'; id?: string; payload?: unknown }
```

### getActionLabel 方法签名
```typescript
getActionLabel(action: boolean | { icon?: string; label?: string } | undefined, fallback: string): string
```

## Demo 页面结构（7 个 Tab）

### Tab 1: 快速开始
- 展示最小化配置代码（用 `<pre><code>` 块展示）
- 一个最简单的 3 列 5 行表格

### Tab 2: 增删改查
- 员工数据（15 条）
- 多选、新增、删除、内联编辑（双击编辑）
- CSV/JSON 导出
- 校验 + 差异更新

### Tab 3: 虚拟计算列
- 订单数据（10 条）
- 虚拟列：小计=数量×单价，实付=数量×单价×(1-折扣)，利润=实付-成本
- 聚合结果实时显示

### Tab 4: 过滤与搜索
- 销售数据（15 条）
- 列过滤（select/text/number）+ 全局搜索

### Tab 5: 聚合统计
- 聚合卡片（sum/avg/count/min/max）
- 支持分组聚合

### Tab 6: 行操作与状态
- 行状态色标（new=绿/modified=黄/deleted=红）
- 缓冲区统计
- 恢复删除

### Tab 7: 大数据性能
- 生成 10000 行随机数据
- 虚拟滚动 enabled
- 显示渲染性能指标

## 样式要求
- 整体风格：干净、现代、专业
- 主色：#1976d2（蓝）
- Tab 导航：圆角按钮风格（非 Material Tabs）
- 操作栏：白色卡片 + 阴影
- 聚合卡片：渐变背景
- 代码块：深色背景 #263238，绿色文字 #aed581
- 功能说明框：浅蓝背景 #e3f2fd
- 响应式布局

## 数据集

### 员工数据
```
id, name, department, position, email, salary, hireDate, active
1-15 条记录，部门：技术部/销售部/财务部/人事部/市场部
```

### 订单数据
```
id, product, spec, quantity, unitPrice, discount, cost, status
1001-1010，产品：iPhone/MacBook/AirPods/iPad/Apple Watch/Sony/Samsung/Logitech/Keychron/Dell
```

### 销售数据
```
id, region, product, sales, cost
1-15，地区：华北/华东/华南/西南/东北
虚拟列 profit = sales - cost
```

## 输出
直接修改文件：`D:\workspace\ngx-datawindow\demo\src\app\pages\demo\demo.component.ts`
确保文件编码 UTF-8 无 BOM。
