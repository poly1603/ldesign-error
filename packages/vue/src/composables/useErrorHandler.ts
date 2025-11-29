/**
 * 错误处理 Composable
 * @description 提供错误处理相关的组合式函数
 */

import { ref, onMounted, onUnmounted, inject } from 'vue'
import type { ErrorInfo, ErrorCatcherOptions, ErrorReporterOptions } from '@ldesign/error-core'
import { ErrorCatcher, ErrorReporter } from '@ldesign/error-core'

/** 错误处理器注入 Key */
export const ERROR_HANDLER_KEY = Symbol('error-handler')

/** 错误处理器实例 */
export interface ErrorHandlerInstance {
  catcher: ErrorCatcher
  reporter: ErrorReporter
}

/**
 * 使用错误处理
 * @param options - 配置选项
 * @returns 错误处理工具
 */
export function useErrorHandler(options: {
  catcher?: ErrorCatcherOptions
  reporter?: ErrorReporterOptions
} = {}) {
  /** 最近的错误列表 */
  const errors = ref<ErrorInfo[]>([])
  /** 是否有错误 */
  const hasError = ref(false)

  // 尝试注入全局实例
  const injected = inject<ErrorHandlerInstance | null>(ERROR_HANDLER_KEY, null)

  // 创建或使用已有实例
  const reporter = injected?.reporter ?? new ErrorReporter({
    ...options.reporter,
    onSuccess: (reported) => {
      // 从列表中移除已上报的错误
      const ids = new Set(reported.map(e => e.id))
      errors.value = errors.value.filter(e => !ids.has(e.id))
      options.reporter?.onSuccess?.(reported)
    },
  })

  const catcher = injected?.catcher ?? new ErrorCatcher({
    ...options.catcher,
    onError: (error) => {
      errors.value.push(error)
      hasError.value = true
      // 上报错误
      reporter.report(error)
      options.catcher?.onError?.(error)
    },
  })

  // 生命周期
  onMounted(() => {
    if (!injected) {
      catcher.install()
    }
  })

  onUnmounted(() => {
    if (!injected) {
      catcher.uninstall()
    }
  })

  /** 手动捕获错误 */
  function captureError(error: Error, extra?: Record<string, unknown>): void {
    catcher.captureError(error, extra)
  }

  /** 添加面包屑 */
  function addBreadcrumb(
    type: 'navigation' | 'click' | 'input' | 'xhr' | 'fetch' | 'console' | 'custom',
    category: string,
    message: string,
    data?: Record<string, unknown>,
  ): void {
    catcher.addBreadcrumb({ type, category, message, data })
  }

  /** 清空错误 */
  function clearErrors(): void {
    errors.value = []
    hasError.value = false
  }

  /** 立即上报 */
  async function flush(): Promise<void> {
    await reporter.flush()
  }

  return {
    errors,
    hasError,
    catcher,
    reporter,
    captureError,
    addBreadcrumb,
    clearErrors,
    flush,
  }
}

