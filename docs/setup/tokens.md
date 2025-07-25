# 🔑 Token 配置指南

本指南将帮助你获取和配置项目所需的各种 API Token。

## 📋 必需的 Token

### 1. NPM Token (必需)

用于自动发布包到 NPM 仓库。

#### 获取步骤：

1. **登录 NPM**
   - 访问 [npmjs.com](https://www.npmjs.com/)
   - 登录你的账户

2. **创建 Access Token**
   - 点击头像 → `Access Tokens`
   - 点击 `Generate New Token`
   - 选择 `Automation` 类型
   - 复制生成的 token

3. **配置**
   ```bash
   NPM_TOKEN=npm_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### 2. GitHub Token (必需)

用于 GitHub Actions 和自动化操作。

#### 获取步骤：

1. **访问 GitHub Settings**
   - 登录 GitHub
   - 点击头像 → `Settings`
   - 左侧菜单选择 `Developer settings`
   - 选择 `Personal access tokens` → `Tokens (classic)`

2. **创建新 Token**
   - 点击 `Generate new token (classic)`
   - 设置过期时间（建议 90 天）
   - 选择权限：
     - ✅ `repo` (完整仓库访问)
     - ✅ `workflow` (GitHub Actions)
     - ✅ `write:packages` (发布包)
     - ✅ `read:org` (读取组织信息)

3. **配置**
   ```bash
   GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### 3. Codecov Token (可选)

用于代码覆盖率报告。

#### 获取步骤：

1. **访问 Codecov**
   - 访问 [codecov.io](https://codecov.io/)
   - 使用 GitHub 账户登录

2. **添加仓库**
   - 点击 `Add new repository`
   - 选择你的仓库
   - 复制 Repository Upload Token

3. **配置**
   ```bash
   CODECOV_TOKEN=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ```

### 4. Snyk Token (可选)

用于安全漏洞扫描。

#### 获取步骤：

1. **注册 Snyk**
   - 访问 [snyk.io](https://snyk.io/)
   - 使用 GitHub 账户注册

2. **获取 API Token**
   - 登录后点击头像 → `Account settings`
   - 找到 `API Token` 部分
   - 点击 `Show` 并复制 token

3. **配置**
   ```bash
   SNYK_TOKEN=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ```

## 🚀 部署平台 Token (可选)

### Netlify (推荐用于文档部署)

#### 获取步骤：

1. **注册 Netlify**
   - 访问 [netlify.com](https://netlify.com/)
   - 使用 GitHub 账户注册

2. **创建站点**
   - 点击 `New site from Git`
   - 连接 GitHub 仓库
   - 设置构建命令：`pnpm docs:build`
   - 设置发布目录：`docs/.vitepress/dist`

3. **获取 Token**
   - 访问 `User settings` → `Applications`
   - 点击 `New access token`
   - 复制生成的 token

4. **获取 Site ID**
   - 在站点设置中找到 `Site ID`

5. **配置**
   ```bash
   NETLIFY_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   NETLIFY_SITE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ```

### Vercel (备选方案)

#### 获取步骤：

1. **注册 Vercel**
   - 访问 [vercel.com](https://vercel.com/)
   - 使用 GitHub 账户注册

2. **创建项目**
   - 导入 GitHub 仓库
   - 设置构建命令和输出目录

3. **获取 Token**
   - 访问 `Settings` → `Tokens`
   - 创建新的 token

4. **获取项目信息**
   - 在项目设置中找到 `Project ID`
   - 在团队设置中找到 `Team ID`

5. **配置**
   ```bash
   VERCEL_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   VERCEL_ORG_ID=team_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   VERCEL_PROJECT_ID=prj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

## 🔧 配置步骤

### 1. 本地开发配置

1. **复制环境变量文件**

   ```bash
   cp .env.example .env
   ```

2. **编辑 .env 文件**

   ```bash
   # 使用你喜欢的编辑器
   code .env
   # 或
   vim .env
   ```

3. **填入获取的 Token**
   - 将上面获取的各种 token 填入对应位置
   - 保存文件

### 2. GitHub Actions 配置

1. **访问仓库设置**
   - 在 GitHub 仓库页面点击 `Settings`
   - 左侧菜单选择 `Secrets and variables` → `Actions`

2. **添加 Repository Secrets**
   - 点击 `New repository secret`
   - 逐个添加以下 secrets：
     - `NPM_TOKEN`
     - `CODECOV_TOKEN`
     - `SNYK_TOKEN`
     - `NETLIFY_AUTH_TOKEN`
     - `NETLIFY_SITE_ID`

3. **验证配置**
   - 推送代码到仓库
   - 检查 GitHub Actions 是否正常运行

## ⚠️ 安全注意事项

### Token 安全最佳实践

1. **永远不要提交 Token 到代码仓库**
   - 确保 `.env` 文件在 `.gitignore` 中
   - 定期检查是否意外提交了敏感信息

2. **定期轮换 Token**
   - 建议每 90 天更换一次 token
   - 如果怀疑 token 泄露，立即撤销并重新生成

3. **最小权限原则**
   - 只授予必要的权限
   - 定期审查 token 权限

4. **使用环境变量**
   - 在生产环境中使用环境变量而不是文件
   - 使用密钥管理服务（如 AWS Secrets Manager）

### 常见问题

#### Q: NPM Token 权限不足

A: 确保选择了 `Automation` 类型的 token，并且有发布权限

#### Q: GitHub Actions 无法访问 secrets

A: 检查 secret 名称是否正确，确保在正确的仓库中配置

#### Q: Codecov 上传失败

A: 确保 token 对应正确的仓库，检查网络连接

#### Q: 文档部署失败

A: 检查构建命令和输出目录配置是否正确

## 🧪 测试配置

配置完成后，可以通过以下方式测试：

```bash
# 测试 NPM token
npm whoami

# 测试 GitHub token
gh auth status

# 测试构建和部署
pnpm docs:build
```

## 📞 获取帮助

如果在配置过程中遇到问题：

1. 查看各平台的官方文档
2. 检查 GitHub Actions 的运行日志
3. 在项目 Issues 中提问
4. 参考 [故障排除指南](./troubleshooting.md)

---

配置完成后，你就可以享受完全自动化的开发和部署流程了！🎉
