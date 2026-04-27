# DataWindow 在现代依然经典 — 为什么它不该被遗忘

> 很多人以为 DataWindow 是过时的老技术。错。它只是被商业失败掩盖了，它的设计在今天依然领先于大多数前端方案。

---

## 一、现代前端的数据管理困境

看看 2024 年典型的前端数据管理方式：

### 困境 1：数据散落

```typescript
// 典型的 Angular/React 组件
@Component({...})
export class OrderComponent {
  orders: Order[] = [];           // 数据在组件里
  selectedOrders: Order[] = [];   // 选择状态在组件里
  deletedOrders: Order[] = [];    // 删除记录？没这回事
  changes: Map<number, Order> = new Map(); // 变更记录？自己写
}
```

问题：

- 数据和组件耦合，换 UI 就要重写数据逻辑
- 删除直接 splice，数据丢了就丢了
- 变更记录要自己实现，每个项目重复造轮子

**DataWindow 1991 年就解决了这个问题：数据由引擎管理，组件只是视图。**

### 困境 2：校验事后做

```typescript
// 典型的表单提交校验
async submit() {
  const errors = this.validate(this.orders);
  if (errors.length > 0) {
    alert('校验失败');
    return;
  }
  await this.api.save(this.orders);
}
```

问题：

- 用户填了一堆数据，点保存才告诉你有问题
- 无效数据已经进入组件状态了
- 校验逻辑和业务逻辑混在一起

**DataWindow 1991 年就解决了这个问题：ItemChanged 实时拦截，无效数据根本进不来。**

### 困境 3：变更不可追溯

```typescript
// 典型的保存逻辑
async save() {
  // 只能发全量数据，不知道哪些变了
  await this.api.updateOrders(this.orders);
}
```

问题：

- 后端收到全量数据，不知道哪些字段变了
- 无法做乐观锁（"这条数据在你编辑期间被别人改过"）
- 网络传输浪费

**DataWindow 1991 年就解决了这个问题：列级变更跟踪，精准生成 UPDATE。**

### 困境 4：操作不可逆

```typescript
// 典型的删除
delete(id: number) {
  this.orders = this.orders.filter(o => o.id !== id);
  // 想恢复？没了
}
```

问题：

- 删除是即时的，没有"暂存"概念
- 用户误删只能重新录入
- 没有"撤销"能力

**DataWindow 1991 年就解决了这个问题：三缓冲区，删除是暂存，Commit 才生效。**

---

## 二、DataWindow 的设计，在 2024 年依然领先

### 对比：现代前端 vs DataWindow 思想

| 问题 | 现代前端典型做法 | DataWindow 的解决 | 谁更先进 |
|------|-----------------|-------------------|---------|
| 数据存储 | 散落在组件 | 独立引擎管理 | DataWindow |
| 校验时机 | 提交时批量校验 | 输入时实时拦截 | DataWindow |
| 变更跟踪 | 无 / 自己实现 | 列级自动跟踪 | DataWindow |
| 删除操作 | 直接移除 | 暂存到删除缓冲区 | DataWindow |
| 撤销能力 | 无 / 自己实现 | 内置 Undo | DataWindow |
| 差异更新 | 全量提交 | 精准到列 | DataWindow |
| 多视图绑定 | 每个视图独立状态 | 同一引擎多视图 | DataWindow |

**结论：现代前端在数据管理上，整体还不如 1991 年的 DataWindow。**

这不是怀旧，是事实。我们用着 React 18、Angular 17、Vue 3，但在"如何优雅管理数据"这个问题上，很多人还在用原始的方式。

---

## 三、为什么 DataWindow 被遗忘了

### 原因 1：商业失败，不是技术失败

```
PowerBuilder 发展史：
1991 — Powersoft 发布，DataWindow 诞生
1996 — Sybase 收购 Powersoft
2010 — SAP 收购 Sybase
2015 — Appeon 收购 PowerBuilder 业务
```

每次转手，市场推广都在萎缩。PowerBuilder 变成"遗留系统"的代名词，DataWindow 随之被污名化。

**DataWindow 的设计没有过时，过时的是 PowerBuilder 的商业运营。**

### 原因 2：Web 浪潮，C/S 架构式微

2000 年代 Web 兴起，C/S 架构被认为是"过时"。DataWindow 是 C/S 时代的产物，自然被归为"老技术"。

**"数据应该被优雅管理"这个需求，Web 时代依然存在。** 只是 Web 没有继承 DataWindow 的解法，而是从头造了一堆更差的轮子。

### 原因 3：闭源生态，无法传承

DataWindow 是 PowerBuilder 的核心卖点，闭源、专利保护。社区无法基于它做改进，无法移植到其他语言/框架。

结果就是：PowerBuilder 活着，DataWindow 活着；PowerBuilder 衰落，DataWindow 随之被遗忘。

**如果 DataWindow 当年是开源的，今天可能是前端数据管理的标准范式。**

---

## 四、ngx-datawindow 的使命：让 DataWindow 在现代重生

### 不是复刻，是翻译

我们不是把 DataWindow 照搬到 Web。我们是把 DataWindow 的**设计思想翻译成 Web 的语言**。

| DataWindow | ngx-datawindow（Web 翻译） |
|-----------|--------------------------|
| Primary/Filter/Delete 缓冲区 | main / filtered / deleted buffers |
| GetItemStatus | row.status + column.changes |
| ItemChanged 事件 | itemChanged$ Observable |
| SetItem / GetItem | dataStore.get() / dataStore.set() |
| Update() | generateDiffUpdates() → API |
| Find() | query({ filter: Expression }) |
| Compute Column | virtual field + JS formula |
| DataWindow Painter | 列配置 JSON Schema（未来：可视化设计器）|

### 不是替代，是证明

我们不是要证明"ngx-datawindow 比 DataWindow 强"。我们要证明的是：

> **DataWindow 的设计思想，在 Web 时代依然是最优解。**

证明方式：

1. 实现 DataWindow 的核心能力
2. 解决现代前端的数据管理痛点
3. 让开发者体验"原来数据可以这样管理"
4. 形成范式，影响更多项目

---

## 五、具体目标

### 目标 1：成为 Angular 生态的"数据管理最佳实践"

让 Angular 开发者遇到复杂数据管理需求时：

- 不再自己造轮子
- 知道有"ngx-datawindow"这个解法
- 用过之后说"原来数据应该这样管理"

### 目标 2：影响前端数据管理范式

让更多人意识到：

- 数据应该由引擎管理，不是散落在组件
- 校验应该是实时的，不是事后的
- 操作应该是可逆的，不是即时的
- 变更应该是可追溯的，不是黑盒

### 目标 3：成为 DataWindow 思想的现代载体

当有人问"DataWindow 有什么好"时：

- 可以指着一个运行的 Web 应用说"这就是 DataWindow 的思想"
- 不需要安装 PowerBuilder 就能体验 DataWindow 的设计
- 新一代开发者通过 Web 认识 DataWindow，而不是通过历史书

---

## 六、行动计划

### 短期（已完成）

- [x] 列级变更跟踪 — 让变更可追溯
- [x] ItemChanged 拒绝机制 — 让校验实时
- [x] 撤销栈 — 让操作可逆
- [x] 完整事件链 — 让每个环节可干预

### 中期（进行中）

- [ ] 可视化列配置设计器 — 降低配置门槛
- [ ] 多种呈现样式 — Grid / Form / Card
- [ ] 完整文档 + 示例 — 让人容易上手
- [ ] 性能优化 — 支持大数据量

### 长期

- [ ] 离线支持 + 冲突解决 — 企业级能力
- [ ] 声明式持久化配置 — 消灭重复代码
- [ ] 社区建设 — 让更多人参与

---

## 七、写在最后

> **经典之所以是经典，不是因为它老，是因为它对。**
>
> DataWindow 对"数据如何被优雅管理"这个问题的回答，
> 在 1991 年是对的，在 2024 年依然是对的。
> 到 2034 年大概率还是对的。
>
> 我们要做的，不是把 DataWindow 供在博物馆里，
> 而是**让它在现代程序中继续发光**。
>
> **这不是怀旧项目，这是让经典继续经典的工程。**

---

*致所有认可 DataWindow 设计价值的人*
