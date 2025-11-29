/**
 * Vue 错误处理插件
 * @description 全局错误处理和上报
 */

import type { App, Plugin } from 'vue'
import type { ErrorInfo, ErrorCatcherOptions, ErrorReporterOptions } from '@ldesign/error-core'
import { ErrorCatcher, ErrorReporter, ErrorLevel, ErrorSource } from '@ldesign/error-core'
import { ERROR_HANDLER_KEY, type ErrorHandlerInstance } from '../composables/useErrorHandler'

/** 插件配置 */
export interface ErrorPluginOptions {
  /** 应用名称 */
  appName?: string
  /** 是否启用 */
  enabled?: boolean
  /** 错误捕获器配置 */
  catcher?: ErrorCatcherOptions
  /** 错误上报器配置 */
  reporter?: ErrorReporterOptions
  /** Vue 错误处理回调 */
  onVueError?: (error: ErrorInfo) => void
}

/** 生成错误 ID */
function generateId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

/**
 * 创建错误处理插件
 * @param options - 插件配置
 * @returns Vue 插件
 */
export function createErrorPlugin(options: ErrorPluginOptions = {}): Plugin {
  const {
    appName = 'LDesignApp',
    enabled = true,
    catcher: catcherOptions = {},
    reporter: reporterOptions = {},
    onVueError,
  } = options

  return {
    install(app: App) {
      if (!enabled)
        return

      // 创建上报器
      const reporter = new ErrorReporter(reporterOptions)

      // 创建捕获器
      const catcher = new ErrorCatcher({
        ...catcherOptions,
        onError: (error) => {
          reporter.report(error)
          catcherOptions.onError?.(error)
        },
      })

      // 安装全局错误捕获
      catcher.install()

      // 处理 Vue 错误
      app.config.errorHandler = (error, instance, info) => {
        const componentName = instance?.$options?.name
          || instance?.$options?.__name
          || '未知组件'

        const errorInfo: ErrorInfo = {
          id: generateId(),
          name: (error as Error).name || 'Error',
          message: (error as Error).message || String(error),
          stack: (error as Error).stack,
          level: ErrorLevel.ERROR,
          source: ErrorSource.VUE,
          timestamp: Date.now(),
          url: typeof window !== 'undefined' ? window.location.href : undefined,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          componentInfo: {
            name: componentName,
            tree: [componentName],
          },
          extra: {
            appName,
            vueInfo: info,
          },
          breadcrumbs: catcher.getBreadcrumbs(),
        }

        // 上报错误
        reporter.report(errorInfo)

        // 回调
        onVueError?.(errorInfo)

        // 开发模式输出到控制台
        if (import.meta.env?.DEV) {
          console.error('[Vue Error]', error)
          console.error('Component:', componentName)
          console.error('Info:', info)
        }
      }

      // 提供全局实例
      const instance: ErrorHandlerInstance = { catcher, reporter }
      app.provide(ERROR_HANDLER_KEY, instance)

      // 全局属性
      app.config.globalProperties.$errorHandler = instance
    },
  }
}

/** 声明全局属性类型 */
declare module 'vue' {
  interface ComponentCustomProperties {
    $errorHandler: ErrorHandlerInstance
  }
}

