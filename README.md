# @ldesign/error

<p align="center">
  <strong>企业级前端错误处理系统</strong>
</p>

<p align="center">
  完整的错误捕获、边界组件和错误上报解决方案
</p>

<p align="center">
  <a href="#features">特性</a> •
  <a href="#installation">安装</a> •
  <a href="#quick-start">快速开始</a> •
  <a href="#api">API</a> •
  <a href="#packages">子包</a>
</p>

---

## Features

- 🎯 **全局错误捕获** - JavaScript 运行时错误、Promise 拒绝、资源加载错误
- 🔄 **智能错误去重** - 基于指纹的错误去重，避免重复上报
- 📊 **批量上报** - 支持批量发送，减少网络请求
- 💾 **离线缓存** - IndexedDB 持久化，网络恢复后自动重发
- 🚀 **Beacon API** - 页面卸载时可靠发送
- 🎨 **Vue 组件** - ErrorBoundary、ErrorFallback 组件
- 🔌 **插件化** - Vue 插件、Engine 插件集成
- 📝 **TypeScript** - 完整的类型定义

## Installation

```bash
# npm
npm install @ldesign/error

# pnpm
pnpm add @ldesign/error

# yarn
yarn add @ldesign/error
```

## Quick Start

### 基础使用

```typescript
import { ErrorCatcher, ErrorReporter } from '@ldesign/error'

// 创建错误捕获器
const catcher = new ErrorCatcher({
  onError: (error) => reporter.report(error),
  enableDeduplication: true,
  maxErrorsPerMinute: 100,
})

// 创建错误上报器
const reporter = new ErrorReporter({
  endpoint: '/api/errors',
  batchSize: 10,
  useBeacon: true,
})

// 安装错误捕获
catcher.install()
```

### Vue 项目使用

```typescript
// main.ts
import { createApp } from 'vue'
import { createErrorPlugin } from '@ldesign/error'

const app = createApp(App)

app.use(createErrorPlugin({
  appName: 'MyApp',
  reporter: {
    endpoint: '/api/errors',
  },
}))
```

### ErrorBoundary 组件

```vue
<template>
  <ErrorBoundary @error="handleError" :show-stack="isDev">
    <MyComponent />
    
    <template #fallback="{ error, retry, reset }">
      <div>出错了: {{ error.message }}</div>
      <button @click="retry">重试</button>
    </template>
  </ErrorBoundary>
</template>

<script setup>
import { ErrorBoundary } from '@ldesign/error'

const isDev = import.meta.env.DEV

function handleError(error) {
  console.error('Component error:', error)
}
</script>
```

### Composables

```typescript
import { useErrorHandler, useAsyncError } from '@ldesign/error'

// 错误处理
const { errors, captureError, addBreadcrumb } = useErrorHandler()

// 异步错误处理
const { execute, isLoading, error, data, retry } = useAsyncError(
  () => fetchData(),
  {
    retryCount: 3,
    onError: (err) => console.error(err),
  }
)
```

## API

### ErrorCatcher

全局错误捕获器。

```typescript
const catcher = new ErrorCatcher(options)

interface ErrorCatcherOptions {
  enabled?: boolean              // 是否启用，默认 true
  captureGlobalErrors?: boolean  // 捕获全局错误，默认 true
  captureUnhandledRejections?: boolean  // 捕获 Promise 拒绝，默认 true
  captureResourceErrors?: boolean       // 捕获资源错误，默认 true
  maxBreadcrumbs?: number        // 最大面包屑数量，默认 50
  ignorePatterns?: (string | RegExp)[]  // 忽略的错误模式
  enableDeduplication?: boolean  // 启用去重，默认 true
  enableRateLimit?: boolean      // 启用限流，默认 true
  maxErrorsPerMinute?: number    // 每分钟最大错误数，默认 100
  beforeCapture?: (error: ErrorInfo) => ErrorInfo | null
  onError?: (error: ErrorInfo) => void
}

// 方法
catcher.install()           // 安装
catcher.uninstall()         // 卸载
catcher.captureError(error) // 手动捕获错误
catcher.captureMessage(msg) // 捕获消息
catcher.addBreadcrumb(crumb) // 添加面包屑
catcher.setUser(userId)      // 设置用户 ID
```

### ErrorReporter

错误上报器。

```typescript
const reporter = new ErrorReporter(options)

interface ErrorReporterOptions {
  enabled?: boolean           // 是否启用，默认 true
  endpoint?: string           // 上报地址，默认 '/api/errors'
  batchSize?: number          // 批量大小，默认 10
  batchInterval?: number      // 批量间隔（毫秒），默认 5000
  maxRetries?: number         // 最大重试次数，默认 3
  sampleRate?: number         // 采样率 0-1，默认 1
  enableOfflineCache?: boolean // 离线缓存，默认 true
  useBeacon?: boolean         // 使用 Beacon API，默认 true
  sendOnUnload?: boolean      // 页面卸载时发送，默认 true
  timeout?: number            // 超时（毫秒），默认 10000
  headers?: Record<string, string>
  beforeSend?: (errors: ErrorInfo[]) => ErrorInfo[] | null
  onSuccess?: (errors: ErrorInfo[]) => void
  onError?: (error: Error, failedErrors: ErrorInfo[]) => void
}

// 方法
reporter.report(error)      // 上报错误
reporter.flush()            // 立即发送
reporter.destroy()          // 销毁
```

### Vue 组件

#### ErrorBoundary

```vue
<ErrorBoundary
  :show-details="true"
  :show-stack="false"
  :retryable="true"
  :max-retries="3"
  title="Something went wrong"
  message="Please try again"
  theme="light"
  @error="handleError"
  @retry="handleRetry"
  @reset="handleReset"
>
  <YourComponent />
  
  <template #fallback="{ error, retry, reset, canRetry }">
    <!-- 自定义错误 UI -->
  </template>
</ErrorBoundary>
```

#### ErrorFallback

```vue
<ErrorFallback
  :error="errorInfo"
  title="加载失败"
  message="请稍后重试"
  :show-details="true"
  :show-retry="true"
  :show-reset="true"
  theme="light"
  size="medium"
  @retry="handleRetry"
  @reset="handleReset"
/>
```

### Composables

#### useErrorHandler

```typescript
const {
  errors,         // 错误列表
  hasError,       // 是否有错误
  catcher,        // ErrorCatcher 实例
  reporter,       // ErrorReporter 实例
  captureError,   // 手动捕获错误
  addBreadcrumb,  // 添加面包屑
  clearErrors,    // 清空错误
  flush,          // 立即上报
} = useErrorHandler(options)
```

#### useAsyncError

```typescript
const {
  execute,       // 执行异步操作
  isLoading,     // 是否加载中
  isFinished,    // 是否完成
  isSuccess,     // 是否成功
  error,         // 错误信息
  data,          // 返回数据
  retry,         // 重试
  reset,         // 重置
  retryAttempt,  // 当前重试次数
  canRetry,      // 是否可以重试
} = useAsyncError(asyncFn, {
  immediate: false,
  retryCount: 3,
  retryDelay: 1000,
  timeout: 10000,
  onError: (error) => {},
  onSuccess: (data) => {},
})
```

## Packages

| 包名 | 描述 |
|------|------|
| `@ldesign/error` | 主包，包含所有功能 |
| `@ldesign/error-core` | 核心库，框架无关 |
| `@ldesign/error-vue` | Vue 组件和插件 |

### 单独使用核心库

```typescript
import { ErrorCatcher, ErrorReporter } from '@ldesign/error-core'
```

### 单独使用 Vue 组件

```typescript
import { ErrorBoundary, useErrorHandler } from '@ldesign/error-vue'
```

## Types

```typescript
// 错误级别
enum ErrorLevel {
  FATAL = 'fatal',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

// 错误来源
enum ErrorSource {
  RUNTIME = 'runtime',
  PROMISE = 'promise',
  NETWORK = 'network',
  RESOURCE = 'resource',
  VUE = 'vue',
  REACT = 'react',
  CONSOLE = 'console',
  MANUAL = 'manual',
  UNKNOWN = 'unknown',
}

// 错误信息
interface ErrorInfo {
  id: string
  name: string
  message: string
  stack?: string
  level: ErrorLevel
  source: ErrorSource
  timestamp: number
  fingerprint?: string
  url?: string
  userAgent?: string
  userId?: string
  sessionId?: string
  extra?: Record<string, unknown>
  breadcrumbs?: Breadcrumb[]
  tags?: string[]
  componentInfo?: ComponentInfo
}
```

## Best Practices

### 1. 配置采样率

生产环境建议配置采样率以减少数据量：

```typescript
new ErrorReporter({
  sampleRate: 0.1,  // 10% 采样
})
```

### 2. 添加用户上下文

```typescript
catcher.setUser(userId)
catcher.addBreadcrumb({
  type: 'user',
  category: 'auth',
  message: 'User logged in',
})
```

### 3. 忽略特定错误

```typescript
new ErrorCatcher({
  ignorePatterns: [
    /ResizeObserver loop/,
    /Script error/,
    'Extension error',
  ],
})
```

### 4. 开发环境显示堆栈

```vue
<ErrorBoundary :show-stack="import.meta.env.DEV">
  <App />
</ErrorBoundary>
```

## License

MIT © LDesign
