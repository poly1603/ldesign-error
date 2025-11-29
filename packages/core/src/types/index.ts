/**
 * 错误处理核心类型定义
 * @packageDocumentation
 */

/**
 * 错误级别
 */
export enum ErrorLevel {
  /** 致命错误 - 导致应用崩溃 */
  FATAL = 'fatal',
  /** 错误 - 功能无法正常工作 */
  ERROR = 'error',
  /** 警告 - 可能影响功能 */
  WARNING = 'warning',
  /** 信息 - 仅供参考 */
  INFO = 'info',
}

/**
 * 错误来源
 */
export enum ErrorSource {
  /** JavaScript 运行时错误 */
  RUNTIME = 'runtime',
  /** Promise 未处理拒绝 */
  PROMISE = 'promise',
  /** 网络请求错误 */
  NETWORK = 'network',
  /** 资源加载错误 */
  RESOURCE = 'resource',
  /** Vue 组件错误 */
  VUE = 'vue',
  /** React 组件错误 */
  REACT = 'react',
  /** 手动捕获 */
  MANUAL = 'manual',
  /** 未知来源 */
  UNKNOWN = 'unknown',
}

/**
 * 错误信息接口
 */
export interface ErrorInfo {
  /** 错误 ID */
  id: string
  /** 错误名称 */
  name: string
  /** 错误消息 */
  message: string
  /** 错误堆栈 */
  stack?: string
  /** 错误级别 */
  level: ErrorLevel
  /** 错误来源 */
  source: ErrorSource
  /** 发生时间 */
  timestamp: number
  /** 页面 URL */
  url?: string
  /** 用户代理 */
  userAgent?: string
  /** 用户 ID */
  userId?: string
  /** 会话 ID */
  sessionId?: string
  /** 额外数据 */
  extra?: Record<string, unknown>
  /** 面包屑（操作历史） */
  breadcrumbs?: Breadcrumb[]
  /** 标签 */
  tags?: string[]
  /** 组件信息（Vue/React） */
  componentInfo?: ComponentInfo
}

/**
 * 面包屑（操作历史）
 */
export interface Breadcrumb {
  /** 类型 */
  type: 'navigation' | 'click' | 'input' | 'xhr' | 'fetch' | 'console' | 'custom'
  /** 分类 */
  category: string
  /** 消息 */
  message: string
  /** 数据 */
  data?: Record<string, unknown>
  /** 时间戳 */
  timestamp: number
  /** 级别 */
  level?: ErrorLevel
}

/**
 * 组件信息
 */
export interface ComponentInfo {
  /** 组件名称 */
  name?: string
  /** 组件文件路径 */
  file?: string
  /** 组件属性 */
  props?: Record<string, unknown>
  /** 组件树路径 */
  tree?: string[]
}

/**
 * 错误捕获器配置
 */
export interface ErrorCatcherOptions {
  /** 是否启用 */
  enabled?: boolean
  /** 是否捕获全局错误 */
  captureGlobalErrors?: boolean
  /** 是否捕获未处理的 Promise 拒绝 */
  captureUnhandledRejections?: boolean
  /** 是否捕获资源加载错误 */
  captureResourceErrors?: boolean
  /** 是否捕获网络错误 */
  captureNetworkErrors?: boolean
  /** 最大面包屑数量 */
  maxBreadcrumbs?: number
  /** 忽略的错误模式 */
  ignorePatterns?: (string | RegExp)[]
  /** 错误过滤器 */
  beforeCapture?: (error: ErrorInfo) => ErrorInfo | null
  /** 错误回调 */
  onError?: (error: ErrorInfo) => void
}

/**
 * 错误上报器配置
 */
export interface ErrorReporterOptions {
  /** 是否启用 */
  enabled?: boolean
  /** 上报地址 */
  endpoint?: string
  /** 批量大小 */
  batchSize?: number
  /** 批量发送间隔（毫秒） */
  batchInterval?: number
  /** 最大重试次数 */
  maxRetries?: number
  /** 重试延迟（毫秒） */
  retryDelay?: number
  /** 采样率（0-1） */
  sampleRate?: number
  /** 是否启用离线缓存 */
  enableOfflineCache?: boolean
  /** 离线缓存最大数量 */
  maxOfflineCacheSize?: number
  /** 自定义请求头 */
  headers?: Record<string, string>
  /** 请求超时（毫秒） */
  timeout?: number
  /** 上报前处理 */
  beforeSend?: (errors: ErrorInfo[]) => ErrorInfo[] | null
  /** 上报成功回调 */
  onSuccess?: (errors: ErrorInfo[]) => void
  /** 上报失败回调 */
  onError?: (error: Error, failedErrors: ErrorInfo[]) => void
}

/**
 * 错误边界配置
 */
export interface ErrorBoundaryOptions {
  /** 是否显示错误详情 */
  showDetails?: boolean
  /** 是否显示堆栈 */
  showStack?: boolean
  /** 是否可重试 */
  retryable?: boolean
  /** 最大重试次数 */
  maxRetries?: number
  /** 错误回调 */
  onError?: (error: ErrorInfo) => void
  /** 重置回调 */
  onReset?: () => void
}

