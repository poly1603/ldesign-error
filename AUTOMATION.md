# 🚀 @ldesign/store 自动化开发流程

本文档介绍了 @ldesign/store 项目的完整自动化开发和部署流程。

## 📦 一键提交命令

### 使用方法

```bash
pnpm commit
```

### 功能特性

- ✅ **代码质量检查**：TypeScript、ESLint、测试、构建验证
- 🔄 **Git 操作自动化**：stash、pull、rebase、commit、push
- 📝 **交互式提交**：Conventional Commits 格式
- 🛡️ **错误处理**：自动回滚和错误恢复
- 🎯 **智能冲突处理**：自动处理简单冲突

### 执行流程

1. **质量检查阶段**
   - TypeScript 类型检查
   - ESLint 代码规范检查
   - 运行所有测试用例
   - 验证项目构建
   - 验证文档构建

2. **Git 操作阶段**
   - 暂存当前工作区更改
   - 拉取最新代码并 rebase
   - 恢复暂存的更改
   - 处理可能的冲突

3. **交互式提交阶段**
   - 选择提交类型（feat、fix、docs 等）
   - 输入提交描述
   - 确认是否为破坏性更改
   - 自动推送到远程仓库

## 🔧 开发脚本

### 清理脚本

```bash
# 清理构建产物和缓存
pnpm clean

# 清理所有内容包括依赖
pnpm clean --deps
```

### 性能基准测试

```bash
pnpm benchmark
```

生成性能基准测试报告，包括：

- Store 创建性能
- 状态更新性能
- 计算属性性能
- 大数据集处理性能
- 内存使用情况

### Bundle 大小分析

```bash
pnpm bundle-analyzer
```

分析构建输出大小，包括：

- 各格式包大小（ESM、CommonJS、UMD）
- Gzip 压缩后大小
- 大小限制检查
- 压缩比分析

### 版本发布

```bash
# 交互式发布
pnpm release:patch   # 修复版本
pnpm release:minor   # 功能版本
pnpm release:major   # 重大版本
```

## 🔄 GitHub Actions 工作流

### CI/CD 流水线 (`.github/workflows/ci.yml`)

**触发条件**：push 到 main/develop 分支、pull request

**执行步骤**：

- 多 Node.js 版本测试 (16, 18, 20)
- 多操作系统测试 (Ubuntu, Windows)
- 代码质量检查
- 构建验证
- 安全扫描
- 测试覆盖率报告

### 文档部署 (`.github/workflows/ci.yml`)

**触发条件**：push 到 main 分支

**执行步骤**：

- 构建 VitePress 文档
- 部署到 GitHub Pages
- 更新文档搜索索引

### NPM 发布 (`.github/workflows/release.yml`)

**触发条件**：创建新的 Git tag (v*.*.\*)

**执行步骤**：

- 完整的质量检查流程
- 构建所有格式的包
- 发布到 NPM
- 生成 changelog
- 创建 GitHub Release
- 更新文档

## 🛡️ 代码质量保障

### Git Hooks (Husky)

- **pre-commit**: 运行 lint-staged
- **commit-msg**: 验证 Conventional Commits 格式
- **pre-push**: 运行完整测试套件

### lint-staged 配置

```json
{
  "*.{ts,tsx,vue}": ["eslint --fix", "prettier --write"],
  "*.{js,jsx}": ["eslint --fix", "prettier --write"],
  "*.{md,json,yml,yaml}": ["prettier --write"]
}
```

## 📋 可用脚本

### 开发脚本

```bash
pnpm dev              # 开发模式（构建监听）
pnpm dev:full         # 完整开发环境（构建 + 文档）
pnpm build            # 构建项目
pnpm test             # 运行测试（监听模式）
pnpm test:run         # 运行测试（单次）
pnpm test:coverage    # 测试覆盖率
```

### 质量检查脚本

```bash
pnpm typecheck        # TypeScript 类型检查
pnpm lint             # ESLint 检查
pnpm lint:fix         # 自动修复 ESLint 问题
pnpm format           # Prettier 格式化
pnpm format:check     # 检查格式化
pnpm check:all        # 运行所有检查
pnpm fix:all          # 自动修复所有问题
```

### 文档脚本

```bash
pnpm docs:dev         # 文档开发服务器
pnpm docs:build       # 构建文档
pnpm docs:preview     # 预览构建的文档
```

### 清理脚本

```bash
pnpm clean            # 清理构建产物
pnpm clean:deps       # 清理依赖
pnpm clean:all        # 清理所有内容
```

### 分析脚本

```bash
pnpm benchmark        # 性能基准测试
pnpm bundle-analyzer  # Bundle 大小分析
```

### 发布脚本

```bash
pnpm commit           # 一键智能提交
pnpm release:patch    # 发布修复版本
pnpm release:minor    # 发布功能版本
pnpm release:major    # 发布重大版本
```

## 🔧 环境配置

### 必需的环境变量

创建 `.env` 文件（参考 `.env.example`）：

```bash
# NPM 发布
NPM_TOKEN=your_npm_token

# GitHub Actions
GITHUB_TOKEN=your_github_token

# 代码覆盖率
CODECOV_TOKEN=your_codecov_token

# 安全扫描
SNYK_TOKEN=your_snyk_token
```

### 开发依赖

项目使用以下关键开发工具：

- **tsx**: TypeScript 脚本执行器
- **chalk**: 终端颜色输出
- **ora**: 终端加载动画
- **husky**: Git hooks 管理
- **lint-staged**: 暂存文件检查
- **concurrently**: 并发执行命令

## 🚨 错误处理

### 自动回滚机制

- 提交失败时自动恢复 stash
- 构建失败时停止发布流程
- 冲突时提供手动解决指导

### 常见问题解决

1. **提交信息格式错误**
   - 使用 `pnpm commit` 交互式提交
   - 遵循 Conventional Commits 规范

2. **测试失败**
   - 运行 `pnpm test:run` 查看详细错误
   - 修复测试后重新提交

3. **构建失败**
   - 运行 `pnpm typecheck` 检查类型错误
   - 运行 `pnpm lint` 检查代码规范

4. **依赖问题**
   - 运行 `pnpm clean:deps && pnpm install`
   - 检查 package.json 中的依赖版本

## 🎯 最佳实践

1. **提交前检查**
   - 始终使用 `pnpm commit` 进行提交
   - 确保所有测试通过
   - 遵循代码规范

2. **发布流程**
   - 使用语义化版本控制
   - 发布前运行完整测试
   - 更新文档和 changelog

3. **代码质量**
   - 保持高测试覆盖率
   - 遵循 TypeScript 最佳实践
   - 定期运行性能基准测试

4. **文档维护**
   - 保持 API 文档同步
   - 更新示例代码
   - 维护 README 和指南

---

通过这套自动化流程，开发者只需要运行 `pnpm commit` 就能完成从代码检查到部署的整个流程，大大提高了开发效率和代码质量。
