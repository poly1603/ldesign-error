/**
 * Vue 错误处理插件
 * @description 全局错误处理和上报
 * 支持全局 Toast 提示和 Tracker 集成
 */

import type { App, Plugin } from 'vue'
import type { ErrorInfo, ErrorCatcherOptions, ErrorReporterOptions } from '@ldesign/error-core'
import { ErrorCatcher, ErrorReporter, ErrorLevel, ErrorSource } from '@ldesign/error-core'
import { ERROR_HANDLER_KEY, type ErrorHandlerInstance } from '../composables/useErrorHandler'
import { addErrorToast, injectToastStyles, type ToastManagerOptions } from '../components/ErrorToast'
import { GLOBAL_ERROR_TOAST_KEY, type GlobalErrorToastInstance } from '../composables/useGlobalErrorToast'
import { TrackerIntegration, type TrackerIntegrationOptions } from '../plugins/tracker-integration'
import { vErrorBoundary } from '../directives/vErrorBoundary'

/** 全局 Toast 配置 */
export interface GlobalToastOptions extends ToastManagerOptions {
  /** 是否启用全局 Toast */
  enabled?: boolean
  /** 是否自动显示 Vue 错误 */
  showVueErrors?: boolean
  /** 是否自动显示全局错误 */
  showGlobalErrors?: boolean
}

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
  /** 全局 Toast 配置 */
  toast?: GlobalToastOptions
  /** Tracker 集成配置 */
  trackerIntegration?: TrackerIntegration | TrackerIntegrationOptions
  /** 是否注册 v-error-boundary 指令 @default true */
  registerDirective?: boolean
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
    toast: toastOptions = {},
    trackerIntegration: trackerIntegrationOption,
    registerDirective = true,
    onVueError,
  } = options

  // 默认 Toast 配置
  const toastConfig: GlobalToastOptions = {
    enabled: true,
    showVueErrors: true,
    showGlobalErrors: false,
    maxToasts: 5,
    defaultDuration: 5000,
    position: 'top-right',
    ...toastOptions,
  }

  // 创建或使用 Tracker 集成
  const trackerIntegration = trackerIntegrationOption instanceof TrackerIntegration
    ? trackerIntegrationOption
    : trackerIntegrationOption
      ? new TrackerIntegration(trackerIntegrationOption)
      : null

  return {
    install(app: App) {
      if (!enabled)
        return

      // 注入 Toast 样式
      if (toastConfig.enabled && typeof document !== 'undefined') {
        injectToastStyles()
      }

      // 创建上报器
      const reporter = new ErrorReporter({
        ...reporterOptions,
        // 在上报前添加 tracker 信息
        beforeSend: (errors) => {
          if (trackerIntegration) {
            const enrichedErrors = errors.map(err => trackerIntegration.enrichError(err))
            return reporterOptions.beforeSend
              ? reporterOptions.beforeSend(enrichedErrors)
              : enrichedErrors
          }
          return reporterOptions.beforeSend
            ? reporterOptions.beforeSend(errors)
            : errors
        },
      })

      // 创建捕获器
      const catcher = new ErrorCatcher({
        ...catcherOptions,
        onError: (error) => {
          // 如果启用了 tracker 集成，丰富错误信息
          const enrichedError = trackerIntegration
            ? trackerIntegration.enrichError(error)
            : error

          // 上报错误
          reporter.report(enrichedError)

          // 显示全局错误 Toast
          if (toastConfig.enabled && toastConfig.showGlobalErrors) {
            addErrorToast(enrichedError, toastConfig.defaultDuration)
          }

          catcherOptions.onError?.(enrichedError)
        },
      })

      // 安装全局错误捕获
      catcher.install()

      // 注册 v-error-boundary 指令
      if (registerDirective) {
        app.directive('error-boundary', vErrorBoundary)
      }

      // 处理 Vue 错误
      app.config.errorHandler = (error, instance, info) => {
        const componentName = instance?.$options?.name
          || instance?.$options?.__name
          || '未知组件'

        let errorInfo: ErrorInfo = {
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

        // 如果启用了 tracker 集成，丰富错误信息
        if (trackerIntegration) {
          errorInfo = trackerIntegration.enrichError(errorInfo)
        }

        // 上报错误
        reporter.report(errorInfo)

        // 显示 Vue 错误 Toast
        if (toastConfig.enabled && toastConfig.showVueErrors) {
          addErrorToast(errorInfo, toastConfig.defaultDuration)
        }

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
      const handlerInstance: ErrorHandlerInstance = { catcher, reporter }
      app.provide(ERROR_HANDLER_KEY, handlerInstance)

      // 提供全局 Toast 实例
      const toastInstance: GlobalErrorToastInstance = {
        showError: (err, duration) => addErrorToast(err as ErrorInfo, duration),
        showErrorMessage: (message, name = 'Error', duration) => addErrorToast({
          id: generateId(),
          name,
          message,
          level: ErrorLevel.ERROR,
          source: ErrorSource.MANUAL,
          timestamp: Date.now(),
        }, duration),
        showException: (err, duration) => addErrorToast({
          id: generateId(),
          name: err.name,
          message: err.message,
          stack: err.stack,
          level: ErrorLevel.ERROR,
          source: ErrorSource.MANUAL,
          timestamp: Date.now(),
        }, duration),
        closeError: () => {},
        clearAll: () => {},
        getErrors: () => [],
        updateOptions: () => {},
      }
      app.provide(GLOBAL_ERROR_TOAST_KEY, toastInstance)

      // 全局属性
      app.config.globalProperties.$errorHandler = handlerInstance
      app.config.globalProperties.$errorToast = toastInstance
    },
  }
}

/** 声明全局属性类型 */
declare module 'vue' {
  interface ComponentCustomProperties {
    $errorHandler: ErrorHandlerInstance
    $errorToast: GlobalErrorToastInstance
  }
}

