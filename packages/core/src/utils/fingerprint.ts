/**
 * 错误指纹工具
 *
 * 用于生成错误的唯一标识，支持错误去重
 *
 * @module utils/fingerprint
 */

import type { ErrorInfo } from '../types'

/**
 * 简单哈希函数
 *
 * @param str - 输入字符串
 * @returns 哈希值
 */
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}

/**
 * 从堆栈中提取关键帧
 *
 * @param stack - 堆栈字符串
 * @param maxFrames - 最大帧数
 * @returns 关键帧字符串
 */
function extractKeyFrames(stack: string | undefined, maxFrames = 3): string {
  if (!stack) return ''

  const lines = stack.split('\n')
    .slice(1) // 跳过第一行（错误消息）
    .filter(line => line.trim())
    .slice(0, maxFrames)

  // 移除行号列号，只保留文件名和函数名
  return lines.map((line) => {
    // 移除具体的行号列号
    return line.replace(/:\d+:\d+/g, '').trim()
  }).join('|')
}

/**
 * 生成错误指纹
 *
 * 基于错误的关键信息生成唯一标识，用于错误去重
 *
 * @param error - 错误信息对象
 * @returns 错误指纹字符串
 * @example
 * ```ts
 * const fingerprint = generateFingerprint(errorInfo)
 * // => "abc123def"
 * ```
 */
export function generateFingerprint(error: ErrorInfo): string {
  const parts: string[] = [
    error.name,
    error.message,
    error.source,
    extractKeyFrames(error.stack),
  ]

  // 如果有组件信息，也加入指纹
  if (error.componentInfo?.name) {
    parts.push(error.componentInfo.name)
  }

  const combined = parts.filter(Boolean).join('::')
  return simpleHash(combined)
}

/**
 * 指纹缓存配置
 */
export interface FingerprintCacheOptions {
  /** 缓存过期时间（毫秒），默认 5 分钟 */
  ttl?: number
  /** 最大缓存数量，默认 100 */
  maxSize?: number
}

/**
 * 指纹缓存
 *
 * 用于跟踪已处理的错误，支持错误去重
 */
export class FingerprintCache {
  private cache = new Map<string, number>()
  private ttl: number
  private maxSize: number

  /**
   * @param options - 缓存配置
   */
  constructor(options: FingerprintCacheOptions = {}) {
    this.ttl = options.ttl ?? 5 * 60 * 1000 // 默认 5 分钟
    this.maxSize = options.maxSize ?? 100
  }

  /**
   * 检查指纹是否存在（且未过期）
   *
   * @param fingerprint - 错误指纹
   * @returns 是否存在
   */
  has(fingerprint: string): boolean {
    const timestamp = this.cache.get(fingerprint)
    if (timestamp === undefined) {
      return false
    }

    // 检查是否过期
    if (Date.now() - timestamp > this.ttl) {
      this.cache.delete(fingerprint)
      return false
    }

    return true
  }

  /**
   * 添加指纹到缓存
   *
   * @param fingerprint - 错误指纹
   */
  add(fingerprint: string): void {
    // 如果缓存已满，清理最旧的条目
    if (this.cache.size >= this.maxSize) {
      this.cleanup()
    }

    this.cache.set(fingerprint, Date.now())
  }

  /**
   * 检查并添加指纹
   *
   * 如果指纹不存在，则添加并返回 false
   * 如果指纹已存在，则返回 true（表示重复）
   *
   * @param fingerprint - 错误指纹
   * @returns 是否为重复指纹
   */
  checkAndAdd(fingerprint: string): boolean {
    if (this.has(fingerprint)) {
      return true
    }
    this.add(fingerprint)
    return false
  }

  /**
   * 清理过期条目
   */
  cleanup(): void {
    const now = Date.now()
    const expired: string[] = []

    this.cache.forEach((timestamp, key) => {
      if (now - timestamp > this.ttl) {
        expired.push(key)
      }
    })

    expired.forEach(key => this.cache.delete(key))

    // 如果仍然超过限制，删除最旧的条目
    if (this.cache.size >= this.maxSize) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1] - b[1])

      const toRemove = entries.slice(0, Math.ceil(this.maxSize / 2))
      toRemove.forEach(([key]) => this.cache.delete(key))
    }
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * 获取缓存大小
   */
  get size(): number {
    return this.cache.size
  }
}

/**
 * 默认指纹缓存实例
 */
export const defaultFingerprintCache = new FingerprintCache()
