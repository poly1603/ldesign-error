/**
 * 节流与去抖工具
 * @module utils/throttle
 */

/**
 * 节流函数
 *
 * 在指定时间间隔内最多执行一次
 *
 * @param fn - 要节流的函数
 * @param wait - 等待时间（毫秒）
 * @returns 节流后的函数
 * @example
 * ```ts
 * const throttledFn = throttle(() => console.log('called'), 1000)
 * throttledFn() // 立即执行
 * throttledFn() // 被忽略
 * // 1秒后...
 * throttledFn() // 执行
 * ```
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let lastTime = 0
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return function throttled(this: unknown, ...args: Parameters<T>): void {
    const now = Date.now()
    const remaining = wait - (now - lastTime)

    if (remaining <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      lastTime = now
      fn.apply(this, args)
    }
    else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastTime = Date.now()
        timeoutId = null
        fn.apply(this, args)
      }, remaining)
    }
  }
}

/**
 * 去抖函数
 *
 * 延迟执行，每次调用重置延迟
 *
 * @param fn - 要去抖的函数
 * @param wait - 等待时间（毫秒）
 * @param immediate - 是否立即执行
 * @returns 去抖后的函数
 * @example
 * ```ts
 * const debouncedFn = debounce(() => console.log('called'), 1000)
 * debouncedFn() // 延迟1秒后执行
 * debouncedFn() // 重置延迟，再等1秒
 * ```
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  wait: number,
  immediate = false,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return function debounced(this: unknown, ...args: Parameters<T>): void {
    const callNow = immediate && !timeoutId

    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      timeoutId = null
      if (!immediate) {
        fn.apply(this, args)
      }
    }, wait)

    if (callNow) {
      fn.apply(this, args)
    }
  }
}

/**
 * 限流器配置
 */
export interface RateLimiterOptions {
  /** 时间窗口内最大调用次数 */
  maxCalls: number
  /** 时间窗口（毫秒） */
  windowMs: number
}

/**
 * 限流器
 *
 * 限制指定时间窗口内的调用次数
 */
export class RateLimiter {
  private calls: number[] = []
  private maxCalls: number
  private windowMs: number

  /**
   * @param options - 限流配置
   */
  constructor(options: RateLimiterOptions) {
    this.maxCalls = options.maxCalls
    this.windowMs = options.windowMs
  }

  /**
   * 尝试获取调用许可
   *
   * @returns 是否允许调用
   */
  tryAcquire(): boolean {
    const now = Date.now()

    // 清理过期的调用记录
    this.calls = this.calls.filter(time => now - time < this.windowMs)

    if (this.calls.length < this.maxCalls) {
      this.calls.push(now)
      return true
    }

    return false
  }

  /**
   * 获取剩余可用调用次数
   */
  get remaining(): number {
    const now = Date.now()
    this.calls = this.calls.filter(time => now - time < this.windowMs)
    return Math.max(0, this.maxCalls - this.calls.length)
  }

  /**
   * 重置限流器
   */
  reset(): void {
    this.calls = []
  }
}

/**
 * 创建错误限流器
 *
 * 默认配置：每分钟最多 100 个错误
 *
 * @param options - 限流配置
 * @returns 限流器实例
 */
export function createErrorRateLimiter(
  options: Partial<RateLimiterOptions> = {},
): RateLimiter {
  return new RateLimiter({
    maxCalls: options.maxCalls ?? 100,
    windowMs: options.windowMs ?? 60 * 1000,
  })
}
