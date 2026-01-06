/**
 * ID 生成工具
 * @module utils/id
 */

/** ID 计数器，用于确保同毫秒内的唯一性 */
let counter = 0

/**
 * 生成唯一错误 ID
 *
 * 格式: `err_{timestamp}_{random}_{counter}`
 *
 * @returns 唯一的错误 ID 字符串
 * @example
 * ```ts
 * const id = generateErrorId()
 * // => "err_1704067200000_a1b2c3d_0"
 * ```
 */
export function generateErrorId(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).slice(2, 9)
  const count = (counter++ % 1000).toString().padStart(3, '0')
  return `err_${timestamp}_${random}_${count}`
}

/**
 * 生成会话 ID
 *
 * 用于标识用户的一次会话
 *
 * @returns 唯一的会话 ID 字符串
 * @example
 * ```ts
 * const sessionId = generateSessionId()
 * // => "ses_1704067200000_x9y8z7w"
 * ```
 */
export function generateSessionId(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).slice(2, 11)
  return `ses_${timestamp}_${random}`
}

/**
 * 生成 UUID v4
 *
 * @returns UUID 字符串
 * @example
 * ```ts
 * const uuid = generateUUID()
 * // => "550e8400-e29b-41d4-a716-446655440000"
 * ```
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  // Fallback 实现
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
