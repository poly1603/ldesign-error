/**
 * 错误上报器
 * @description 将错误信息上报到服务器，支持离线缓存和重试
 */

import type { ErrorInfo, ErrorReporterOptions } from '../types'

const DB_NAME = 'ldesign_error_cache'
const STORE_NAME = 'errors'
const DB_VERSION = 1

/**
 * 错误上报器
 */
export class ErrorReporter {
  private options: Required<ErrorReporterOptions>
  private queue: ErrorInfo[] = []
  private isProcessing = false
  private batchTimer: ReturnType<typeof setTimeout> | null = null
  private db: IDBDatabase | null = null

  constructor(options: ErrorReporterOptions = {}) {
    this.options = {
      enabled: options.enabled ?? true,
      endpoint: options.endpoint ?? '/api/errors',
      batchSize: options.batchSize ?? 10,
      batchInterval: options.batchInterval ?? 5000,
      maxRetries: options.maxRetries ?? 3,
      retryDelay: options.retryDelay ?? 1000,
      sampleRate: options.sampleRate ?? 1,
      enableOfflineCache: options.enableOfflineCache ?? true,
      maxOfflineCacheSize: options.maxOfflineCacheSize ?? 100,
      headers: options.headers ?? {},
      timeout: options.timeout ?? 10000,
      beforeSend: options.beforeSend ?? (e => e),
      onSuccess: options.onSuccess ?? (() => { }),
      onError: options.onError ?? (() => { }),
    }
    if (this.options.enableOfflineCache) {
      this.initDB()
    }
  }

  private async initDB(): Promise<void> {
    if (typeof indexedDB === 'undefined')
      return
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        this.loadCachedErrors()
        resolve()
      }
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        }
      }
    })
  }

  private async loadCachedErrors(): Promise<void> {
    if (!this.db)
      return
    const transaction = this.db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
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

  private async saveToCache(errors: ErrorInfo[]): Promise<void> {
    if (!this.db || !this.options.enableOfflineCache)
      return
    const transaction = this.db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    for (const error of errors) {
      store.put(error)
    }
  }

  private async clearCache(): Promise<void> {
    if (!this.db)
      return
    const transaction = this.db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    store.clear()
  }

  /** 上报错误 */
  report(error: ErrorInfo): void {
    if (!this.options.enabled)
      return
    if (Math.random() > this.options.sampleRate)
      return
    this.queue.push(error)
    if (this.queue.length >= this.options.batchSize) {
      this.flush()
    }
    else {
      this.startBatchTimer()
    }
  }

  private startBatchTimer(): void {
    if (this.batchTimer)
      return
    this.batchTimer = setTimeout(() => {
      this.batchTimer = null
      this.flush()
    }, this.options.batchInterval)
  }

  /** 立即发送队列中的错误 */
  async flush(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0)
      return
    this.isProcessing = true
    const errors = this.queue.splice(0, this.options.batchSize)
    const processed = this.options.beforeSend(errors)
    if (!processed || processed.length === 0) {
      this.isProcessing = false
      return
    }
    try {
      await this.sendWithRetry(processed)
      this.options.onSuccess(processed)
    }
    catch (err) {
      await this.saveToCache(processed)
      this.options.onError(err as Error, processed)
    }
    finally {
      this.isProcessing = false
      if (this.queue.length > 0) {
        this.startBatchTimer()
      }
    }
  }

  private async sendWithRetry(errors: ErrorInfo[], attempt = 0): Promise<void> {
    try {
      await this.send(errors)
    }
    catch (err) {
      if (attempt < this.options.maxRetries) {
        const delay = this.options.retryDelay * 2 ** attempt
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.sendWithRetry(errors, attempt + 1)
      }
      throw err
    }
  }

  private async send(errors: ErrorInfo[]): Promise<void> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.options.timeout)
    try {
      const response = await fetch(this.options.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.options.headers },
        body: JSON.stringify({ errors, timestamp: Date.now() }),
        signal: controller.signal,
      })
      if (!response.ok) {
        throw new Error(`上报失败: ${response.status} ${response.statusText}`)
      }
    }
    finally {
      clearTimeout(timeoutId)
    }
  }

  /** 销毁上报器 */
  async destroy(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = null
    }
    if (this.queue.length > 0) {
      await this.saveToCache(this.queue)
    }
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }

  /** 获取队列长度 */
  getQueueLength(): number {
    return this.queue.length
  }
}