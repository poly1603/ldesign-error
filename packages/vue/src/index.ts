/**
 * @ldesign/error-vue
 * @description Vue 错误处理组件和插件
 * @packageDocumentation
 */

// 组件
export * from './components'

// Composables
export * from './composables'

// 插件
export * from './plugin'

// 重新导出核心类型
export type {
  ErrorInfo,
  ErrorLevel,
  ErrorSource,
  Breadcrumb,
  ComponentInfo,
  ErrorCatcherOptions,
  ErrorReporterOptions,
  ErrorBoundaryOptions,
} from '@ldesign/error-core'

export {
  ErrorCatcher,
  ErrorReporter,
} from '@ldesign/error-core'

