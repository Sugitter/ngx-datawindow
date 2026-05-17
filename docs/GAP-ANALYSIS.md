# ngx-datawindow 项目差距分析与优化方案

> 生成时间: 2026-05-15  
> 版本: v1.0  
> 分析范围: `D:\workspace\ngx-datawindow` 全项目

---

## 一、项目概览

### 1.1 架构总览

```
packages/core/          — 框架无关的纯 TS 引擎 (DataStore)
packages/angular/       — Angular 包 (adapter + virtual scroll)
projects/ngx-datawindow — 主包 (组件 + 服务 + 离线 + 报表 + 测试)
```

**核心模块：**

| 模块 | 文件数 | 总代码行数 | 状态 |
|------|--------|-----------|------|
| DataStore 引擎 | 1 | ~53KB (1 文件) | ✅ 完成 |
| DataTable 组件 | 1 | ~85KB (1 文件) | ⚠️ 过重 |
| DataTable 服务 | 1 | ~23KB | ✅ 完成 |
| 离线持久化 | 7 | ~65KB | ✅ 完成 |
| 报表设计器 | 4 | ~170KB | ✅ 完成 |
| 报表引擎 | 1 | ~23KB | ⚠️ 基础 |
| 表达式计算器 | 1 | ~23KB | ✅ 完成 |
| 渲染器系统 | 4 | ~20KB | ⚠️ 不完整 |
| 虚拟滚动 | 1 | ~6KB | ✅ 完成 |
| 适配器层 | 1 | ~5.5KB | ⚠️ 有断裂 |

### 1.2 功能矩阵

| 功能 | 数据源引擎 | UI 组件 | 离线 | 报表 | 渲染器 |
|------|-----------|---------|------|------|--------|
| 增删改查 | ✅ | ✅ | ✅ | - | - |
| 多 Buffer | ✅ | - | - | - | - |
| 虚拟列 | ✅ | ✅ | - | ✅ | - |
| 聚合 | ✅ | ✅ | - | ✅ | - |
| 排序/分页 | ✅ | ✅ | - | - | - |
| 过滤/搜索 | ✅ | ✅ | - | - | - |
| 行选择 | ✅ | ✅ | - | - | - |
| 内联编辑 | - | ✅ | - | - | - |
| 撤销/重做 | ✅ | - | - | - | - |
| 变更追踪 | ✅ | - | - | - | - |
| 校验 | ✅ | - | - | - | - |
| 增量更新 | ✅ | ✅ | - | - | - |
| 高亮变更 | - | ✅ | - | - | - |
| 虚拟滚动 | - | ✅ | - | - | ✅ |
| 离线/IndexedDB | - | - | ✅ | - | - |
| 乐观锁 | - | - | ✅ | - | - |
| 报表引擎 | - | - | - | ✅ | - |
| 表达式 | - | - | - | ✅ | - |
| 拖拽设计器 | - | ✅ | - | ✅ | - |
| 分组渲染 | - | - | - | - | ✅ |
| 树形渲染 | - | - | - | - | ✅ |
| 卡片/报告模式 | - | - | - | - | ⚠️ 未实现 |
| 主从表 | - | - | - | - | ⚠️ 未实现 |
| 交叉表 | - | - | - | ⚠️ 模型有，引擎缺 | - |
| 甘特图 | - | - | - | ⚠️ DisplayMode 有 | - |
| Pivot 透视表 | - | - | - | ⚠️ DisplayMode 有 | - |

---

## 二、高优先级问题（P0）

### 2.1 [P0-1] `packages/core` 与 `projects/ngx-datawindow` 代码严重重复

**问题描述：**  
`packages/core/src` 是框架无关的纯 TS 引擎，而 `projects/ngx-datawindow/src/lib/datastore.ts` 是 Angular 环境的 DataStore 实现。两者应该是同一个文件的两个导出入口，但目前各自维护，会导致：
- 修 bug 要改两份
- 版本不一致
- 包体积膨胀

**影响：** 维护成本翻倍，版本混乱

**修复方案：**
```
方案 A（推荐）：core → ng link
1. 保持 packages/core 为单一真实数据源
2. projects/ngx-datawindow 中 dataStore 改为 barrel import
3. 构建时打包 core 到 angular 包中

方案 B（简化）：合并
1. 将 packages/core 的内容直接移到 projects 中
2. 删除 packages/core（或保留作为独立发布包）
```

**工作量：** 2-4 小时

---

### 2.2 [P0-2] `DataTableComponent` 单体文件 85KB，严重违反单一职责

**问题描述：**  
`datatable.component.ts` 是唯一一个 85KB 的文件，包含了：
- 模板/样式（内联 CSS 3000+ 行）
- 所有事件输出定义
- 工具栏逻辑
- 行编辑逻辑
- 列冻结逻辑
- 虚拟滚动逻辑
- 分组/树形逻辑
- 导出逻辑
- 实时数据接入
- 行内计算列渲染

**影响：** 难以维护、难以测试、难以扩展

**修复方案：** 拆分为多个子组件

```
datatable.component.ts (主组件, ~5KB)
├── dw-datatable-toolbar.component.ts   — 工具栏 (~8KB)
├── dw-datatable-header.component.ts    — 表头/过滤 (~6KB)
├── dw-datatable-body.component.ts      — 表格主体 (~15KB)
│   ├── dw-datatable-row.component.ts   — 单行 (~5KB)
│   └── dw-datatable-cell.component.ts  — 单元格 (~8KB)
├── dw-datatable-footer.component.ts    — 脚部分页 (~4KB)
├── dw-datatable-editing.service.ts     — 编辑服务 (~6KB)
├── dw-datatable-selection.service.ts   — 选择服务 (~3KB)
└── dw-datatable-import-export.ts       — 导入导出 (~4KB)
```

**工作量：** 8-16 小时

---

### 2.3 [P0-3] 渲染器系统存在断裂 — 多 DisplayMode 未实现

**问题描述：**  
`DisplayMode` 定义了 11 种模式，但实际只实现了 3 种：

| DisplayMode | 是否实现 | 状态 |
|-------------|---------|------|
| grid | ✅ | GridRenderer |
| group | ✅ | GroupRenderer |
| tree | ✅ | TreeRenderer |
| form | ❌ | 空白 |
| report | ❌ | 空白 |
| card | ❌ | 空白 |
| master-detail | ❌ | 空白 |
| tree-grid | ❌ | 空白 |
| export | ❌ | 空白 |
| pivot | ❌ | 空白 |
| gantt | ❌ | 空白 |

`createRenderer()` 的 switch 只处理 3 种模式，其余全部 fallback 到 grid。

**影响：** API 承诺与实际能力不符，用户可能因文档看到 unsupported 模式

**修复方案：**
- 方案 A（快速）：将未实现模式的 switch 分支标注为 `@deprecated`，移除 API
- 方案 B（渐进）：逐期实现 `card`（卡片视图，最有用）和 `tree-grid`（树形表格）

**工作量：** 方案 A: 30 分钟 / 方案 B: 2-4 周

---

### 2.4 [P0-4] 适配器层 (`adapter.ts`) 未被使用

**问题描述：**  
`AngularDataStoreAdapter` 类在 `adapter.ts` 中定义，但：
1. 组件直接使用 `DataTableService` 而非 Adapter
2. Adapter 的 `view` Signal 和 Renderer 管线未被任何组件消费
3. 组件模板中完全没有使用 `adapter.ts` 的任何导出

**影响：** 这是未完成的代码路径，维护者困惑，可能包含过时的逻辑

**修复方案：**
- 方案 A（删除）：如果确定不使用，删除 `adapter.ts`
- 方案 B（集成）：在 `DataTableComponent` 中集成 Adapter，用其 `view` Signal 替代手动渲染循环

**工作量：** 方案 A: 30 分钟 / 方案 B: 2-4 小时

---

## 三、中优先级问题（P1）

### 3.1 [P1-1] 类型导出冲突

**问题描述：**  
`models.ts` 和 `datastore.ts` 中都定义了：
- `AggregationType` — 两套定义可能不同
- `RowStatus` — 两套定义可能不同
- `FilterOperator` — 两套定义可能不同
- `ColumnConfig` — `models.ts` 的泛型版本 vs `renderer.ts` 的简化版本

**影响：** 用户导入时可能拿到错误的类型，IDE 提示混乱

**修复方案：**
```typescript
// 统一 AggregationType 为一份 source of truth
// export type AggregationType = 'sum' | 'avg' | ... // 只定义在 models.ts
// datastore.ts 中 import 而非重新定义
```

---

### 3.2 [P1-2] 离线模块缺少错误边界

**问题描述：**  
`OfflineService` 和 `OfflineStorageAdapter` 在关键路径缺少：
- IndexedDB quota exceeded 处理
- 数据库被其他标签页删除后的恢复
- 网络抖动时的重试退避
- 同步队列满时的丢弃策略

**影响：** 离线模式下用户数据可能静默丢失

**修复方案：**
```typescript
// 增加以下能力：
interface OfflineErrorHandler {
  onQuotaExceeded(): void;
  onDatabaseCorrupted(): void;
  onSyncFailed(error: Error, retryCount: number): void;
  onQueueFull(): void;
}
```

---

### 3.3 [P1-3] 报表引擎的分组只支持单层

**问题描述：**  
`report-engine.ts` 中的 `_buildAllSections()` 明确注释了：
> "简化处理：只支持单层分组"

模板结构支持多层 `ReportGroup[]`，但引擎只用了 `groups[0]`。

**影响：** 复杂报表无法使用

**修复方案：** 递归遍历 groups 数组，构建嵌套分组结构

**工作量：** 4-8 小时

---

### 3.4 [P1-4] 表达式引擎缺少重要函数

**问题描述：**  
当前支持的函数列表中，缺少：
- `IF` 的完整 CASE WHEN 语法（有 AST 支持但 evaluator 不处理）
- `LEN`, `SUBSTR`, `SUBSTRING`
- `DATEADD`, `DATEDIFF`
- `ISNULL`, `ISBLANK`
- 正则表达式匹配 `REGEXP`
- 类型转换 `INT()`, `STR()`, `DATE()`

**影响：** 报表表达式能力有限

**修复方案：** 补充缺失的内置函数

**工作量：** 2-4 小时

---

### 3.5 [P1-5] 缺少 `standalone` 组件的版本管理

**问题描述：**  
`DataTableModule` 标记了 `@deprecated`，但：
1. README 仍然引导用户使用 Module 方式导入
2. 示例代码仍使用 `DataTableModule`
3. 没有提供 `ng add` schematic 自动转换

**影响：** 用户不知道应该用哪种方式

**修复方案：**
1. 更新 README 全改为 standalone 示例
2. 添加 `ng add ngx-datawindow` schematic
3. 发布 v2.0 时移除 Module 支持

---

### 3.6 [P1-6] `dataWindowVirtualScrollStrategy` DI token 使用方式不清晰

**问题描述：**  
`virtual-scroll-strategy.ts` 导出了 `dataWindowVirtualScrollStrategy()` 工厂函数，但：
1. 组件模板中硬编码了虚拟滚动逻辑，没有使用 CDK 的 `VIRTUAL_SCROLL_STRATEGY` token
2. 用户无法自定义滚动策略
3. 组件内同时存在 `CdkVirtualScrollViewport` 和自定义 Strategy，逻辑重叠

**影响：** 用户无法自定义行为，代码冗余

**修复方案：** 统一使用 CDK 的 VirtualScrollStrategy 模式

---

### 3.7 [P1-7] 导出功能缺少 XML 格式

**问题描述：**  
`ExportConfig` 定义中包含 `format: 'csv' | 'xlsx' | 'json' | 'xml'`，但 `DataTableService` 只实现了 CSV、JSON、XLSX，没有 XML。

**影响：** API 承诺与实际不符

**修复方案：** 要么实现 XML，要么从类型定义中移除

---

## 四、低优先级问题（P2）

### 4.1 [P2-1] 项目构建配置

**问题：**
- `package.json` 缺少 `sideEffects: false`（tree-shaking 优化）
- 没有 `exports` 字段的 ESM/CJS 双格式导出
- 没有 `types` 字段声明类型入口
- `ng-package.json` 缺少 `allowedNonPeerDependencies` 白名单

**修复：** 更新 Angular 库的构建配置

---

### 4.2 [P2-2] 缺少 Storybook

**问题：** 没有组件故事文件来可视化展示组件

**修复：** 创建 `projects/ngx-datawindow.stories.ts`

---

### 4.3 [P2-3] 缺少 CHANGELOG

**问题：** 没有版本变更日志

**修复：** 初始化 `CHANGELOG.md`

---

### 4.4 [P2-4] 缺少 E2E 测试

**问题：** 只有单元和集成测试，没有端到端测试

**修复：** 添加 Cypress/E2E 场景

---

### 4.5 [P2-5] 国际化 (i18n)

**问题：** 所有硬编码字符串都是中文，没有 i18n 支持

**修复：** 抽离翻译文件，支持中英文切换

---

### 4.6 [P2-6] 无障碍 (a11y)

**问题：** 表格缺少 ARIA 属性

**修复：** 添加 `role="grid"`, `aria-colcount`, `aria-rowcount` 等

---

### 4.7 [P2-7] 主题/暗色模式

**问题：** 没有 CSS 变量支持主题切换

**修复：** 将硬编码颜色改为 CSS 自定义属性

---

### 4.8 [P2-8] `report-designer` 的 `sync_queue` 表问题

**问题：** `schema.ts` 定义了 `sync_queue` 表但没有任何代码向此表写入数据

**修复：** 要么使用，要么删除

---

## 五、新增功能建议

### 5.1 [F-1] Master-Detail 子表

**描述：** 支持一行展开显示子表格（如订单→订单明细）

**优先级：** P1

### 5.2 [F-2] 公式编辑器

**描述：** 在 `DataTableComponent` 中提供可视化公式编辑器

**优先级：** P1

### 5.3 [F-3] 批量操作 API

**描述：** 提供 `batchUpdate`, `batchDelete` 等批量操作，一次性生成 delta

**优先级：** P1

### 5.4 [F-4] WebSocket 实时数据

**描述：** 内置 WebSocket 数据源，支持自动重连和断线恢复

**优先级：** P2

### 5.5 [F-5] SQL 模式查询

**描述：** 允许用户用 SQL 语法过滤/排序/聚合数据

**优先级：** P3

### 5.6 [F-6] 打印功能

**描述：** 将报表直接发送到浏览器打印或生成 PDF

**优先级：** P2

### 5.7 [F-7] 数据导入向导

**描述：** 提供可视化的 CSV/Excel 导入向导

**优先级：** P2

---

## 六、建议的执行计划

### Phase 1 — 清理（1-2 周）
1. [P0-1] 合并/统一 core 与 angular 包
2. [P0-2] 重构 DataTableComponent 为子组件
3. [P0-3] 移除/标注未实现的 DisplayMode
4. [P0-4] 清理 adapter.ts
5. [P1-1] 统一类型定义
6. [P1-2] 补充离线错误处理

### Phase 2 — 完善（2-3 周）
7. [P1-3] 报表引擎多层分组
8. [P1-4] 补充表达式函数
9. [P1-5] 更新 README 为 standalone
10. [P1-6] 统一虚拟滚动策略
11. [P1-7] 补全/移除 XML 导出
12. [F-1] 实现 Master-Detail

### Phase 3 — 增强（3-4 周）
13. [F-2] 公式编辑器
14. [F-3] 批量操作 API
15. [F-6] 打印/PDF 导出
16. [F-7] 数据导入向导

### Phase 4 — 打磨（持续）
17. [P2-1]~[P2-8] 各种低优先级改进
18. [F-4] WebSocket
19. [F-5] SQL 模式

---

## 七、代码质量指标

| 指标 | 当前值 | 目标 |
|------|--------|------|
| 最大单文件行数 | 85,662 (datatable.component.ts) | < 10,000 |
| 圈复杂度 | 高（组件） | < 30 |
| 测试覆盖率 | ~50% (估算) | > 80% |
| 包大小 (gzipped) | ~300KB (估算) | < 150KB |
| Tree-shakable | 部分 | 100% |
| TypeScript 严格模式 | 是 | 是 |
| 零 peer dependency 警告 | 否 | 是 |
