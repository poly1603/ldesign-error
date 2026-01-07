/**
 * @ldesign/error-vue
 * @description Vue 错误处理组件和插件
 * 支持组件级错误隔离、全局错误提示、Tracker 集成
 * @packageDocumentation
 */

// 组件
export * from './components'

// Composables
export * from './composables'

// 指令
export * from './directives'

// 插件
export * from './plugin'

// Plugins (含 Tracker 集成)
export * from './plugins'

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

