/**
 * 环境检测工具
 * @module utils/env
 */

/**
 * 检查是否在服务端环境
 *
 * @returns 是否为服务端环境
 */
export function isServer(): boolean {
  return typeof window === 'undefined'
}

/**
 * 检查是否在浏览器环境
 *
 * @returns 是否为浏览器环境
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

/**
 * 检查是否支持 IndexedDB
 *
 * @returns 是否支持 IndexedDB
 */
export function supportsIndexedDB(): boolean {
  return isBrowser() && typeof indexedDB !== 'undefined'
}

/**
 * 检查是否支持 Beacon API
 *
 * @returns 是否支持 Beacon API
 */
export function supportsBeacon(): boolean {
  return isBrowser() && typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function'
}

/**
 * 检查是否支持 Fetch API
 *
 * @returns 是否支持 Fetch API
 */
export function supportsFetch(): boolean {
  return typeof fetch === 'function'
}

/**
 * 检查是否为开发环境
 *
 * @returns 是否为开发环境
 */
export function isDev(): boolean {
  // Vite
  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    return true
  }
  // Node.js
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
    return true
  }
  return false
}

/**
 * 获取当前页面 URL（安全）
 *
 * @returns 当前页面 URL 或 undefined
 */
export function getCurrentUrl(): string | undefined {
  return isBrowser() ? window.location.href : undefined
}

/**
 * 获取用户代理（安全）
 *
 * @returns 用户代理字符串或 undefined
 */
export function getUserAgent(): string | undefined {
  return isBrowser() && typeof navigator !== 'undefined'
    ? navigator.userAgent
    : undefined
}

/**
 * 获取当前时间戳
 *
 * @returns 当前时间戳（毫秒）
 */
export function now(): number {
  return Date.now()
}

/**
 * 获取高精度时间戳
 *
 * @returns 高精度时间戳
 */
export function performanceNow(): number {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now()
  }
  return Date.now()
}
