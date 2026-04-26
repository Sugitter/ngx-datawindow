# 贡献指南

感谢你对 ngx-datawindow 感兴趣！这个项目的目标是将 DataWindow 的设计思想在 Web 时代延续，我们欢迎所有形式的贡献。

---

## 贡献方式

| 方式 | 说明 |
|------|------|
| **使用它** | 在项目中使用，提 issue 告诉我们哪里不好用 |
| **反馈问题** | 提交 Issue，描述遇到的问题或建议 |
| **贡献代码** | Fork → Branch → PR |
| **改进文档** | 改进 README、API 文档、示例 |
| **分享愿景** | 在团队里推广"数据中间层"思想 |

---

## 开发环境设置

### 前置要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装步骤

```bash
# 1. Fork 并克隆仓库
git clone https://github.com/Sugitter/ngx-datawindow.git
cd ngx-datawindow

# 2. 安装依赖
npm install

# 3. 运行 demo
cd demo && npm install && ng serve

# 4. 运行测试
npm run test
```

---

## 分支策略

| 分支 | 用途 |
|------|------|
| `main` | 稳定版本，只接受 PR 合并 |
| `feature/xxx` | 功能分支 |
| `fix/xxx` | 修复分支 |

---

## 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <description>
```

### Type 类型

| Type | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更新 |
| `style` | 代码格式（不影响功能） |
| `refactor` | 重构 |
| `perf` | 性能优化 |
| `test` | 添加测试 |
| `chore` | 构建/工具变更 |

---

## 代码规范

### TypeScript

- 严格模式（strict: true）
- 优先使用 interface 而非 type
- 公共 API 需要 JSDoc 注释
- 避免 any，使用 unknown 或具体类型

### Angular

- 遵循 Angular 风格指南
- 组件使用 Standalone
- 模板保持简洁，复杂逻辑移到组件

### 测试

- 新功能需要测试覆盖
- 使用 Jest
- 测试文件命名：*.test.ts
- 覆盖率目标：核心逻辑 > 80%

---

## Pull Request 流程

1. Fork 仓库并创建功能分支
2. 确保通过测试：`npm run test`
3. 确保构建通过：`npm run build`
4. 提交 PR，描述清楚做了什么、为什么做
5. 关联相关 Issue

---

## 报告 Bug

提交 Issue 时请包含：

1. **环境信息** — ngx-datawindow 版本、Angular 版本、浏览器
2. **复现步骤** — 完整代码示例、预期行为、实际行为
3. **其他信息** — 控制台错误、截图

---

## 行为准则

- 尊重所有贡献者
- 欢迎不同观点，保持建设性讨论
- 不容忍骚扰、歧视、攻击行为

---

再次感谢你的贡献！
