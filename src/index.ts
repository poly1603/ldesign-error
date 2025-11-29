/**
 * @ldesign/error - 企业级错误处理系统
 *
 * 提供完整的错误捕获、边界组件和错误上报功能
 *
 * @module @ldesign/error
 * @example
 * ```ts
 * // 使用错误捕获
 * import { ErrorCatcher, ErrorReporter } from '@ldesign/error'
 *
 * const catcher = new ErrorCatcher()
 * const reporter = new ErrorReporter({ endpoint: '/api/errors' })
 *
 * catcher.on('error', (error) => {
 *   reporter.report(error)
 * })
 * ```
 *
 * @example
 * ```vue
 * // Vue 组件中使用
 * <template>
 *   <ErrorBoundary @error="handleError">
 *     <MyComponent />
 *   </ErrorBoundary>
 * </template>
 *
 * <script setup>
 * import { ErrorBoundary, useErrorHandler } from '@ldesign/error'
 *
 * const { captureError } = useErrorHandler()
 * </script>
 * ```
 */

// 导出核心功能
export * from '@ldesign/error-core'

// 导出 Vue 功能
export * from '@ldesign/error-vue'

