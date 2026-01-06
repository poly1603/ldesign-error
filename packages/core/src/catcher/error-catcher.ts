/**
 * 全局错误捕获器
 *
 * @description 捕获全局 JavaScript 错误、Promise 拒绝和资源加载错误
 * 支持错误去重、限流、指纹生成等功能
 *
 * @example
 * ```ts
 * const catcher = new ErrorCatcher({
 *   onError: (error) => reporter.report(error),
 *   enableDeduplication: true,
 *   maxErrorsPerMinute: 50
 * })
 *
 * catcher.install()
 * ```
 */

import type { Breadcrumb, BreadcrumbInput, ErrorCatcherOptions, ErrorInfo, ResolvedErrorCatcherOptions } from '../types'
import { ErrorLevel, ErrorSource } from '../types'
import { DEFAULT_CATCHER_OPTIONS, DEFAULT_IGNORE_PATTERNS } from '../constants'
import { generateErrorId } from '../utils/id'
import { getCurrentUrl, getUserAgent, isBrowser } from '../utils/env'
import { generateFingerprint, FingerprintCache } from '../utils/fingerprint'
import { RateLimiter } from '../utils/throttle'
import { normalizeError } from '../utils/error'

/**
 * 全局错误捕获器
 *
 * @remarks
 * 提供全面的客户端错误捕获能力，包括：
 * - 全局 JavaScript 运行时错误
 * - 未处理的 Promise 拒绝
 * - 资源加载错误
 * - 错误指纹去重
 * - 错误限流保护
 */
export class ErrorCatcher {
  /** 已解析的配置选项 */
  private options: ResolvedErrorCatcherOptions

  /** 面包屑列表 */
  private breadcrumbs: Breadcrumb[] = []

  /** 是否已安装 */
  private isInstalled = false

  /** 原始 onerror 处理器 */
  private originalOnError: OnErrorEventHandler | null = null

  /** 原始 onunhandledrejection 处理器 */
  private originalOnUnhandledRejection: ((event: PromiseRejectionEvent) => void) | null = null

  /** 资源错误处理器引用（用于移除监听） */
  private boundResourceErrorHandler: ((event: Event) => void) | null = null

  /** 指纹缓存（用于去重） */
  private fingerprintCache: FingerprintCache

  /** 限流器 */
  private rateLimiter: RateLimiter

  /** 用户会话 ID */
  private sessionId: string

  /** 用户 ID */
  private userId?: string

  /**
   * 创建错误捕获器实例
   *
   * @param options - 配置选项
   */
  constructor(options: ErrorCatcherOptions = {}) {
    this.options = {
      enabled: options.enabled ?? DEFAULT_CATCHER_OPTIONS.enabled,
      captureGlobalErrors: options.captureGlobalErrors ?? DEFAULT_CATCHER_OPTIONS.captureGlobalErrors,
      captureUnhandledRejections: options.captureUnhandledRejections ?? DEFAULT_CATCHER_OPTIONS.captureUnhandledRejections,
      captureResourceErrors: options.captureResourceErrors ?? DEFAULT_CATCHER_OPTIONS.captureResourceErrors,
      captureNetworkErrors: options.captureNetworkErrors ?? DEFAULT_CATCHER_OPTIONS.captureNetworkErrors,
      captureConsoleErrors: options.captureConsoleErrors ?? false,
      maxBreadcrumbs: options.maxBreadcrumbs ?? DEFAULT_CATCHER_OPTIONS.maxBreadcrumbs,
      ignorePatterns: options.ignorePatterns ?? [...DEFAULT_IGNORE_PATTERNS],
      enableDeduplication: options.enableDeduplication ?? DEFAULT_CATCHER_OPTIONS.enableDeduplication,
      deduplicationWindow: options.deduplicationWindow ?? DEFAULT_CATCHER_OPTIONS.deduplicationWindow,
      enableRateLimit: options.enableRateLimit ?? DEFAULT_CATCHER_OPTIONS.enableRateLimit,
      maxErrorsPerMinute: options.maxErrorsPerMinute ?? DEFAULT_CATCHER_OPTIONS.maxErrorsPerMinute,
      beforeCapture: options.beforeCapture ?? (e => e),
      onError: options.onError ?? (() => {}),
    }

    // 初始化指纹缓存
    this.fingerprintCache = new FingerprintCache({
      ttl: this.options.deduplicationWindow,
      maxSize: 100,
    })

    // 初始化限流器
    this.rateLimiter = new RateLimiter({
      maxCalls: this.options.maxErrorsPerMinute,
      windowMs: 60 * 1000,
    })

    // 生成会话 ID
    this.sessionId = `ses_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  }

  /**
   * 安装错误捕获
   *
   * @remarks
   * 调用后开始监听全局错误事件
   */
  install(): this {
    if (this.isInstalled || !this.options.enabled) {
      return this
    }

    if (!isBrowser()) {
      return this
    }

    // 捕获全局错误
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

    // 捕获未处理的 Promise 拒绝
    if (this.options.captureUnhandledRejections) {
      this.originalOnUnhandledRejection = window.onunhandledrejection as typeof this.originalOnUnhandledRejection
      window.onunhandledrejection = (event: PromiseRejectionEvent) => {
        this.handlePromiseRejection(event)
        if (this.originalOnUnhandledRejection) {
          this.originalOnUnhandledRejection(event)
        }
      }
    }

    // 捕获资源加载错误
    if (this.options.captureResourceErrors) {
      this.boundResourceErrorHandler = this.handleResourceError.bind(this)
      window.addEventListener('error', this.boundResourceErrorHandler, true)
    }

    this.isInstalled = true
    return this
  }

  /**
   * 卸载错误捕获
   *
   * @remarks
   * 恢复原始的错误处理器，停止监听
   */
  uninstall(): this {
    if (!this.isInstalled) {
      return this
    }

    if (!isBrowser()) {
      return this
    }

    // 恢复全局错误处理器
    if (this.options.captureGlobalErrors && this.originalOnError !== null) {
      window.onerror = this.originalOnError
      this.originalOnError = null
    }

    // 恢复 Promise 拒绝处理器
    if (this.options.captureUnhandledRejections && this.originalOnUnhandledRejection !== null) {
      window.onunhandledrejection = this.originalOnUnhandledRejection as typeof window.onunhandledrejection
      this.originalOnUnhandledRejection = null
    }

    // 移除资源错误监听
    if (this.options.captureResourceErrors && this.boundResourceErrorHandler) {
      window.removeEventListener('error', this.boundResourceErrorHandler, true)
      this.boundResourceErrorHandler = null
    }

    this.isInstalled = false
    return this
  }

  /**
   * 处理全局错误
   */
  private handleGlobalError(
    message: string | Event,
    source?: string,
    lineno?: number,
    colno?: number,
    error?: Error,
  ): void {
    const normalizedError = error ?? normalizeError(message)
    const errorInfo = this.createErrorInfo(
      normalizedError,
      ErrorSource.RUNTIME,
      {
        source,
        lineno,
        colno,
      },
    )
    this.processError(errorInfo)
  }

  /**
   * 处理 Promise 拒绝
   */
  private handlePromiseRejection(event: PromiseRejectionEvent): void {
    const error = normalizeError(event.reason)
    const errorInfo = this.createErrorInfo(error, ErrorSource.PROMISE)
    this.processError(errorInfo)
  }

  /**
   * 处理资源加载错误
   */
  private handleResourceError(event: Event): void {
    const target = event.target as HTMLElement

    // 忽略非资源元素的错误
    if (!target || target === (window as unknown as HTMLElement)) {
      return
    }

    // 只处理资源元素
    const isResourceElement = target instanceof HTMLScriptElement
      || target instanceof HTMLLinkElement
      || target instanceof HTMLImageElement
      || target instanceof HTMLVideoElement
      || target instanceof HTMLAudioElement

    if (!isResourceElement) {
      return
    }

    const resourceUrl = (target as HTMLScriptElement | HTMLImageElement).src
      || (target as HTMLLinkElement).href
      || 'unknown'

    const errorInfo = this.createErrorInfo(
      new Error(`Resource failed to load: ${resourceUrl}`),
      ErrorSource.RESOURCE,
      {
        tagName: target.tagName.toLowerCase(),
        resourceUrl,
      },
    )
    this.processError(errorInfo)
  }

  /**
   * 创建错误信息对象
   */
  private createErrorInfo(
    error: Error,
    source: ErrorSource,
    extra?: Record<string, unknown>,
  ): ErrorInfo {
    const errorInfo: ErrorInfo = {
      id: generateErrorId(),
      name: error.name || 'Error',
      message: error.message || 'Unknown error',
      stack: error.stack,
      level: ErrorLevel.ERROR,
      source,
      timestamp: Date.now(),
      url: getCurrentUrl(),
      userAgent: getUserAgent(),
      sessionId: this.sessionId,
      userId: this.userId,
      extra,
      breadcrumbs: [...this.breadcrumbs],
    }

    // 生成指纹
    errorInfo.fingerprint = generateFingerprint(errorInfo)

    return errorInfo
  }

  /**
   * 处理错误（包含去重、限流、过滤逻辑）
   */
  private processError(errorInfo: ErrorInfo): void {
    // 检查是否应该忽略
    if (this.shouldIgnore(errorInfo)) {
      return
    }

    // 检查去重
    if (this.options.enableDeduplication && errorInfo.fingerprint) {
      if (this.fingerprintCache.checkAndAdd(errorInfo.fingerprint)) {
        // 重复错误，忽略
        return
      }
    }

    // 检查限流
    if (this.options.enableRateLimit && !this.rateLimiter.tryAcquire()) {
      // 超过限流，忽略
      return
    }

    // 调用前置处理器
    const processed = this.options.beforeCapture(errorInfo)
    if (!processed) {
      return
    }

    // 触发错误回调
    this.options.onError(processed)
  }

  /**
   * 检查是否应该忽略错误
   */
  private shouldIgnore(errorInfo: ErrorInfo): boolean {
    const { message, stack } = errorInfo
    const textToCheck = `${message} ${stack || ''}`

    for (const pattern of this.options.ignorePatterns) {
      if (typeof pattern === 'string') {
        if (textToCheck.includes(pattern)) {
          return true
        }
      }
      else if (pattern.test(textToCheck)) {
        return true
      }
    }

    return false
  }

  // =========================================================================
  // 公共 API
  // =========================================================================

  /**
   * 设置用户 ID
   *
   * @param userId - 用户 ID
   */
  setUser(userId: string): this {
    this.userId = userId
    return this
  }

  /**
   * 清除用户 ID
   */
  clearUser(): this {
    this.userId = undefined
    return this
  }

  /**
   * 添加面包屑
   *
   * @param breadcrumb - 面包屑数据（不含时间戳）
   */
  addBreadcrumb(breadcrumb: BreadcrumbInput): this {
    const crumb: Breadcrumb = {
      ...breadcrumb,
      timestamp: Date.now(),
    }

    this.breadcrumbs.push(crumb)

    // 保持面包屑数量在限制内
    while (this.breadcrumbs.length > this.options.maxBreadcrumbs) {
      this.breadcrumbs.shift()
    }

    return this
  }

  /**
   * 清空面包屑
   */
  clearBreadcrumbs(): this {
    this.breadcrumbs = []
    return this
  }

  /**
   * 获取当前面包屑列表
   *
   * @returns 面包屑数组副本
   */
  getBreadcrumbs(): Breadcrumb[] {
    return [...this.breadcrumbs]
  }

  /**
   * 手动捕获错误
   *
   * @param error - 错误对象
   * @param extra - 额外数据
   */
  captureError(error: Error | unknown, extra?: Record<string, unknown>): this {
    const normalizedError = normalizeError(error)
    const errorInfo = this.createErrorInfo(normalizedError, ErrorSource.MANUAL, extra)
    this.processError(errorInfo)
    return this
  }

  /**
   * 手动捕获消息
   *
   * @param message - 消息内容
   * @param level - 错误级别
   * @param extra - 额外数据
   */
  captureMessage(
    message: string,
    level: ErrorLevel = ErrorLevel.INFO,
    extra?: Record<string, unknown>,
  ): this {
    const errorInfo: ErrorInfo = {
      id: generateErrorId(),
      name: 'Message',
      message,
      level,
      source: ErrorSource.MANUAL,
      timestamp: Date.now(),
      url: getCurrentUrl(),
      userAgent: getUserAgent(),
      sessionId: this.sessionId,
      userId: this.userId,
      extra,
      breadcrumbs: [...this.breadcrumbs],
    }

    errorInfo.fingerprint = generateFingerprint(errorInfo)
    this.processError(errorInfo)
    return this
  }

  /**
   * 获取会话 ID
   */
  getSessionId(): string {
    return this.sessionId
  }

  /**
   * 检查是否已安装
   */
  isActive(): boolean {
    return this.isInstalled
  }

  /**
   * 重置限流器
   */
  resetRateLimiter(): this {
    this.rateLimiter.reset()
    return this
  }

  /**
   * 清空指纹缓存
   */
  clearFingerprintCache(): this {
    this.fingerprintCache.clear()
    return this
  }
}
