# ngx-datawindow Roadmap

> Last updated: 2026-04-29

## Current Status

| 项目 | 状态 |
|------|------|
| 核心功能 | ✅ Phase 1 完成 |
| 离线持久化 | ✅ Phase 2 完成 (51 tests) |
| Demo | ✅ 9 个示例页面 |
| npm 发布 | ⏳ v1.1.0 待发布 |
| 文档 | 📝 README + 6 篇设计文档 |

---

## 设计原则

| 原则 | 说明 |
|------|------|
| **80/20 法则** | 覆盖 80% 常见场景，剩下 20% 怪需求用专业组件 |
| **零配置可用** | 引入即用，不强制配置 |
| **按需加载** | 功能模块可 tree-shake，不用的不打包 |
| **性能优先** | 虚拟滚动、懒加载，大数据不卡 |
| **API 精简** | 少概念，少配置项，直觉可用 |

### 不做的事（避免臃肿）

| 功能 | 原因 |
|------|------|
| 内置图表 | 用 ECharts/Chart.js 更专业 |
| 复杂表单编辑器 | 用 Angular Forms |
| 拖拽排序 | 用 CDK DragDrop，不重复造轮子 |
| 复杂过滤语法 | 简单筛选够用，高级用专业组件 |
| 内置导出 Excel/PDF | 提供数据，用户自己调库 |
| 内置打印样式 | 一行 CSS 即可 |

### 做的事（核心价值）

| 功能 | 价值 |
|------|------|
| 高效表格渲染 | 虚拟滚动，万行不卡 |
| 离线编辑 | IndexedDB 持久化，断网可用 |
| 变更追踪 | 列级 old/new，审计友好 |
| 乐观锁 | 冲突检测，多人协作 |
| 简单筛选/排序/分页 | 开箱即用 |
| 行状态视觉提示 | 新增/修改/删除一目了然 |
| **实时数据接入** | WebSocket/SSE 推送，即时展现 |

### 包大小目标

| 指标 | 目标 |
|------|------|
| gzip 后 | < 50KB |
| 无依赖 | 只依赖 @angular/core + @angular/cdk + @angular/material |
| tree-shakeable | 不用的功能不打包 |

---

## Phase 3: 功能增强 (v1.2.0)

参考 ngx-datatable 架构，补齐核心能力：

| 功能 | 优先级 | 说明 |
|------|--------|------|
| **实时数据接入** | P0 | WebSocket/SSE 推送，增量更新，闪烁提示 |
| **多选模式** | P0 | single/multi/multiClick/checkbox/cell 五种模式 |
| **列冻结** | P0 | frozenLeft/frozenRight，左右固定列 |
| **模板系统** | P1 | cellTemplate/headerTemplate/detailTemplate 自定义渲染 |
| **行分组** | P1 | 按字段分组，可折叠 |
| **树形展示** | P2 | 树状数据展开/折叠 |
| **虚拟滚动优化** | P2 | Fenwick Tree 行高缓存，大数据量 |

---

## Phase 4: 生态完善 (v1.3.0)

| 功能 | 优先级 | 说明 |
|------|--------|------|
| **文档网站** | P0 | GitHub Pages，API 文档，示例 |
| **Demo 截图** | P0 | 用于 README 和文档 |
| **单元测试覆盖** | P1 | 核心组件测试 |
| **Angular CDK 集成** | P1 | 拖拽排序、虚拟滚动 |
| **主题系统** | P2 | CSS 变量主题切换 |

---

## Phase 5: 示例丰富 (重点)

**目标：覆盖更多真实使用场景，吸引用户**

### 实时数据场景（重点）
- [ ] WebSocket 实时推送（股票行情、日志流）
- [ ] SSE 事件流（通知、消息）
- [ ] 增量更新（只更新变化行，不全量刷新）
- [ ] 新数据闪烁提示（高亮 2s 后恢复）

### 企业管理场景
- [ ] 订单管理系统（订单列表、状态流转、批量操作）
- [ ] 库存管理系统（库存预警、入库出库、盘点）
- [ ] 客户关系管理 CRM（客户列表、跟进记录、标签筛选）
- [ ] 人力资源 HR（员工档案、考勤、薪资）

### 数据分析场景
- [ ] 报表查看器（多维度筛选、导出、打印）
- [ ] 日志查看器（实时刷新、关键词高亮、分页加载）
- [ ] 财务报表（汇总、钻取、图表联动）

### 协作办公场景
- [ ] 任务看板（拖拽排序、状态切换、分配）
- [ ] 审批流程（待办列表、批量审批、流程追踪）
- [ ] 文档管理（分类、搜索、版本历史）

### 移动端适配
- [ ] 响应式布局示例
- [ ] 触摸手势支持
- [ ] 移动端筛选面板

### 集成示例
- [ ] 与后端 API 集成（REST/GraphQL）
- [ ] 与状态管理集成（NgRx/SignalStore）
- [ ] 与表单库集成（Angular Reactive Forms）
- [ ] 与图表库集成（ECharts/Chart.js）

---

## 实时数据接入设计

### API 设计
```typescript
// 方式 1：Observable 直接接入
<data-table [data$]="websocket$" />

// 方式 2：提供接入函数
<data-table [dataFeed]="feedConfig" />

interface DataFeedConfig {
  source: Observable<DataUpdate>;     // 数据源
  mode: 'replace' | 'merge' | 'append'; // 更新模式
  keyField: string;                   // 唯一标识字段
  highlightDuration?: number;         // 新数据高亮时长(ms)
}
```

### 更新模式
| 模式 | 说明 | 场景 |
|------|------|------|
| replace | 全量替换 | 初始加载、全量刷新 |
| merge | 按 key 合并更新 | 行级更新（股票行情） |
| append | 追加到末尾 | 日志流、消息列表 |

### 性能考虑
- 增量更新：只触发变化行的变更检测
- 批量合并：高频推送时合并，避免频繁渲染
- 虚拟滚动：只渲染可视区域，新数据自动滚动到顶部

---

## 架构重构考虑

参考 ngx-datatable 的设计，当前架构有一个核心问题：

**现状：** DataStore 是核心，组件是壳
**ngx-datatable：** 组件是核心，DataStore 是内部状态

| 方案 | 优点 | 缺点 |
|------|------|------|
| 保持现状 | 已实现，稳定 | 状态同步复杂，扩展受限 |
| 重构为组件核心 | 更灵活，模板/分组/树更好实现 | 工作量大，破坏性变更 |

**建议：** 先完成 Phase 3 功能增强，验证现有架构能否支撑。如果遇到瓶颈再考虑重构。

---

## 下一步行动

1. **网络恢复后** → 推送修复 + 发布 v1.1.1
2. **实时数据接入** → Observable 接口，增量更新
3. **丰富示例** → 实时推送、企业管理场景
4. **多选模式** → 扩展 SelectionType，支持 checkbox 列
5. **列冻结** → sticky 定位实现
6. **文档网站** → 用 VitePress 或 docusaurus

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
