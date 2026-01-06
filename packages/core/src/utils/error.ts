/**
 * 错误处理工具
 * @module utils/error
 */

/**
 * 规范化错误对象
 *
 * 将任意类型的错误值转换为标准 Error 对象
 *
 * @param error - 任意错误值
 * @returns 标准化的 Error 对象
 * @example
 * ```ts
 * normalizeError('string error')
 * // => Error { message: 'string error' }
 *
 * normalizeError({ code: 500, msg: 'Server Error' })
 * // => Error { message: '{"code":500,"msg":"Server Error"}' }
 * ```
 */
export function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error
  }

  if (typeof error === 'string') {
    return new Error(error)
  }

  if (typeof error === 'object' && error !== null) {
    // 尝试获取 message 属性
    const errorObj = error as Record<string, unknown>
    if (typeof errorObj.message === 'string') {
      const err = new Error(errorObj.message)
      if (typeof errorObj.name === 'string') {
        err.name = errorObj.name
      }
      if (typeof errorObj.stack === 'string') {
        err.stack = errorObj.stack
      }
      return err
    }

    // 序列化对象作为消息
    try {
      return new Error(JSON.stringify(error))
    }
    catch {
      return new Error(String(error))
    }
  }

  return new Error(String(error))
}

/**
 * 获取错误消息
 *
 * @param error - 任意错误值
 * @returns 错误消息字符串
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, unknown>
    if (typeof errorObj.message === 'string') {
      return errorObj.message
    }
  }

  return String(error)
}

/**
 * 获取错误堆栈
 *
 * @param error - Error 对象
 * @param maxLines - 最大行数，默认 20
 * @returns 处理后的堆栈字符串
 */
export function getErrorStack(error: Error, maxLines = 20): string | undefined {
  if (!error.stack) {
    return undefined
  }

  const lines = error.stack.split('\n')
  if (lines.length <= maxLines) {
    return error.stack
  }

  return lines.slice(0, maxLines).join('\n') + `\n... (${lines.length - maxLines} more lines)`
}

/**
 * 解析堆栈信息
 *
 * @param stack - 堆栈字符串
 * @returns 解析后的堆栈帧数组
 */
export interface StackFrame {
  /** 函数名 */
  functionName?: string
  /** 文件名 */
  fileName?: string
  /** 行号 */
  lineNumber?: number
  /** 列号 */
  columnNumber?: number
  /** 原始行 */
  raw: string
}

/**
 * 解析错误堆栈
 *
 * @param stack - 堆栈字符串
 * @returns 解析后的堆栈帧数组
 */
export function parseStack(stack?: string): StackFrame[] {
  if (!stack) {
    return []
  }

  const lines = stack.split('\n').slice(1) // 跳过第一行（错误消息）
  const frames: StackFrame[] = []

  // Chrome/Node.js 格式: "    at functionName (fileName:line:column)"
  const chromeRegex = /^\s*at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?$/
  // Firefox 格式: "functionName@fileName:line:column"
  const firefoxRegex = /^(.+?)@(.+?):(\d+):(\d+)$/

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    let match = chromeRegex.exec(trimmed) || firefoxRegex.exec(trimmed)

    if (match) {
      frames.push({
        functionName: match[1] || '<anonymous>',
        fileName: match[2],
        lineNumber: Number.parseInt(match[3], 10),
        columnNumber: Number.parseInt(match[4], 10),
        raw: line,
      })
    }
    else {
      frames.push({ raw: line })
    }
  }

  return frames
}

/**
 * 检查是否为网络错误
 *
 * @param error - 错误对象
 * @returns 是否为网络错误
 */
export function isNetworkError(error: Error): boolean {
  const networkErrorMessages = [
    'Failed to fetch',
    'NetworkError',
    'Network request failed',
    'net::ERR_',
    'ENOTFOUND',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ECONNRESET',
  ]

  return networkErrorMessages.some((msg) => {
    return error.message.includes(msg) || error.name.includes(msg)
  })
}

/**
 * 检查是否为脚本错误（跨域）
 *
 * @param error - 错误对象
 * @returns 是否为脚本错误
 */
export function isScriptError(error: Error): boolean {
  return error.message === 'Script error.' || error.message === 'Script error'
}

/**
 * 安全地获取对象属性
 *
 * @param obj - 对象
 * @param path - 属性路径
 * @param defaultValue - 默认值
 * @returns 属性值或默认值
 */
export function safeGet<T>(
  obj: Record<string, unknown>,
  path: string,
  defaultValue?: T,
): T | undefined {
  const keys = path.split('.')
  let result: unknown = obj

  for (const key of keys) {
    if (result == null || typeof result !== 'object') {
      return defaultValue
    }
    result = (result as Record<string, unknown>)[key]
  }

  return (result as T) ?? defaultValue
}
