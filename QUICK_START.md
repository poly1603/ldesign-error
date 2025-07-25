# 🚀 快速开始指南

欢迎使用 @ldesign/store！这个指南将帮助你在 5 分钟内完成项目设置。

## 📋 前置要求

- Node.js 16+
- pnpm 8+
- Git

## ⚡ 一键启动

```bash
# 1. 克隆项目
git clone <your-repo-url>
cd ldesign/packages/store

# 2. 安装依赖
pnpm install

# 3. 启动开发工具菜单
pnpm dev:menu
```

## 🛠️ 开发工具菜单

我们提供了两种交互方式：

### 📋 简化版菜单（推荐）

```bash
pnpm dev:menu
```

- 数字选择，兼容性最好
- 适合所有终端环境

### ⌨️ 高级版菜单

```bash
pnpm dev:menu-advanced
```

- 上下键选择，体验更现代
- 需要支持原始模式的终端

运行 `pnpm dev:menu` 后，你会看到一个交互式菜单：

```
🛠️  @ldesign/store 开发工具菜单

🚀 开发工具:
  1. 🚀 一键智能提交
     运行完整的代码检查并提交代码
  2. 💻 启动开发环境
     启动构建监听和文档开发服务器
  3. 📚 启动文档服务器
     启动 VitePress 文档开发服务器

🔍 质量检查:
  4. 🔍 运行所有检查
     类型检查、代码规范、测试、构建验证
  5. 🧪 运行测试
     运行所有测试用例
  6. 📊 测试覆盖率
     生成测试覆盖率报告
  7. 🔧 自动修复问题
     自动修复 ESLint 和 Prettier 问题

📦 构建工具:
  8. 📦 构建项目
     构建所有格式的包（ESM、CommonJS、UMD）
  9. 📖 构建文档
     构建 VitePress 文档

📊 分析工具:
  10. ⚡ 性能基准测试
      运行性能基准测试并生成报告
  11. 📈 Bundle 大小分析
      分析构建输出大小和压缩比

🧹 维护工具:
  12. 🧹 清理构建产物
      清理所有构建产物和缓存
  13. 🗑️ 深度清理
      清理所有内容包括 node_modules

  0. 退出
  h. 显示帮助

请选择操作 (输入数字):
```

## 🎯 常用工作流

### 首次设置

1. **运行环境检查**

   ```bash
   pnpm dev:menu
   # 选择 4 - 运行所有检查
   ```

2. **配置环境变量**（可选，用于自动化部署）
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，参考 docs/setup/tokens.md
   ```

### 日常开发

1. **启动开发环境**

   ```bash
   pnpm dev:menu
   # 选择 2 - 启动开发环境
   ```

2. **编写代码**
   - 修改 `src/` 下的源码
   - 查看实时构建结果
   - 访问 http://localhost:5173 查看文档

3. **提交代码**
   ```bash
   pnpm dev:menu
   # 选择 1 - 一键智能提交
   ```

### 发布版本

1. **运行质量检查**

   ```bash
   pnpm dev:menu
   # 选择 4 - 运行所有检查
   ```

2. **性能分析**

   ```bash
   pnpm dev:menu
   # 选择 13 - 性能基准测试
   # 选择 14 - Bundle 大小分析
   ```

3. **发布版本**
   ```bash
   pnpm dev:menu
   # 选择 10/11/12 - 根据变更类型选择版本
   ```

## 🔧 手动命令

如果你更喜欢直接使用命令行：

```bash
# 开发
pnpm dev:full          # 启动完整开发环境
pnpm docs:dev          # 只启动文档服务器

# 质量检查
pnpm check:all         # 运行所有检查
pnpm test:run          # 运行测试
pnpm fix:all           # 自动修复问题

# 构建
pnpm build             # 构建项目
pnpm docs:build        # 构建文档

# 提交和发布
pnpm commit            # 智能提交
pnpm release:patch     # 发布修复版本

# 分析
pnpm benchmark         # 性能基准测试
pnpm bundle-analyzer   # Bundle 分析

# 清理
pnpm clean             # 清理构建产物
```

## 🔑 Token 配置（可选）

如果你需要自动化部署功能，需要配置以下 Token：

1. **NPM Token** - 用于自动发布包
2. **GitHub Token** - 用于 GitHub Actions
3. **Codecov Token** - 用于代码覆盖率（可选）
4. **Snyk Token** - 用于安全扫描（可选）

详细获取步骤请查看：[Token 配置指南](docs/setup/tokens.md)

## 📚 更多资源

- [完整文档](docs/) - 详细的使用指南
- [自动化流程](AUTOMATION.md) - 了解自动化工作流
- [API 参考](docs/api/) - 完整的 API 文档
- [示例代码](docs/examples/) - 实际使用示例

## 🆘 遇到问题？

1. **运行帮助命令**

   ```bash
   pnpm dev:menu
   # 输入 h 查看帮助
   ```

2. **检查常见问题**
   - 确保 Node.js 版本 >= 16
   - 确保使用 pnpm 而不是 npm
   - 运行 `pnpm clean && pnpm install` 重新安装依赖

3. **查看错误日志**
   - 大多数命令都会显示详细的错误信息
   - 检查 GitHub Actions 日志（如果配置了）

4. **寻求帮助**
   - 查看项目 Issues
   - 阅读相关文档
   - 联系维护者

---

现在你已经准备好开始使用 @ldesign/store 了！🎉

建议从运行 `pnpm dev:menu` 并选择 "运行所有检查" 开始，确保环境配置正确。
