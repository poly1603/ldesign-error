# @ldesign/error-core

> LDesign 错误处理核心库 - 框架无关的错误捕获和上报

## Installation

```bash
pnpm add @ldesign/error-core
```

## Features

- 🎯 全局错误捕获（JS 错误、Promise 拒绝、资源加载错误）
- 🔄 错误指纹去重
- 📊 错误限流保护
- 💾 离线缓存（IndexedDB）
- 🚀 Beacon API 支持
- 📝 完整 TypeScript 支持

## Usage

### ErrorCatcher

```typescript
import { ErrorCatcher, ErrorLevel } from '@ldesign/error-core'

const catcher = new ErrorCatcher({
  onError: (error) => console.log('Error caught:', error),
  enableDeduplication: true,
  maxErrorsPerMinute: 100,
})

// 安装
catcher.install()

// 手动捕获错误
catcher.captureError(new Error('Something went wrong'))

// 添加面包屑
catcher.addBreadcrumb({
  type: 'click',
  category: 'ui',
  message: 'Button clicked',
})

// 设置用户
catcher.setUser('user-123')

// 卸载
catcher.uninstall()
```

### ErrorReporter

```typescript
import { ErrorReporter } from '@ldesign/error-core'

const reporter = new ErrorReporter({
  endpoint: '/api/errors',
  batchSize: 10,
  useBeacon: true,
  sendOnUnload: true,
})

// 上报错误
reporter.report(errorInfo)

// 立即发送
await reporter.flush()

// 销毁
await reporter.destroy()
```

### 工具函数

```typescript
import {
  generateErrorId,
  generateFingerprint,
  normalizeError,
  isNetworkError,
  throttle,
  debounce,
} from '@ldesign/error-core'

// 生成错误 ID
const id = generateErrorId()

// 生成错误指纹
const fingerprint = generateFingerprint(errorInfo)

// 规范化错误
const error = normalizeError('string error')

// 检查网络错误
if (isNetworkError(error)) {
  // ...
}
```

## API

### ErrorCatcherOptions

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | `boolean` | `true` | 是否启用 |
| `captureGlobalErrors` | `boolean` | `true` | 捕获全局错误 |
| `captureUnhandledRejections` | `boolean` | `true` | 捕获 Promise 拒绝 |
| `captureResourceErrors` | `boolean` | `true` | 捕获资源错误 |
| `maxBreadcrumbs` | `number` | `50` | 最大面包屑数量 |
| `enableDeduplication` | `boolean` | `true` | 启用去重 |
| `enableRateLimit` | `boolean` | `true` | 启用限流 |
| `maxErrorsPerMinute` | `number` | `100` | 每分钟最大错误数 |
| `ignorePatterns` | `(string \| RegExp)[]` | `[]` | 忽略的错误模式 |
| `beforeCapture` | `Function` | - | 捕获前处理 |
| `onError` | `Function` | - | 错误回调 |

### ErrorReporterOptions

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | `boolean` | `true` | 是否启用 |
| `endpoint` | `string` | `/api/errors` | 上报地址 |
| `batchSize` | `number` | `10` | 批量大小 |
| `batchInterval` | `number` | `5000` | 批量间隔（ms） |
| `maxRetries` | `number` | `3` | 最大重试次数 |
| `retryDelay` | `number` | `1000` | 重试延迟（ms） |
| `sampleRate` | `number` | `1` | 采样率 0-1 |
| `enableOfflineCache` | `boolean` | `true` | 离线缓存 |
| `useBeacon` | `boolean` | `true` | 使用 Beacon API |
| `sendOnUnload` | `boolean` | `true` | 页面卸载时发送 |
| `timeout` | `number` | `10000` | 超时（ms） |

## Types

```typescript
import type {
  ErrorInfo,
  ErrorLevel,
  ErrorSource,
  Breadcrumb,
  ComponentInfo,
  ErrorCatcherOptions,
  ErrorReporterOptions,
} from '@ldesign/error-core'
```

## License

MIT © LDesign
