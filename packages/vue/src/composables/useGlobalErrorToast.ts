/**
 * 全局错误提示 Composable
 *
 * @description 提供全局错误提示的管理功能
 * 与 ErrorToastContainer 组件配合使用
 *
 * @example
 * ```ts
 * import { useGlobalErrorToast } from '@ldesign/error-vue'
 *
 * const { showError, clearAll } = useGlobalErrorToast()
 *
 * // 显示错误
 * showError({
 *   name: 'TypeError',
 *   message: 'Something went wrong',
 *   timestamp: Date.now(),
 * })
 *
 * // 显示简单消息
 * showErrorMessage('Network request failed')
 * ```
 */

import { inject, onMounted } from 'vue'
import type { ErrorInfo } from '@ldesign/error-core'
import { ErrorLevel, ErrorSource } from '@ldesign/error-core'
import {
  addErrorToast,
  removeErrorToast,
  clearAllToasts,
  getToastQueue,
  setToastManagerOptions,
  injectToastStyles,
  type ToastManagerOptions,
  type ToastItem,
} from '../components/ErrorToast'

/** 全局错误提示注入 Key */
export const GLOBAL_ERROR_TOAST_KEY = Symbol('global-error-toast')

/** 全局错误提示配置 */
export interface GlobalErrorToastOptions extends ToastManagerOptions {
  /** 是否自动注入样式 */
  autoInjectStyles?: boolean
}

/**
 * 生成错误 ID
 */
function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

/**
 * 使用全局错误提示
 *
 * @param options - 配置选项
 * @returns 全局错误提示工具
 */
export function useGlobalErrorToast(options: GlobalErrorToastOptions = {}) {
  const { autoInjectStyles = true, ...toastOptions } = options

  // 初始化
  onMounted(() => {
    // 注入样式
    if (autoInjectStyles) {
      injectToastStyles()
    }

    // 更新配置
    if (Object.keys(toastOptions).length > 0) {
      setToastManagerOptions(toastOptions)
    }
  })

  /**
   * 显示错误提示
   *
   * @param error - 错误信息
   * @param duration - 显示时长 (ms)，0 表示不自动关闭
   * @returns Toast ID
   */
  function showError(error: Partial<ErrorInfo>, duration?: number): string {
    const fullError: ErrorInfo = {
      id: error.id || generateErrorId(),
      name: error.name || 'Error',
      message: error.message || 'An error occurred',
      stack: error.stack,
      level: error.level || ErrorLevel.ERROR,
      source: error.source || ErrorSource.MANUAL,
      timestamp: error.timestamp || Date.now(),
      url: error.url,
      userAgent: error.userAgent,
      sessionId: error.sessionId,
      userId: error.userId,
      extra: error.extra,
      breadcrumbs: error.breadcrumbs,
      tags: error.tags,
      componentInfo: error.componentInfo,
    }

    return addErrorToast(fullError, duration)
  }

  /**
   * 显示简单错误消息
   *
   * @param message - 错误消息
   * @param name - 错误名称
   * @param duration - 显示时长
   * @returns Toast ID
   */
  function showErrorMessage(
    message: string,
    name = 'Error',
    duration?: number,
  ): string {
    return showError({ name, message }, duration)
  }

  /**
   * 显示异常错误
   *
   * @param error - Error 对象
   * @param duration - 显示时长
   * @returns Toast ID
   */
  function showException(error: Error, duration?: number): string {
    return showError({
      name: error.name,
      message: error.message,
      stack: error.stack,
    }, duration)
  }

  /**
   * 关闭指定错误提示
   *
   * @param id - Toast ID
   */
  function closeError(id: string): void {
    removeErrorToast(id)
  }

  /**
   * 清空所有错误提示
   */
  function clearAll(): void {
    clearAllToasts()
  }

  /**
   * 获取当前错误提示列表
   *
   * @returns 错误提示列表
   */
  function getErrors(): ToastItem[] {
    return getToastQueue()
  }

  /**
   * 更新配置
   *
   * @param newOptions - 新配置
   */
  function updateOptions(newOptions: ToastManagerOptions): void {
    setToastManagerOptions(newOptions)
  }

  return {
    /** 显示错误 (完整 ErrorInfo) */
    showError,
    /** 显示简单错误消息 */
    showErrorMessage,
    /** 显示 Error 异常 */
    showException,
    /** 关闭指定错误 */
    closeError,
    /** 清空所有错误 */
    clearAll,
    /** 获取当前错误列表 */
    getErrors,
    /** 更新配置 */
    updateOptions,
  }
}

/**
 * 全局错误提示实例类型
 */
export type GlobalErrorToastInstance = ReturnType<typeof useGlobalErrorToast>

/**
 * 注入全局错误提示实例
 *
 * @returns 全局错误提示实例或 undefined
 */
export function useInjectedGlobalErrorToast(): GlobalErrorToastInstance | undefined {
  return inject<GlobalErrorToastInstance>(GLOBAL_ERROR_TOAST_KEY)
}
