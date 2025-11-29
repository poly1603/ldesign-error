/**
 * 全局错误捕获器
 * @description 捕获全局 JavaScript 错误、Promise 拒绝和资源加载错误
 */

import type { Breadcrumb, ErrorCatcherOptions, ErrorInfo } from '../types'
import { ErrorLevel, ErrorSource } from '../types'

/** 生成唯一 ID */
function generateId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

/**
 * 全局错误捕获器
 */
export class ErrorCatcher {
  private options: Required<ErrorCatcherOptions>
  private breadcrumbs: Breadcrumb[] = []
  private isInstalled = false
  private originalOnError: OnErrorEventHandler | null = null
  private originalOnUnhandledRejection: ((event: PromiseRejectionEvent) => void) | null = null

  constructor(options: ErrorCatcherOptions = {}) {
    this.options = {
      enabled: options.enabled ?? true,
      captureGlobalErrors: options.captureGlobalErrors ?? true,
      captureUnhandledRejections: options.captureUnhandledRejections ?? true,
      captureResourceErrors: options.captureResourceErrors ?? true,
      captureNetworkErrors: options.captureNetworkErrors ?? true,
      maxBreadcrumbs: options.maxBreadcrumbs ?? 50,
      ignorePatterns: options.ignorePatterns ?? [],
      beforeCapture: options.beforeCapture ?? (e => e),
      onError: options.onError ?? (() => { }),
    }
  }

  /** 安装错误捕获 */
  install(): void {
    if (this.isInstalled || !this.options.enabled)
      return
    if (typeof window === 'undefined')
      return

    if (this.options.captureGlobalErrors) {
      this.originalOnError = window.onerror
      window.onerror = (message, source, lineno, colno, error) => {
        this.handleGlobalError(message, source, lineno, colno, error)
        if (this.originalOnError) {
          return this.originalOnError(message, source, lineno, colno, error)
        }
        return false
      }
    }

    if (this.options.captureUnhandledRejections) {
      this.originalOnUnhandledRejection = window.onunhandledrejection as any
      window.onunhandledrejection = (event: PromiseRejectionEvent) => {
        this.handlePromiseRejection(event)
        if (this.originalOnUnhandledRejection) {
          this.originalOnUnhandledRejection(event)
        }
      }
    }

    if (this.options.captureResourceErrors) {
      window.addEventListener('error', this.handleResourceError.bind(this), true)
    }

    this.isInstalled = true
  }

  /** 卸载错误捕获 */
  uninstall(): void {
    if (!this.isInstalled)
      return
    if (typeof window === 'undefined')
      return

    if (this.options.captureGlobalErrors && this.originalOnError !== null) {
      window.onerror = this.originalOnError
    }

    if (this.options.captureUnhandledRejections && this.originalOnUnhandledRejection !== null) {
      window.onunhandledrejection = this.originalOnUnhandledRejection as any
    }

    if (this.options.captureResourceErrors) {
      window.removeEventListener('error', this.handleResourceError.bind(this), true)
    }

    this.isInstalled = false
  }

  /** 处理全局错误 */
  private handleGlobalError(
    message: string | Event,
    source?: string,
    lineno?: number,
    colno?: number,
    error?: Error,
  ): void {
    const errorInfo = this.createErrorInfo(
      error || new Error(String(message)),
      ErrorSource.RUNTIME,
      { source, lineno, colno },
    )
    this.processError(errorInfo)
  }

  /** 处理 Promise 拒绝 */
  private handlePromiseRejection(event: PromiseRejectionEvent): void {
    const reason = event.reason
    const error = reason instanceof Error
      ? reason
      : new Error(typeof reason === 'string' ? reason : JSON.stringify(reason))
    const errorInfo = this.createErrorInfo(error, ErrorSource.PROMISE)
    this.processError(errorInfo)
  }

  /** 处理资源加载错误 */
  private handleResourceError(event: Event): void {
    const target = event.target as HTMLElement
    if (!target || target === window as any)
      return

    if (!(target instanceof HTMLScriptElement
      || target instanceof HTMLLinkElement
      || target instanceof HTMLImageElement)) {
      return
    }

    const errorInfo = this.createErrorInfo(
      new Error(`资源加载失败: ${(target as any).src || (target as any).href}`),
      ErrorSource.RESOURCE,
      { tagName: target.tagName, src: (target as any).src || (target as any).href },
    )
    this.processError(errorInfo)
  }

  /** 创建错误信息 */
  private createErrorInfo(
    error: Error,
    source: ErrorSource,
    extra?: Record<string, unknown>,
  ): ErrorInfo {
    return {
      id: generateId(),
      name: error.name,
      message: error.message,
      stack: error.stack,
      level: ErrorLevel.ERROR,
      source,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      extra,
      breadcrumbs: [...this.breadcrumbs],
    }
  }

  /** 处理错误 */
  private processError(errorInfo: ErrorInfo): void {
    if (this.shouldIgnore(errorInfo))
      return
    const processed = this.options.beforeCapture(errorInfo)
    if (!processed)
      return
    this.options.onError(processed)
  }

  /** 检查是否应该忽略 */
  private shouldIgnore(errorInfo: ErrorInfo): boolean {
    const message = errorInfo.message
    for (const pattern of this.options.ignorePatterns) {
      if (typeof pattern === 'string') {
        if (message.includes(pattern))
          return true
      }
      else if (pattern.test(message)) {
        return true
      }
    }
    return false
  }

  /** 添加面包屑 */
  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
    const crumb: Breadcrumb = {
      ...breadcrumb,
      timestamp: Date.now(),
    }
    this.breadcrumbs.push(crumb)
    if (this.breadcrumbs.length > this.options.maxBreadcrumbs) {
      this.breadcrumbs.shift()
    }
  }

  /** 清空面包屑 */
  clearBreadcrumbs(): void {
    this.breadcrumbs = []
  }

  /** 手动捕获错误 */
  captureError(error: Error, extra?: Record<string, unknown>): void {
    const errorInfo = this.createErrorInfo(error, ErrorSource.MANUAL, extra)
    this.processError(errorInfo)
  }

  /** 手动捕获消息 */
  captureMessage(message: string, level: ErrorLevel = ErrorLevel.INFO, extra?: Record<string, unknown>): void {
    const errorInfo: ErrorInfo = {
      id: generateId(),
      name: 'Message',
      message,
      level,
      source: ErrorSource.MANUAL,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      extra,
      breadcrumbs: [...this.breadcrumbs],
    }
    this.processError(errorInfo)
  }

  /** 获取当前面包屑 */
  getBreadcrumbs(): Breadcrumb[] {
    return [...this.breadcrumbs]
  }
}