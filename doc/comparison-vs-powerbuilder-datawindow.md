# ngx-datawindow vs PowerBuilder DataWindow 对比分析

**分析日期**: 2026-04-24
**分析维度**: 功能完整性、数据处理能力、事件模型、离线支持、开发体验

---

## 一、整体定位对比

| 维度 | PowerBuilder DataWindow | ngx-datawindow |
|------|------------------------|---------------|
| **平台** | 桌面/C/S 架构 | Web 前端（Angular） |
| **诞生时间** | 1991 年（30+ 年成熟） | 2024 年 |
| **定位** | 数据库应用的数据层核心 | 前端表格 UI + 内存数据管理 |
| **数据来源** | 数据库直连（SQL Native） | 前端内存数组 / 后端 API |
| **职责范围** | 数据获取→展示→编辑→校验→保存，全链路 | 数据展示→编辑→内存管理（不含持久化）|

PowerBuilder DataWindow 是一个**数据应用全链路解决方案**，ngx-datawindow 是一个**前端展示层组件**，定位差异较大。

---

## 二、功能对比矩阵

### 2.1 呈现样式

| 功能 | PowerBuilder | ngx-datawindow | 状态 |
|------|-------------|---------------|------|
| 网格表格（Grid） | ✅ | ✅ | — |
| 自由格式（Freeform） | ✅ | ❌ | 需开发 |
| 列表格式（Tabular） | ✅ | ❌ | 需开发 |
| 分组报表（Group） | ✅ | ❌ | 需开发 |
| 交叉报表（Crosstab） | ✅ | ❌ | 需开发 |
| 图表（Graph） | ✅ | ❌ | 需集成 ECharts/D3 |
| 富文本（RichText） | ✅ | ❌ | 需开发 |
| OLE 嵌入 | ✅ | ❌ | 不适用 Web |

**现状**: 当前仅支持网格表格一种样式。

---

### 2.2 数据源支持

| 功能 | PowerBuilder | ngx-datawindow | 状态 |
|------|-------------|---------------|------|
| 数据库直连（Native SQL） | ✅ | ❌ | 需配合后端 API |
| 嵌入 SQL | ✅ | ❌ | 需后端 |
| JSON / REST API | 有限 | ✅ | ✅ |
| 内存数组 | ❌ | ✅ | ✅ |
| SOAP/WebService | ✅ | 需 HttpClient | 需后端 |
| OLE DB / ODBC | ✅ | ❌ | 不适用 Web |

**现状**: DataWindow 内置 Transaction 对象，ngx-datawindow 所有数据需从后端 API 获取后加载到内存。

---

### 2.3 多缓冲区管理

| 功能 | PowerBuilder | ngx-datawindow | 状态 |
|------|-------------|---------------|------|
| 主缓冲区（Primary） | ✅ | ✅ | — |
| 过滤缓冲区（Filter） | ✅ | ✅ | — |
| 删除缓冲区（Delete） | ✅ | ✅ | — |
| 行级状态（new/normal/modified/deleted） | ✅ | ✅ | — |
| **列级变更跟踪** | ✅ | ✅ | ✅ Phase 1 |
| **行版本追踪（rowVersionMap）** | ❌ | ✅ | ✅ Phase 2 |
| **乐观锁冲突检测** | ❌ | ✅ | ✅ Phase 2 |

**现状**: ngx-datawindow 完整实现了行级状态跟踪，Phase 2 额外实现了列级变更跟踪和乐观锁。

---

### 2.4 表达式与计算

| 功能 | PowerBuilder | ngx-datawindow | 状态 |
|------|-------------|---------------|------|
| 计算列（Computed Column） | ✅ | ✅ | — |
| IF / IIF 条件 | ✅ | 有限（JS 表达式） | 可增强 |
| DECODE / CASE | ✅ | 有限 | 可增强 |
| 字符串函数 | 30+ | 有限 | 可扩展 |
| 日期函数 | 15+ | 有限 | 可扩展 |
| 聚合函数（Sum/Avg/Count/Max/Min） | ✅ | ✅ | — |
| 分组聚合 | ✅ | ✅ | — |
| 跨行计算（Running Sum 等） | ✅ | ❌ | 需开发 |
| **虚拟计算列（JS formula）** | ❌ | ✅ | ✅ Phase 1 |

**现状**: ngx-datawindow 以 JS 函数作为公式，比 PowerBuilder 表达式更灵活。

---

### 2.5 校验机制

| 功能 | PowerBuilder | ngx-datawindow | 状态 |
|------|-------------|---------------|------|
| 必填校验 | ✅ | ✅ | — |
| 格式校验 | ✅ | ✅ | — |
| 范围校验 | ✅ | ✅ | — |
| **ItemChanged 事件** | ✅ | ✅ | ✅ Phase 1 |
| **拒绝无效值（reject）** | ✅ | ✅ | ✅ Phase 1 |
| **跨字段校验** | ✅ | ✅ | ✅ Phase 1 |
| 校验失败阻止移动 | ✅ | ✅ | ✅ Phase 1 |
| **校验规则可视化配置** | ✅ | ❌ | 需开发 |

**现状**: ngx-datawindow 的 ItemChanged 拒绝机制已完整实现，可实时拦截无效输入。

---

### 2.6 更新与持久化

| 功能 | PowerBuilder | ngx-datawindow | 状态 |
|------|-------------|---------------|------|
| 自动生成 UPDATE/INSERT/DELETE | ✅ | ❌ | 需后端 |
| **离线持久化（IndexedDB）** | ❌ | ✅ | ✅ Phase 2 |
| **乐观锁 / 悲观锁** | ❌ | ✅ | ✅ Phase 2 |
| 事务管理（Transaction） | ✅ | ❌ | 需后端 |
| **差异更新（ChangedFields）** | ✅ | ✅ | ✅ Phase 1 |
| **撤销（Undo）** | ✅ | ✅ | ✅ Phase 1 |
| **回滚（Rollback）** | ✅ | ✅ | ✅ Phase 1 |

**现状**: ngx-datawindow 在离线场景下实现了完整的冲突检测和撤销机制。

---

### 2.7 事件模型

| 功能 | PowerBuilder | ngx-datawindow | 状态 |
|------|-------------|---------------|------|
| RetrieveStart / RetrieveEnd | ✅ | ✅ | ✅ Phase 1 |
| RowFocusChanged | ✅ | ✅ | ✅ Phase 1 |
| RowFocusIn / RowFocusOut | ✅ | ❌ | 需开发 |
| **ItemChanged** | ✅ | ✅ | ✅ Phase 1 |
| ItemFocusChanged | ✅ | ✅ | ✅ Phase 1 |
| ButtonClicked | ✅ | ✅ | ✅ Phase 1 |
| RowDeleted | ✅ | ✅ | ✅ Phase 1 |
| RowInserted | ✅ | ✅ | ✅ Phase 1 |
| DataChanged | ✅ | ✅ | ✅ Phase 1 |
| SaveStart / SaveEnd | ✅ | ✅ | ✅ Phase 1 |
| **事件脚本（PowerScript）** | ✅ | ❌ | 不适用 |
| **阻止事件（return 1 拒绝）** | ✅ | ✅ | ✅ Phase 1 |

**现状**: ngx-datawindow 完整实现了 DataWindow 的核心事件链，且支持事件拦截。

---

### 2.8 打印与报表

| 功能 | PowerBuilder | ngx-datawindow | 状态 |
|------|-------------|---------------|------|
| 打印预览 | ✅ | ❌ | 需集成 |
| 打印设置 | ✅ | ❌ | 需集成 |
| 报表输出 | ✅ | ❌ | 需集成 |
| 导出 PDF | ✅ | ❌ | 需集成 html2pdf |
| **导出 CSV / JSON** | ✅ | ✅ | ✅ Phase 1 |
| 导出 Excel | ✅（原生） | ❌ | 需扩展 xlsx |
| 页眉页脚 | ✅ | ❌ | 需开发 |

---

### 2.9 高级特性

| 功能 | PowerBuilder | ngx-datawindow | 状态 |
|------|-------------|---------------|------|
| **虚拟滚动（大量数据）** | ✅ | ✅ | ✅ Phase 2 |
| 拖拽调整列宽 | ✅ | ✅（Angular CDK） | ✅ Phase 1 |
| 列隐藏 / 显示 | ✅ | ✅ | ✅ Phase 1 |
| 列顺序拖拽 | ✅ | ❌ | 需开发 |
| 分组显示（Group By） | ✅ | ❌ | 需开发 |
| 查找 / 定位（Find） | ✅（表达式语法） | 有限 | 可增强 |
| 数据窗口复用 | ✅ | 有限 | 需开发模板机制 |

---

## 三、ngx-datawindow 的优势

### 3.1 Web 原生优势

| 优势 | 说明 |
|------|------|
| **响应式设计** | 自适应桌面/平板/手机，DataWindow 只能桌面 |
| **现代 UI** | Angular Material 组件，主题定制灵活 |
| **组件化架构** | 可嵌入任何 Angular 应用，DataWindow 只能 PowerBuilder |
| **跨平台** | 浏览器即运行，DataWindow 只能 Windows |
| **生态集成** | 可与 RxJS、NgRx、GraphQL 等无缝集成 |
| **部署简单** | Web 部署，零安装 |

### 3.2 现代化特性

| 特性 | 说明 |
|------|------|
| **Angular Signals** | Angular 17 Signals 驱动，高性能更新 |
| **虚拟计算列** | JS 函数作为公式，比 DataWindow 表达式更灵活 |
| **表达式过滤** | 支持 15 种过滤操作符 |
| **离线支持** | IndexedDB 持久化，断网可编辑，重连同步 |
| **乐观锁** | 三种冲突策略（server_wins / client_wins / manual） |
| **SyncMetrics** | 同步耗时、数据量、冲突数统计 |

---

## 四、差距量化评估

| 维度 | 完成度 | 说明 |
|------|--------|------|
| 核心数据管理（缓冲区、状态、查询） | **100%** | 核心功能完整 |
| 过滤 / 排序 / 聚合 | **95%** | 完整，缺表达式设计器 |
| 增删改查 | **80%** | 内存操作完整，缺数据库直连 |
| 校验机制 | **95%** | ItemChanged 拒绝机制完整实现 |
| 事件模型 | **95%** | 核心事件链完整 |
| 离线持久化 | **100%** | IndexedDB + 乐观锁完整实现 |
| 可视化设计 | **10%** | 无设计器，纯配置 |
| 打印报表 | **5%** | 无报表功能 |
| 丰富样式 | **15%** | 仅 Grid，缺 Freeform/Graph/Crosstab |
| 离线支持 | **100%** | Phase 2 完成 |

---

## 五、优先级建议

### P0 — 核心补强（已完成 ✅）

- ✅ **列级变更跟踪** — 精确到列的修改记录
- ✅ **ItemChanged 拒绝机制** — 支持 return 拒绝无效输入
- ✅ **撤销 / 回滚** — Command Pattern 实现

### P1 — 功能完善（进行中）

- [ ] Find 表达式 — 实现类似 PowerBuilder Find() 的字符串表达式查询
- [ ] 虚拟滚动优化 — 支持 10 万行级别流畅滚动
- [ ] 列顺序拖拽 — 用户可自定义列顺序并持久化
- [ ] XLSX 导出 — 用 xlsx 库替代纯 CSV

### P2 — 增强体验

- [ ] Group 分组显示 — 表头分组、嵌套分组
- [ ] 图表集成 — 集成 ECharts 图表列类型
- [ ] 可视化设计器 — 拖拽生成列配置的 JSON Schema
- [ ] PDF 导出 — 集成 jsPDF / html2canvas

### P3 — 企业级

- [ ] 数据库连接层 — 提供可选的 DataWindowService 数据库模式
- [ ] 嵌套数据窗口 — Master-Detail 联动
- [ ] 报表引擎 — 分组报表、交叉报表
- [ ] 实时协作 — 多用户同时编辑

---

## 六、核心结论

> **PowerBuilder DataWindow 是 30 年打磨的企业级数据组件，ngx-datawindow 是现代 Web 表格组件的新项目。两者不可直接对比，但可以借鉴 DataWindow 的设计思想。**

**ngx-datawindow 的核心竞争力不在于"替代 DataWindow"，而在于：**

1. **Web 优先** — 数据在浏览器内存中，通过 API 与后端交互
2. **组件化** — 可在任何 Angular 应用中使用
3. **灵活计算** — JS 函数比 PowerBuilder 表达式更强大
4. **快速开发** — 配置驱动的 CRUD 表格，开箱即用
5. **离线支持** — IndexedDB + 乐观锁，企业级可靠性

**最值得借鉴 DataWindow 的特性（均已实现）：**

1. ✅ **列级变更跟踪** — 高优先级，影响差异更新的精确度
2. ✅ **ItemChanged + ItemError 阻止机制** — 高优先级，影响数据质量
3. ✅ **撤销/回滚** — 重要，影响操作可逆性
4. ✅ **事件链设计** — 重要，影响可扩展性
5. ✅ **离线持久化 + 乐观锁** — 企业级能力，Phase 2 已完成
