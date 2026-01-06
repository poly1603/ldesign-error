/**
 * 错误上报器
 *
 * @description 将错误信息上报到服务器
 * 支持批量发送、离线缓存、自动重试、Beacon API
 *
 * @example
 * ```ts
 * const reporter = new ErrorReporter({
 *   endpoint: '/api/errors',
 *   batchSize: 5,
 *   useBeacon: true,
 *   sendOnUnload: true
 * })
 *
 * reporter.report(errorInfo)
 * ```
 */

import type { ErrorInfo, ErrorReporterOptions, ResolvedErrorReporterOptions } from '../types'
import { DEFAULT_REPORTER_OPTIONS, INDEXED_DB_CONFIG } from '../constants'
import { isBrowser, supportsBeacon, supportsIndexedDB, supportsFetch } from '../utils/env'

/**
 * 错误上报器
 *
 * @remarks
 * 提供可靠的错误上报能力，包括：
 * - 批量发送，减少网络请求
 * - 离线缓存，网络恢复后自动重发
 * - 自动重试，指数退避
 * - Beacon API，页面卸载时可靠发送
 * - 采样率控制
 */
export class ErrorReporter {
  /** 已解析的配置选项 */
  private options: ResolvedErrorReporterOptions

  /** 错误队列 */
  private queue: ErrorInfo[] = []

  /** 是否正在处理队列 */
  private isProcessing = false

  /** 批量发送定时器 */
  private batchTimer: ReturnType<typeof setTimeout> | null = null

  /** IndexedDB 数据库实例 */
  private db: IDBDatabase | null = null

  /** 是否已初始化 */
  private initialized = false

  /** 初始化 Promise */
  private initPromise: Promise<void> | null = null

  /** 页面卸载处理器引用 */
  private boundUnloadHandler: (() => void) | null = null

  /**
   * 创建错误上报器实例
   *
   * @param options - 配置选项
   */
  constructor(options: ErrorReporterOptions = {}) {
    this.options = {
      enabled: options.enabled ?? DEFAULT_REPORTER_OPTIONS.enabled,
      endpoint: options.endpoint ?? DEFAULT_REPORTER_OPTIONS.endpoint,
      batchSize: options.batchSize ?? DEFAULT_REPORTER_OPTIONS.batchSize,
      batchInterval: options.batchInterval ?? DEFAULT_REPORTER_OPTIONS.batchInterval,
      maxRetries: options.maxRetries ?? DEFAULT_REPORTER_OPTIONS.maxRetries,
      retryDelay: options.retryDelay ?? DEFAULT_REPORTER_OPTIONS.retryDelay,
      sampleRate: options.sampleRate ?? DEFAULT_REPORTER_OPTIONS.sampleRate,
      enableOfflineCache: options.enableOfflineCache ?? DEFAULT_REPORTER_OPTIONS.enableOfflineCache,
      maxOfflineCacheSize: options.maxOfflineCacheSize ?? DEFAULT_REPORTER_OPTIONS.maxOfflineCacheSize,
      headers: options.headers ?? {},
      timeout: options.timeout ?? DEFAULT_REPORTER_OPTIONS.timeout,
      useBeacon: options.useBeacon ?? DEFAULT_REPORTER_OPTIONS.useBeacon,
      sendOnUnload: options.sendOnUnload ?? DEFAULT_REPORTER_OPTIONS.sendOnUnload,
      beforeSend: options.beforeSend ?? (e => e),
      onSuccess: options.onSuccess ?? (() => {}),
      onError: options.onError ?? (() => {}),
    }

    // 异步初始化
    this.initPromise = this.init()
  }

  /**
   * 初始化上报器
   */
  private async init(): Promise<void> {
    if (this.initialized) {
      return
    }

    // 初始化 IndexedDB
    if (this.options.enableOfflineCache && supportsIndexedDB()) {
      await this.initDB()
    }

    // 注册页面卸载事件
    if (this.options.sendOnUnload && isBrowser()) {
      this.boundUnloadHandler = this.handleUnload.bind(this)
      window.addEventListener('visibilitychange', this.boundUnloadHandler)
      window.addEventListener('pagehide', this.boundUnloadHandler)
    }

    this.initialized = true
  }

  /**
   * 初始化 IndexedDB
   */
  private async initDB(): Promise<void> {
    if (!supportsIndexedDB()) {
      return
    }

    return new Promise((resolve) => {
      try {
        const request = indexedDB.open(
          INDEXED_DB_CONFIG.dbName,
          INDEXED_DB_CONFIG.version,
        )

        request.onerror = () => {
          // 忽略 IndexedDB 错误，回退到内存队列
          resolve()
        }

        request.onsuccess = () => {
          this.db = request.result
          this.loadCachedErrors()
          resolve()
        }

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result
          if (!db.objectStoreNames.contains(INDEXED_DB_CONFIG.storeName)) {
            db.createObjectStore(INDEXED_DB_CONFIG.storeName, { keyPath: 'id' })
          }
        }
      }
      catch {
        resolve()
      }
    })
  }

  /**
   * 加载缓存的错误
   */
  private loadCachedErrors(): void {
    if (!this.db) {
      return
    }

    try {
      const transaction = this.db.transaction(INDEXED_DB_CONFIG.storeName, 'readonly')
      const store = transaction.objectStore(INDEXED_DB_CONFIG.storeName)
      const request = store.getAll()

      request.onsuccess = () => {
        const cachedErrors = request.result as ErrorInfo[]
        if (cachedErrors.length > 0) {
          this.queue.push(...cachedErrors)
          this.clearCache()
          this.startBatchTimer()
        }
      }
    }
    catch {
      // 忽略读取错误
    }
  }

  /**
   * 保存错误到缓存
   */
  private saveToCache(errors: ErrorInfo[]): void {
    if (!this.db || !this.options.enableOfflineCache) {
      return
    }

    try {
      const transaction = this.db.transaction(INDEXED_DB_CONFIG.storeName, 'readwrite')
      const store = transaction.objectStore(INDEXED_DB_CONFIG.storeName)

      // 检查缓存大小限制
      const countRequest = store.count()
      countRequest.onsuccess = () => {
        const currentCount = countRequest.result
        const availableSlots = this.options.maxOfflineCacheSize - currentCount

        // 只保存在限制内的错误
        const errorsToSave = errors.slice(0, Math.max(0, availableSlots))
        for (const error of errorsToSave) {
          store.put(error)
        }
      }
    }
    catch {
      // 忽略写入错误
    }
  }

  /**
   * 清空缓存
   */
  private clearCache(): void {
    if (!this.db) {
      return
    }

    try {
      const transaction = this.db.transaction(INDEXED_DB_CONFIG.storeName, 'readwrite')
      const store = transaction.objectStore(INDEXED_DB_CONFIG.storeName)
      store.clear()
    }
    catch {
      // 忽略清空错误
    }
  }

  /**
   * 从缓存中移除指定错误
   */
  private removeFromCache(errorIds: string[]): void {
    if (!this.db) {
      return
    }

    try {
      const transaction = this.db.transaction(INDEXED_DB_CONFIG.storeName, 'readwrite')
      const store = transaction.objectStore(INDEXED_DB_CONFIG.storeName)
      for (const id of errorIds) {
        store.delete(id)
      }
    }
    catch {
      // 忽略删除错误
    }
  }

  /**
   * 启动批量发送定时器
   */
  private startBatchTimer(): void {
    if (this.batchTimer) {
      return
    }

    this.batchTimer = setTimeout(() => {
      this.batchTimer = null
      this.flush()
    }, this.options.batchInterval)
  }

  /**
   * 清除批量发送定时器
   */
  private clearBatchTimer(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = null
    }
  }

  /**
   * 处理页面卸载事件
   */
  private handleUnload(): void {
    if (document.visibilityState === 'hidden' || !isBrowser()) {
      this.sendOnUnload()
    }
  }

  /**
   * 页面卸载时发送队列中的错误
   */
  private sendOnUnload(): void {
    if (this.queue.length === 0) {
      return
    }

    const errors = this.options.beforeSend([...this.queue])
    if (!errors || errors.length === 0) {
      return
    }

    // 优先使用 Beacon API
    if (this.options.useBeacon && supportsBeacon()) {
      const payload = JSON.stringify({
        errors,
        timestamp: Date.now(),
      })

      const sent = navigator.sendBeacon(
        this.options.endpoint,
        new Blob([payload], { type: 'application/json' }),
      )

      if (sent) {
        this.queue = []
        return
      }
    }

    // 回退到同步 XHR
    try {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', this.options.endpoint, false) // 同步请求
      xhr.setRequestHeader('Content-Type', 'application/json')

      for (const [key, value] of Object.entries(this.options.headers)) {
        xhr.setRequestHeader(key, value)
      }

      xhr.send(JSON.stringify({
        errors,
        timestamp: Date.now(),
      }))

      if (xhr.status >= 200 && xhr.status < 300) {
        this.queue = []
      }
    }
    catch {
      // 页面卸载时发送失败，尝试保存到缓存
      this.saveToCache(errors)
    }
  }

  /**
   * 带重试的发送
   */
  private async sendWithRetry(errors: ErrorInfo[], attempt = 0): Promise<void> {
    try {
      await this.send(errors)
    }
    catch (err) {
      if (attempt < this.options.maxRetries) {
        // 指数退避
        const delay = this.options.retryDelay * (2 ** attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.sendWithRetry(errors, attempt + 1)
      }
      throw err
    }
  }

  /**
   * 发送错误到服务器
   */
  private async send(errors: ErrorInfo[]): Promise<void> {
    if (!supportsFetch()) {
      throw new Error('Fetch API not supported')
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.options.timeout)

    try {
      const response = await fetch(this.options.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.options.headers,
        },
        body: JSON.stringify({
          errors,
          timestamp: Date.now(),
        }),
        signal: controller.signal,
        // 保持连接（如果浏览器支持）
        keepalive: true,
      })

      if (!response.ok) {
        throw new Error(`Report failed: ${response.status} ${response.statusText}`)
      }
    }
    finally {
      clearTimeout(timeoutId)
    }
  }

  // =========================================================================
  // 公共 API
  // =========================================================================

  /**
   * 上报错误
   *
   * @param error - 错误信息
   */
  report(error: ErrorInfo): this {
    if (!this.options.enabled) {
      return this
    }

    // 采样率控制
    if (Math.random() > this.options.sampleRate) {
      return this
    }

    this.queue.push(error)

    // 达到批量大小时立即发送
    if (this.queue.length >= this.options.batchSize) {
      this.flush()
    }
    else {
      this.startBatchTimer()
    }

    return this
  }

  /**
   * 批量上报错误
   *
   * @param errors - 错误信息数组
   */
  reportBatch(errors: ErrorInfo[]): this {
    for (const error of errors) {
      this.report(error)
    }
    return this
  }

  /**
   * 立即发送队列中的错误
   */
  async flush(): Promise<void> {
    // 等待初始化完成
    if (this.initPromise) {
      await this.initPromise
    }

    if (this.isProcessing || this.queue.length === 0) {
      return
    }

    this.isProcessing = true
    this.clearBatchTimer()

    // 取出一批错误
    const errors = this.queue.splice(0, this.options.batchSize)

    // 调用前置处理器
    const processed = this.options.beforeSend(errors)
    if (!processed || processed.length === 0) {
      this.isProcessing = false
      return
    }

    try {
      await this.sendWithRetry(processed)

      // 从缓存中移除已发送的错误
      this.removeFromCache(processed.map(e => e.id))

      // 调用成功回调
      this.options.onSuccess(processed)
    }
    catch (err) {
      // 保存到离线缓存
      this.saveToCache(processed)

      // 调用错误回调
      this.options.onError(err as Error, processed)
    }
    finally {
      this.isProcessing = false

      // 如果队列中还有错误，继续处理
      if (this.queue.length > 0) {
        this.startBatchTimer()
      }
    }
  }

  /**
   * 获取队列长度
   */
  getQueueLength(): number {
    return this.queue.length
  }

  /**
   * 获取队列中的错误（副本）
   */
  getQueue(): ErrorInfo[] {
    return [...this.queue]
  }

  /**
   * 清空队列
   */
  clearQueue(): this {
    this.queue = []
    this.clearBatchTimer()
    return this
  }

  /**
   * 更新配置
   *
   * @param options - 新配置选项
   */
  setOptions(options: Partial<ErrorReporterOptions>): this {
    this.options = {
      ...this.options,
      ...options,
      // 确保回调函数有默认值
      beforeSend: options.beforeSend ?? this.options.beforeSend,
      onSuccess: options.onSuccess ?? this.options.onSuccess,
      onError: options.onError ?? this.options.onError,
    } as ResolvedErrorReporterOptions

    return this
  }

  /**
   * 销毁上报器
   *
   * @remarks
   * 清理资源，保存未发送的错误到缓存
   */
  async destroy(): Promise<void> {
    // 清除定时器
    this.clearBatchTimer()

    // 移除事件监听
    if (this.boundUnloadHandler && isBrowser()) {
      window.removeEventListener('visibilitychange', this.boundUnloadHandler)
      window.removeEventListener('pagehide', this.boundUnloadHandler)
      this.boundUnloadHandler = null
    }

    // 保存队列中的错误到缓存
    if (this.queue.length > 0) {
      this.saveToCache(this.queue)
      this.queue = []
    }

    // 关闭数据库连接
    if (this.db) {
      this.db.close()
      this.db = null
    }

    this.initialized = false
    this.initPromise = null
  }

  /**
   * 检查是否已初始化
   */
  isReady(): boolean {
    return this.initialized
  }
}
