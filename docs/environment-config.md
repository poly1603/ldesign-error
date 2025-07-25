# 🔧 环境配置管理

@ldesign/store 提供了一个强大的环境配置管理功能，帮你轻松管理项目所需的各种 API Token。

## 🚀 快速开始

运行开发菜单并选择"环境配置管理"：

```bash
pnpm dev:menu
```

使用 ↑↓ 键选择"⚙️ 环境配置管理"，然后按 Enter 进入。

## 📋 支持的 Token

### 🔧 必需的 Token

| Token          | 用途                       | 获取地址                                            | 状态检查 |
| -------------- | -------------------------- | --------------------------------------------------- | -------- |
| `NPM_TOKEN`    | 发布包到 NPM 注册表        | [NPM Tokens](https://www.npmjs.com/settings/tokens) | ✅/❌    |
| `GITHUB_TOKEN` | GitHub Actions 和 API 访问 | [GitHub Tokens](https://github.com/settings/tokens) | ✅/❌    |

### 🔧 可选的 Token

| Token                | 用途               | 获取地址                                                          | 状态检查 |
| -------------------- | ------------------ | ----------------------------------------------------------------- | -------- |
| `CODECOV_TOKEN`      | 上传测试覆盖率报告 | [CodeCov](https://codecov.io/)                                    | ✅/❌    |
| `SNYK_TOKEN`         | 安全漏洞扫描       | [Snyk Account](https://app.snyk.io/account)                       | ✅/❌    |
| `NETLIFY_AUTH_TOKEN` | 部署到 Netlify     | [Netlify Applications](https://app.netlify.com/user/applications) | ✅/❌    |
| `VERCEL_TOKEN`       | 部署到 Vercel      | [Vercel Tokens](https://vercel.com/account/tokens)                | ✅/❌    |

## 📝 配置方法

### 方法一：使用 .env.local 文件（推荐）

在项目根目录创建 `.env.local` 文件：

```bash
# API Tokens for @ldesign/store

# NPM Token - 用于发布包到 NPM 注册表
NPM_TOKEN=npm_your_actual_token_here

# GitHub Token - 用于 GitHub Actions 和 API 访问
GITHUB_TOKEN=ghp_your_actual_token_here

# CodeCov Token - 用于上传测试覆盖率报告
CODECOV_TOKEN=your_codecov_token_here

# Snyk Token - 用于安全漏洞扫描
SNYK_TOKEN=your_snyk_token_here

# Netlify Token - 用于部署到 Netlify
NETLIFY_AUTH_TOKEN=your_netlify_token_here

# Vercel Token - 用于部署到 Vercel
VERCEL_TOKEN=your_vercel_token_here
```

### 方法二：使用环境变量

直接在系统环境变量中设置：

```bash
export NPM_TOKEN="your_npm_token"
export GITHUB_TOKEN="your_github_token"
# ... 其他 Token
```

## 🔍 状态检查

环境配置管理器会自动检查每个 Token 的配置状态：

- ✅ **已配置**：Token 已正确设置并可用
- ❌ **未配置**：Token 未设置或为空

## 📖 获取 Token 详细指南

### 🔧 NPM Token

1. 访问 [NPM Tokens 页面](https://www.npmjs.com/settings/tokens)
2. 点击 "Generate New Token"
3. 选择 "Automation" 类型
4. 复制生成的 Token

### 🔧 GitHub Token

1. 访问 [GitHub Tokens 页面](https://github.com/settings/tokens)
2. 点击 "Generate new token (classic)"
3. 选择权限：`repo`, `workflow`, `write:packages`
4. 复制生成的 Token

### 🔧 CodeCov Token

1. 访问 [CodeCov](https://codecov.io/) 并登录
2. 添加你的 GitHub 仓库
3. 在仓库设置中找到 Upload Token
4. 复制 Token

### 🔧 Snyk Token

1. 访问 [Snyk Account](https://app.snyk.io/account)
2. 在 "General Account Settings" 中找到 Auth Token
3. 点击 "Show" 显示 Token
4. 复制 Token

### 🔧 Netlify Token

1. 访问 [Netlify Applications](https://app.netlify.com/user/applications)
2. 在 "Personal access tokens" 部分
3. 点击 "New access token"
4. 输入描述并生成 Token

### 🔧 Vercel Token

1. 访问 [Vercel Tokens](https://vercel.com/account/tokens)
2. 点击 "Create Token"
3. 输入 Token 名称
4. 复制生成的 Token

## 🔒 安全注意事项

1. **永远不要**将 Token 提交到版本控制系统
2. `.env.local` 文件已在 `.gitignore` 中排除
3. 定期轮换你的 Token
4. 只给 Token 必要的最小权限
5. 在 CI/CD 环境中使用加密的环境变量

## 🎯 使用场景

### 开发环境

- 使用 `.env.local` 文件存储 Token
- 通过环境配置管理器检查状态

### CI/CD 环境

- 在 GitHub Actions secrets 中设置 Token
- 在构建脚本中引用环境变量

### 生产环境

- 使用安全的密钥管理服务
- 通过环境变量注入 Token

## 🚨 故障排除

### Token 显示未配置但已设置

1. 检查 Token 名称是否正确
2. 确保 `.env.local` 文件在正确位置
3. 重启开发服务器
4. 检查 Token 值是否包含特殊字符

### Token 无法使用

1. 验证 Token 是否过期
2. 检查 Token 权限是否足够
3. 确认 Token 格式是否正确
4. 联系相应服务的支持团队

## 🎉 最佳实践

1. **团队协作**：为团队成员提供 Token 获取指南
2. **文档更新**：及时更新 Token 配置文档
3. **权限管理**：定期审查 Token 权限
4. **监控使用**：监控 Token 使用情况和异常
5. **备份计划**：准备 Token 失效时的应急方案

---

💡 **提示**：环境配置管理器会在每次运行时自动检查所有 Token 的状态，让你随时了解项目的配置情况！
