/**
 * @ldesign/error-core
 *
 * LDesign 错误处理核心库 - 框架无关的错误捕获和上报
 *
 * @packageDocumentation
 * @module @ldesign/error-core
 *
 * @example
 * ```ts
 * import { ErrorCatcher, ErrorReporter, ErrorLevel } from '@ldesign/error-core'
 *
 * // 创建错误捕获器
 * const catcher = new ErrorCatcher({
 *   onError: (error) => console.log('Caught:', error)
 * })
 *
 * // 创建错误上报器
 * const reporter = new ErrorReporter({
 *   endpoint: '/api/errors'
 * })
 *
 * // 安装并使用
 * catcher.install()
 * ```
 */

// 类型导出
export * from './types'

// 常量导出
export * from './constants'

// 工具函数导出
export * from './utils'

// 错误捕获器
export * from './catcher'

// 错误上报器
export * from './reporter'

