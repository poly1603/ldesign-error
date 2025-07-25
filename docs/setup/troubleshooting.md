# 🔧 故障排除指南

本指南帮助你解决在使用 @ldesign/store 过程中可能遇到的常见问题。

## 🚨 常见错误

### TypeScript 相关

#### 错误：`allowImportingTsExtensions` 配置冲突

```
Option 'allowImportingTsExtensions' can only be used when either 'noEmit' or 'emitDeclarationOnly' is set.
```

**解决方案：**
```json
// tsconfig.json
{
  "compilerOptions": {
    "noEmit": true,
    // 移除 allowImportingTsExtensions 或设置 emitDeclarationOnly: true
  }
}
```

#### 错误：vue-tsc 编译失败

```
Search string not found: "/supportedTSExtensions = .*(?=;)/"
```

**解决方案：**
1. 更新 vue-tsc 版本：`pnpm add -D vue-tsc@latest`
2. 或使用 tsc 替代：`pnpm add -D typescript`

### 测试相关

#### 错误：测试快照不匹配

```
expect(received).toEqual(expected)
```

**解决方案：**
1. 更新快照：`pnpm test -- --update-snapshots`
2. 检查测试逻辑是否正确
3. 确保测试环境一致

#### 错误：测试覆盖率不足

**解决方案：**
1. 添加更多测试用例
2. 检查未覆盖的代码分支
3. 使用 `pnpm test:coverage` 查看详细报告

### 构建相关

#### 警告：混合命名和默认导出

```
Mixing named and default exports
```

**解决方案：**
```js
// rollup.config.js
export default {
  output: {
    exports: 'named'
  }
}
```

#### 错误：模块解析失败

**解决方案：**
1. 检查 `package.json` 中的 `exports` 字段
2. 确保路径映射正确
3. 验证依赖安装完整

### 文档相关

#### 错误：VitePress 死链接

```
Found dead link(s)
```

**解决方案：**
1. 检查链接路径是否正确
2. 确保引用的文件存在
3. 使用相对路径而非绝对路径

#### 错误：文档构建失败

**解决方案：**
1. 检查 markdown 语法
2. 验证代码块语言标识
3. 确保图片和资源文件存在

### 环境配置

#### 错误：Token 无效或过期

**解决方案：**
1. 重新生成 Token
2. 检查 Token 权限
3. 验证环境变量设置

#### 错误：NPM 发布失败

```
npm ERR! 403 Forbidden
```

**解决方案：**
1. 检查 NPM Token 权限
2. 验证包名是否可用
3. 确保登录状态正确

### 依赖相关

#### 错误：pnpm 安装失败

**解决方案：**
1. 清理缓存：`pnpm store prune`
2. 删除 node_modules：`rm -rf node_modules`
3. 重新安装：`pnpm install`

#### 错误：版本冲突

```
WARN Issues with peer dependencies found
```

**解决方案：**
1. 更新依赖版本
2. 使用 `pnpm update`
3. 检查 peer dependencies

## 🔍 调试技巧

### 1. 启用详细日志

```bash
# 启用 pnpm 详细日志
pnpm --loglevel debug install

# 启用 TypeScript 详细输出
pnpm typecheck --verbose
```

### 2. 检查环境

```bash
# 检查 Node.js 版本
node --version

# 检查 pnpm 版本
pnpm --version

# 检查 TypeScript 版本
pnpm tsc --version
```

### 3. 清理和重置

```bash
# 清理构建产物
pnpm clean

# 深度清理
pnpm clean:all

# 重新安装依赖
pnpm install
```

## 🛠️ 开发工具

### VS Code 配置

推荐安装以下扩展：
- TypeScript Importer
- ESLint
- Prettier
- Vue Language Features (Volar)

### 调试配置

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
      "args": ["run"],
      "console": "integratedTerminal"
    }
  ]
}
```

## 📞 获取帮助

### 1. 查看日志

大多数问题的线索都在错误日志中：
- 仔细阅读错误信息
- 查看堆栈跟踪
- 注意警告信息

### 2. 搜索已知问题

- 查看项目 Issues
- 搜索相关错误信息
- 查阅官方文档

### 3. 提交问题

如果无法解决，请提交 Issue 并包含：
- 错误信息完整日志
- 复现步骤
- 环境信息（Node.js、pnpm 版本等）
- 相关配置文件

### 4. 社区支持

- GitHub Discussions
- Stack Overflow
- 相关技术社区

## 🎯 预防措施

### 1. 定期更新

```bash
# 检查过期依赖
pnpm outdated

# 更新依赖
pnpm update
```

### 2. 代码质量

- 使用 ESLint 和 Prettier
- 编写充分的测试
- 定期运行类型检查

### 3. 文档维护

- 保持文档更新
- 验证链接有效性
- 更新示例代码

---

💡 **提示**：大多数问题都有标准解决方案，遇到问题时不要慌张，按步骤排查通常能快速解决！
