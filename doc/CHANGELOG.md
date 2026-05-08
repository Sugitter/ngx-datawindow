# 更新日志

所有 notable 变更都会记录在此文件中。
格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)

---

## [Unreleased]

## [1.0.1] - 2026-05-08

### 修复

- **P0 测试覆盖率** — 修复 datastore-phase1.test.ts 未使用 Jest describe/it 结构，测试从 51 提升至 107
- **MatTableDataSource 缓存** — 修复 dataSource computed() 每次重建实例导致 mat-sort 排序状态丢失
- **虚拟滚动排序** — 修复 _syncAllRows() 调用 getRows() 未应用排序规则
- **Report Designer 编译** — 修复 @switch/@case ICU 消息解析错误，添加 MatCheckboxModule 导入
- **模板语法错误** — 修复 report-designer-demo 中 json 管道和信号传递问题

### 新增

- **GroupBy 分组 UI** — 工具栏配置 + 普通表/虚拟滚动表分组行渲染
- **键盘导航** — @HostListener 全局键盘处理，上下/Enter/Tab/Escape
- **Shift+范围选择** — 基于 _lastRangeSelectId 的多行选择
- **CSV 导入** — importFromCSV() 方法，支持追加和跳过表头
- **xlsx 导出** — SheetJS 实现 Excel 导出
- **导入导出示例页面** — /import-export 演示完整导入导出功能

### 文档

- **API 文档** — typedoc 生成 docs/api/ 完整参考文档
- **README 更新** — 测试状态从 51/51 更新至 107/107

### 废弃

- **datastore-phase1.test.ts 测试函数** — 已改写为标准 Jest describe/it 结构

---

## [0.2.0] - 2026-04-26

### 新增

- **离线持久化** — IndexedDB 持久化存储，断网可编辑，重连自动同步
- **乐观锁冲突检测** — rowVersionMap 版本追踪，支持 server_wins/client_wins/manual 三种策略
- **SyncMetrics 性能监控** — 同步耗时、数据量、冲突数统计
- **虚拟滚动** — 集成 CDK CdkVirtualScrollViewport，支持大数据量流畅滚动
- **Angular 21 升级** — 从 Angular 17 升级至 21.2.10
- **集成测试** — 7 个集成测试覆盖完整生命周期
- **项目网站** — docs/index.html 深色主题响应式官网
- **Demo 应用** — Material Design 侧边栏导航，6 个功能展示页

### 变更

- DataTableComponent 改用构造函数注入（修复 NG0203）
- DataTableService 改为 providedIn: 'root'
- 离线模块三层架构：IndexedDBManager → OfflineStorageAdapter → OfflineService

### 测试

- 测试覆盖：51/51 通过
  - offline.test.ts：21 tests（idb-manager + offline-storage）
  - offline-service.test.ts：23 tests（offline-service + 乐观锁 + 事件）
  - integration.test.ts：7 tests（集成测试）

---

## [0.1.0] - 2026-04-24

### 新增

- **核心数据引擎** — DataStore 独立于组件的数据管理引擎
- **多缓冲区管理** — main / filtered / deleted 三缓冲区
- **行级状态跟踪** — new / normal / modified / deleted
- **虚拟计算列** — JS 函数作为公式，自动联动计算
- **聚合计算** — sum / avg / count / min / max，支持分组
- **跨 DataStore 查询** — 多数据源合并
- **零配置 CRUD** — 内置增删改查，开箱即用
- **内联编辑** — 双击单元格编辑
- **行选择** — 单选/多选模式
- **列过滤** — 15 种操作符，支持文本/数字/选择器/日期/布尔
- **全局搜索** — 跨列搜索
- **排序** — Material Sort
- **分页** — Material Paginator
- **CSV / JSON 导出**
- **差异更新** — 精确区分 new/modified/deleted
- **校验** — 必填、格式（正则）、范围、批量校验
- **Angular Signals 集成** — 响应式实时状态更新
- **行状态视觉标识** — 新增绿、修改黄、删除红
- **列级变更跟踪** — 精确到列，记录 oldValue/newValue + 时间戳
- **ItemChanged 拒绝机制** — 实时拦截无效输入
- **撤销/重做** — Command Pattern，Undo/Redo
- **完整事件链** — RetrieveStart → RowFocusChanged → ItemChanged → SaveStart

### 文档

- README.md — 快速开始指南
- DATAWINDOW-SOUL.md — 设计哲学传承宣言
- DATAWINDOW-MODERN.md — DataWindow 在现代的价值分析
- comparison-vs-powerbuilder-datawindow.md — 功能对比分析
- CONTRIBUTING.md — 贡献指南

---

[Unreleased]: https://github.com/Sugitter/ngx-datawindow/compare/v1.0.1...HEAD
[1.0.1]: https://github.com/Sugitter/ngx-datawindow/releases/tag/v1.0.1
[0.2.0]: https://github.com/Sugitter/ngx-datawindow/releases/tag/v0.2.0
[0.1.0]: https://github.com/Sugitter/ngx-datawindow/releases/tag/v0.1.0