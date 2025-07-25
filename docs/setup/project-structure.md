# 📁 项目结构说明

本文档详细介绍了 @ldesign/store 项目的目录结构和文件组织。

## 🏗️ 整体结构

```
packages/store/
├── 📁 src/                    # 源代码
├── 📁 docs/                   # 文档
├── 📁 scripts/                # 开发脚本
├── 📁 tests/                  # 测试文件
├── 📁 .github/                # GitHub Actions
├── 📁 dist/                   # UMD 构建输出
├── 📁 es/                     # ESM 构建输出
├── 📁 lib/                    # CommonJS 构建输出
├── 📁 types/                  # TypeScript 声明文件
├── 📄 package.json            # 项目配置
├── 📄 tsconfig.json           # TypeScript 配置
├── 📄 rollup.config.js        # 构建配置
├── 📄 vitest.config.ts        # 测试配置
├── 📄 README.md               # 项目说明
├── 📄 QUICK_START.md          # 快速开始指南
├── 📄 AUTOMATION.md           # 自动化流程说明
└── 📄 .env.example            # 环境变量示例
```

## 📂 核心目录详解

### `src/` - 源代码

```
src/
├── 📄 index.ts                # 主入口文件
├── 📄 types.ts                # 类型定义
├── 📄 store-class.ts          # Store 基类
├── 📄 decorators.ts           # 装饰器实现
├── 📄 plugins/                # 插件系统
│   ├── 📄 index.ts
│   ├── 📄 persistence.ts      # 持久化插件
│   ├── 📄 cache.ts            # 缓存插件
│   └── 📄 performance.ts      # 性能优化插件
└── 📄 utils/                  # 工具函数
    ├── 📄 index.ts
    ├── 📄 helpers.ts
    └── 📄 validators.ts
```

**文件说明：**

- `index.ts` - 导出所有公共 API
- `types.ts` - TypeScript 类型定义
- `store-class.ts` - BaseStore 基类实现
- `decorators.ts` - @Store、@State、@Action、@Getter 装饰器
- `plugins/` - 可选插件（持久化、缓存、性能优化）
- `utils/` - 内部工具函数

### `docs/` - 文档

```
docs/
├── 📄 .vitepress/             # VitePress 配置
│   ├── 📄 config.ts
│   └── 📄 theme/
├── 📄 index.md                # 首页
├── 📄 guide/                  # 使用指南
│   ├── 📄 getting-started.md
│   ├── 📄 basic-usage.md
│   ├── 📄 advanced.md
│   └── 📄 best-practices.md
├── 📄 api/                    # API 参考
│   ├── 📄 store.md
│   ├── 📄 decorators.md
│   └── 📄 plugins.md
├── 📄 examples/               # 示例代码
│   ├── 📄 counter.md
│   ├── 📄 todo-list.md
│   └── 📄 user-management.md
└── 📄 setup/                  # 设置指南
    ├── 📄 tokens.md           # Token 配置
    └── 📄 project-structure.md # 项目结构
```

### `scripts/` - 开发脚本

```
scripts/
├── 📄 dev.ts                  # 开发工具菜单（主入口）
├── 📄 commit.ts               # 一键智能提交
├── 📄 clean.ts                # 项目清理
├── 📄 benchmark.ts            # 性能基准测试
├── 📄 bundle-analyzer.ts      # Bundle 大小分析
├── 📄 validate-commit-msg.ts  # 提交信息验证
└── 📄 release.ts              # 版本发布
```

**脚本功能：**

- `dev.ts` - 交互式开发工具菜单
- `commit.ts` - 自动化提交流程（检查 → 提交 → 推送）
- `clean.ts` - 清理构建产物和缓存
- `benchmark.ts` - 性能基准测试和报告生成
- `bundle-analyzer.ts` - 分析构建输出大小
- `validate-commit-msg.ts` - 验证 Conventional Commits 格式
- `release.ts` - 自动化版本发布流程

### `tests/` - 测试文件

```
tests/
├── 📄 setup.ts                # 测试环境设置
├── 📄 store.test.ts           # Store 基类测试
├── 📄 decorators.test.ts      # 装饰器测试
├── 📄 plugins/                # 插件测试
│   ├── 📄 persistence.test.ts
│   ├── 📄 cache.test.ts
│   └── 📄 performance.test.ts
├── 📄 utils/                  # 工具函数测试
│   └── 📄 helpers.test.ts
└── 📄 integration/            # 集成测试
    ├── 📄 basic-usage.test.ts
    └── 📄 advanced-usage.test.ts
```

### `.github/` - GitHub Actions

```
.github/
└── 📁 workflows/
    ├── 📄 ci.yml              # 持续集成
    └── 📄 release.yml         # 自动发布
```

**工作流说明：**

- `ci.yml` - 代码检查、测试、构建、安全扫描
- `release.yml` - 自动化 NPM 发布和文档部署

## 🔧 配置文件

### 构建配置

- `rollup.config.js` - Rollup 构建配置
- `tsconfig.json` - TypeScript 编译配置
- `tsconfig.build.json` - 构建专用 TS 配置

### 开发工具配置

- `.eslintrc.js` - ESLint 代码规范
- `.prettierrc` - Prettier 代码格式化
- `vitest.config.ts` - Vitest 测试配置

### 包管理配置

- `package.json` - 项目依赖和脚本
- `pnpm-lock.yaml` - 依赖锁定文件

## 📦 构建输出

### `dist/` - UMD 格式

- 用于浏览器直接引入
- 包含完整的依赖

### `es/` - ESM 格式

- 现代 ES 模块格式
- 支持 Tree Shaking

### `lib/` - CommonJS 格式

- Node.js 兼容格式
- 传统模块系统

### `types/` - TypeScript 声明

- `.d.ts` 类型声明文件
- 提供完整的类型支持

## 🎯 开发工作流

### 1. 源码开发

```bash
src/ → 编写源代码
tests/ → 编写测试
docs/ → 更新文档
```

### 2. 质量检查

```bash
scripts/dev.ts → 运行检查
.github/workflows/ → CI/CD 验证
```

### 3. 构建发布

```bash
rollup.config.js → 构建多格式包
scripts/release.ts → 自动化发布
```

## 📋 文件命名规范

### 源码文件

- `kebab-case.ts` - 普通模块文件
- `PascalCase.ts` - 类定义文件
- `index.ts` - 入口文件

### 测试文件

- `*.test.ts` - 单元测试
- `*.spec.ts` - 规格测试
- `setup.ts` - 测试配置

### 文档文件

- `kebab-case.md` - 普通文档
- `README.md` - 项目说明
- `CHANGELOG.md` - 变更日志

## 🔍 查找文件技巧

### 按功能查找

- **核心功能** → `src/`
- **使用文档** → `docs/guide/`
- **API 文档** → `docs/api/`
- **开发工具** → `scripts/`
- **测试用例** → `tests/`

### 按类型查找

- **TypeScript 源码** → `src/**/*.ts`
- **测试文件** → `tests/**/*.test.ts`
- **文档文件** → `docs/**/*.md`
- **配置文件** → `*.config.*`

### 快速定位

```bash
# 查找特定功能
find src -name "*store*"
find docs -name "*api*"
find scripts -name "*commit*"

# 查找特定类型
find . -name "*.test.ts"
find . -name "*.config.*"
find . -name "README*"
```

---

这个项目结构设计遵循了现代前端项目的最佳实践，提供了清晰的代码组织、完整的文档体系和强大的开发工具支持。
