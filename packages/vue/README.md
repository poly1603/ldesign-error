# @ldesign/error-vue

> LDesign Vue 错误处理组件 - ErrorBoundary、Composables、插件

## Installation

```bash
pnpm add @ldesign/error-vue
```

## Features

- 🎨 ErrorBoundary 组件 - 捕获子组件错误
- 🧩 ErrorFallback 组件 - 可复用的错误 UI
- 🔧 Composables - useErrorHandler、useAsyncError
- 🔌 Vue 插件 - 全局错误处理
- 🎭 主题支持 - light/dark/auto
- 📝 完整 TypeScript 支持

## Usage

### ErrorBoundary

```vue
<template>
  <ErrorBoundary
    :show-details="true"
    :show-stack="isDev"
    :retryable="true"
    :max-retries="3"
    theme="light"
    @error="handleError"
    @retry="handleRetry"
    @reset="handleReset"
  >
    <MyComponent />
    
    <!-- 自定义错误 UI -->
    <template #fallback="{ error, retry, reset, canRetry }">
      <div class="custom-error">
        <p>{{ error.message }}</p>
        <button v-if="canRetry" @click="retry">重试</button>
        <button @click="reset">重置</button>
      </div>
    </template>
  </ErrorBoundary>
</template>

<script setup>
import { ErrorBoundary } from '@ldesign/error-vue'

const isDev = import.meta.env.DEV

function handleError(error) {
  console.error('Component error:', error)
}
</script>
```

### ErrorFallback

独立的错误 UI 组件，可在任何地方使用：

```vue
<template>
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
</template>

<script setup>
import { ErrorFallback } from '@ldesign/error-vue'
</script>
```

### useErrorHandler

```typescript
import { useErrorHandler } from '@ldesign/error-vue'

const {
  errors,         // 错误列表
  hasError,       // 是否有错误
  catcher,        // ErrorCatcher 实例
  reporter,       // ErrorReporter 实例
  captureError,   // 手动捕获错误
  addBreadcrumb,  // 添加面包屑
  clearErrors,    // 清空错误
  flush,          // 立即上报
} = useErrorHandler({
  catcher: {
    maxBreadcrumbs: 50,
  },
  reporter: {
    endpoint: '/api/errors',
  },
})

// 手动捕获错误
captureError(new Error('Something went wrong'))

// 添加面包屑
addBreadcrumb('click', 'ui', 'Button clicked', { buttonId: 'submit' })
```

### useAsyncError

处理异步操作的错误和状态：

```typescript
import { useAsyncError } from '@ldesign/error-vue'

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
} = useAsyncError(
  () => fetchUserData(userId),
  {
    immediate: true,    // 立即执行
    retryCount: 3,      // 最大重试次数
    retryDelay: 1000,   // 重试延迟
    timeout: 10000,     // 超时时间
    onError: (err) => console.error(err),
    onSuccess: (data) => console.log('Success:', data),
  }
)

// 手动执行
await execute()

// 重试
if (canRetry.value) {
  await retry()
}
```

### Vue 插件

```typescript
// main.ts
import { createApp } from 'vue'
import { createErrorPlugin } from '@ldesign/error-vue'

const app = createApp(App)

app.use(createErrorPlugin({
  appName: 'MyApp',
  enabled: true,
  catcher: {
    maxBreadcrumbs: 50,
    enableDeduplication: true,
  },
  reporter: {
    endpoint: '/api/errors',
    batchSize: 10,
  },
  onVueError: (error) => {
    console.error('Vue error:', error)
  },
}))
```

### Engine 插件

与 LDesign Engine 集成：

```typescript
import { createVueEngine } from '@ldesign/engine-vue3'
import { createErrorEnginePlugin } from '@ldesign/error-vue/plugins'

const engine = createVueEngine({
  plugins: [
    createErrorEnginePlugin({
      enabled: true,
      catcher: { maxBreadcrumbs: 50 },
      reporter: { endpoint: '/api/errors' },
    })
  ]
})
```

## Components

### ErrorBoundary Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `showDetails` | `boolean` | `true` | 显示错误详情 |
| `showStack` | `boolean` | `false` | 显示堆栈（建议开发环境） |
| `retryable` | `boolean` | `true` | 是否可重试 |
| `maxRetries` | `number` | `3` | 最大重试次数 |
| `title` | `string` | - | 错误标题 |
| `message` | `string` | - | 错误消息 |
| `showIcon` | `boolean` | `true` | 显示图标 |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'light'` | 主题 |

### ErrorBoundary Events

| 事件 | 参数 | 说明 |
|------|------|------|
| `error` | `ErrorInfo` | 捕获到错误时触发 |
| `retry` | `number` | 重试时触发，参数为重试次数 |
| `reset` | - | 重置时触发 |

### ErrorBoundary Slots

```vue
<template #fallback="{ error, retry, reset, canRetry, retryCount }">
  <!-- 自定义错误 UI -->
</template>
```

### ErrorFallback Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `error` | `ErrorInfo` | - | 错误信息 |
| `title` | `string` | - | 错误标题 |
| `message` | `string` | - | 错误消息 |
| `showDetails` | `boolean` | `false` | 显示详情 |
| `showStack` | `boolean` | `false` | 显示堆栈 |
| `showRetry` | `boolean` | `true` | 显示重试按钮 |
| `showReset` | `boolean` | `true` | 显示重置按钮 |
| `retryCount` | `number` | `0` | 当前重试次数 |
| `maxRetries` | `number` | `3` | 最大重试次数 |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'light'` | 主题 |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | 尺寸 |

## Types

```typescript
import type {
  ErrorInfo,
  ErrorLevel,
  ErrorSource,
  ErrorBoundaryOptions,
  ErrorPluginOptions,
} from '@ldesign/error-vue'
```

## License

MIT © LDesign
