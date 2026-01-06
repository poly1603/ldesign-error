/**
 * 异步错误处理 Composable
 *
 * @description 封装异步操作的错误处理，支持重试、加载状态管理
 *
 * @example
 * ```ts
 * const { execute, isLoading, error, data, retry } = useAsyncError(
 *   () => fetchUserData(userId),
 *   {
 *     immediate: true,
 *     retryCount: 3,
 *     onError: (err) => console.error(err)
 *   }
 * )
 * ```
 */

import { ref, shallowRef, computed, onMounted, type Ref, type ComputedRef } from 'vue'
import type { ErrorInfo } from '@ldesign/error-core'
import { ErrorLevel, ErrorSource } from '@ldesign/error-core'

/** 生成错误 ID */
function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

/** 获取当前 URL */
function getCurrentUrl(): string | undefined {
  return typeof window !== 'undefined' ? window.location.href : undefined
}

/** 获取用户代理 */
function getUserAgent(): string | undefined {
  return typeof navigator !== 'undefined' ? navigator.userAgent : undefined
}

/** 规范化错误 */
function normalizeError(error: unknown): Error {
  if (error instanceof Error) return error
  if (typeof error === 'string') return new Error(error)
  return new Error(String(error))
}

/**
 * 异步错误处理选项
 */
export interface UseAsyncErrorOptions<T> {
  /** 是否立即执行 */
  immediate?: boolean
  /** 初始值 */
  initialValue?: T
  /** 最大重试次数 */
  retryCount?: number
  /** 重试延迟（毫秒） */
  retryDelay?: number
  /** 重试延迟增量（指数退避） */
  retryDelayMultiplier?: number
  /** 错误回调 */
  onError?: (error: ErrorInfo) => void
  /** 成功回调 */
  onSuccess?: (data: T) => void
  /** 是否在组件卸载时取消 */
  cancelOnUnmount?: boolean
  /** 超时时间（毫秒） */
  timeout?: number
}

/**
 * 异步错误处理返回值
 */
export interface UseAsyncErrorReturn<T> {
  /** 执行异步操作 */
  execute: (...args: unknown[]) => Promise<T | undefined>
  /** 是否正在加载 */
  isLoading: Ref<boolean>
  /** 是否已完成 */
  isFinished: Ref<boolean>
  /** 是否成功 */
  isSuccess: Ref<boolean>
  /** 错误信息 */
  error: Ref<ErrorInfo | null>
  /** 返回数据 */
  data: Ref<T | undefined>
  /** 重试 */
  retry: () => Promise<T | undefined>
  /** 重置状态 */
  reset: () => void
  /** 当前重试次数 */
  retryAttempt: Ref<number>
  /** 是否可以重试 */
  canRetry: ComputedRef<boolean>
}

/**
 * 异步错误处理 Composable
 *
 * @param fn - 异步函数
 * @param options - 配置选项
 * @returns 异步状态和控制方法
 */
export function useAsyncError<T>(
  fn: (...args: unknown[]) => Promise<T>,
  options: UseAsyncErrorOptions<T> = {},
): UseAsyncErrorReturn<T> {
  const {
    immediate = false,
    initialValue,
    retryCount = 0,
    retryDelay = 1000,
    retryDelayMultiplier = 2,
    onError,
    onSuccess,
    timeout,
  } = options

  // 状态
  const isLoading = ref(false)
  const isFinished = ref(false)
  const isSuccess = ref(false)
  const error = ref<ErrorInfo | null>(null)
  const data = shallowRef<T | undefined>(initialValue)
  const retryAttempt = ref(0)

  // 存储最后一次调用的参数
  let lastArgs: unknown[] = []

  // 是否可以重试
  const canRetry = computed(() => retryAttempt.value < retryCount)

  /**
   * 创建错误信息
   */
  function createErrorInfo(err: Error): ErrorInfo {
    return {
      id: generateErrorId(),
      name: err.name || 'AsyncError',
      message: err.message || 'Async operation failed',
      stack: err.stack,
      level: ErrorLevel.ERROR,
      source: ErrorSource.MANUAL,
      timestamp: Date.now(),
      url: getCurrentUrl(),
      userAgent: getUserAgent(),
      extra: {
        retryAttempt: retryAttempt.value,
        maxRetries: retryCount,
      },
    }
  }

  /**
   * 带超时的 Promise
   */
  function withTimeout<R>(promise: Promise<R>, ms?: number): Promise<R> {
    if (!ms) return promise

    return Promise.race([
      promise,
      new Promise<R>((_, reject) => {
        setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms)
      }),
    ])
  }

  /**
   * 执行异步操作
   */
  async function execute(...args: unknown[]): Promise<T | undefined> {
    lastArgs = args
    isLoading.value = true
    isFinished.value = false
    isSuccess.value = false
    error.value = null

    try {
      const result = await withTimeout(fn(...args), timeout)
      data.value = result
      isSuccess.value = true
      retryAttempt.value = 0 // 成功后重置重试计数
      onSuccess?.(result)
      return result
    }
    catch (err) {
      const normalizedError = normalizeError(err)
      const errorInfo = createErrorInfo(normalizedError)
      error.value = errorInfo
      onError?.(errorInfo)
      return undefined
    }
    finally {
      isLoading.value = false
      isFinished.value = true
    }
  }

  /**
   * 重试
   */
  async function retry(): Promise<T | undefined> {
    if (!canRetry.value) {
      return undefined
    }

    retryAttempt.value++

    // 计算延迟时间（指数退避）
    const delay = retryDelay * Math.pow(retryDelayMultiplier, retryAttempt.value - 1)

    // 等待延迟
    await new Promise(resolve => setTimeout(resolve, delay))

    return execute(...lastArgs)
  }

  /**
   * 重置状态
   */
  function reset(): void {
    isLoading.value = false
    isFinished.value = false
    isSuccess.value = false
    error.value = null
    data.value = initialValue
    retryAttempt.value = 0
    lastArgs = []
  }

  // 立即执行
  if (immediate) {
    onMounted(() => {
      execute()
    })
  }

  return {
    execute,
    isLoading,
    isFinished,
    isSuccess,
    error,
    data,
    retry,
    reset,
    retryAttempt,
    canRetry,
  }
}

/**
 * 简化版 - 带自动重试的异步操作
 *
 * @example
 * ```ts
 * const result = await useAsyncWithRetry(
 *   () => fetch('/api/data'),
 *   { retryCount: 3 }
 * )
 * ```
 */
export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  options: {
    retryCount?: number
    retryDelay?: number
    retryDelayMultiplier?: number
    onRetry?: (attempt: number) => void
  } = {},
): Promise<T> {
  const {
    retryCount = 3,
    retryDelay = 1000,
    retryDelayMultiplier = 2,
    onRetry,
  } = options

  let lastError: Error | undefined
  let attempt = 0

  while (attempt <= retryCount) {
    try {
      return await fn()
    }
    catch (err) {
      lastError = normalizeError(err)
      attempt++

      if (attempt <= retryCount) {
        onRetry?.(attempt)
        const delay = retryDelay * Math.pow(retryDelayMultiplier, attempt - 1)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}

export default useAsyncError
