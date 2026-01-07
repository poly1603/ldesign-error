/**
 * 错误处理核心类型定义
 * @packageDocumentation
 */

// ============================================================================
// 枚举类型
// ============================================================================

/**
 * 错误级别
 *
 * @remarks
 * 按严重程度从高到低排列
 */
export enum ErrorLevel {
  /** 致命错误 - 导致应用崩溃，需要立即处理 */
  FATAL = 'fatal',
  /** 错误 - 功能无法正常工作，需要关注 */
  ERROR = 'error',
  /** 警告 - 可能影响功能，建议修复 */
  WARNING = 'warning',
  /** 信息 - 仅供参考，用于调试 */
  INFO = 'info',
}

/**
 * 错误级别类型（字符串字面量）
 */
export type ErrorLevelType = `${ErrorLevel}`

/**
 * 错误来源
 *
 * @remarks
 * 标识错误的触发来源，便于分类和分析
 */
export enum ErrorSource {
  /** JavaScript 运行时错误 */
  RUNTIME = 'runtime',
  /** Promise 未处理拒绝 */
  PROMISE = 'promise',
  /** 网络请求错误（fetch/xhr） */
  NETWORK = 'network',
  /** 资源加载错误（图片/脚本/样式） */
  RESOURCE = 'resource',
  /** Vue 组件错误 */
  VUE = 'vue',
  /** React 组件错误 */
  REACT = 'react',
  /** 控制台错误 */
  CONSOLE = 'console',
  /** 手动捕获 */
  MANUAL = 'manual',
  /** 未知来源 */
  UNKNOWN = 'unknown',
}

/**
 * 错误来源类型（字符串字面量）
 */
export type ErrorSourceType = `${ErrorSource}`

// ============================================================================
// 面包屑类型
// ============================================================================

/**
 * 面包屑类型
 */
export type BreadcrumbType =
  | 'navigation'
  | 'click'
  | 'input'
  | 'xhr'
  | 'fetch'
  | 'console'
  | 'custom'
  | 'error'
  | 'user'

/**
 * 面包屑（操作历史）
 *
 * @remarks
 * 记录用户操作轨迹，帮助复现错误场景
 */
export interface Breadcrumb {
  /** 类型 */
  type: BreadcrumbType
  /** 分类标签 */
  category: string
  /** 描述消息 */
  message: string
  /** 附加数据 */
  data?: Record<string, unknown>
  /** 时间戳 */
  timestamp: number
  /** 级别 */
  level?: ErrorLevel
}

/**
 * 创建面包屑的输入类型（不含时间戳）
 */
export type BreadcrumbInput = Omit<Breadcrumb, 'timestamp'>

// ============================================================================
// 组件信息类型
// ============================================================================

/**
 * 组件信息
 *
 * @remarks
 * 记录发生错误的组件详情（Vue/React）
 */
export interface ComponentInfo {
  /** 组件名称 */
  name?: string
  /** 组件文件路径 */
  file?: string
  /** 组件属性快照 */
  props?: Record<string, unknown>
  /** 组件树路径 */
  tree?: string[]
  /** 生命周期钩子（如果有） */
  lifecycle?: string
}

// ============================================================================
// 错误信息类型
// ============================================================================

/**
 * 错误信息接口
 *
 * @remarks
 * 标准化的错误数据结构，包含错误的完整上下文
 */
export interface ErrorInfo {
  /** 错误唯一 ID */
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
  /** 发生时间戳 */
  timestamp: number
  /** 错误指纹（用于去重） */
  fingerprint?: string
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
  /** 标签列表 */
  tags?: string[]
  /** 组件信息（Vue/React） */
  componentInfo?: ComponentInfo
  /** 发生次数（去重后） */
  count?: number
  /** 首次发生时间 */
  firstSeen?: number
  /** 最后发生时间 */
  lastSeen?: number
}

/**
 * 错误信息只读类型
 */
export type ReadonlyErrorInfo = Readonly<ErrorInfo>

/**
 * 创建错误信息的输入类型
 */
export type ErrorInfoInput = Omit<ErrorInfo, 'id' | 'timestamp'> & {
  id?: string
  timestamp?: number
}

// ============================================================================
// 配置选项类型
// ============================================================================

/**
 * 错误捕获器配置
 */
export interface ErrorCatcherOptions {
  /** 是否启用 @default true */
  enabled?: boolean
  /** 是否捕获全局错误 @default true */
  captureGlobalErrors?: boolean
  /** 是否捕获未处理的 Promise 拒绝 @default true */
  captureUnhandledRejections?: boolean
  /** 是否捕获资源加载错误 @default true */
  captureResourceErrors?: boolean
  /** 是否捕获网络错误 @default true */
  captureNetworkErrors?: boolean
  /** 是否拦截控制台错误 @default false */
  captureConsoleErrors?: boolean
  /** 最大面包屑数量 @default 50 */
  maxBreadcrumbs?: number
  /** 忽略的错误模式（字符串或正则） */
  ignorePatterns?: (string | RegExp)[]
  /** 是否启用去重 @default true */
  enableDeduplication?: boolean
  /** 去重时间窗口（毫秒）@default 300000 (5分钟) */
  deduplicationWindow?: number
  /** 是否启用限流 @default true */
  enableRateLimit?: boolean
  /** 每分钟最大错误数 @default 100 */
  maxErrorsPerMinute?: number
  /** 错误过滤器（返回 null 则忽略） */
  beforeCapture?: (error: ErrorInfo) => ErrorInfo | null
  /** 错误回调 */
  onError?: (error: ErrorInfo) => void
}

/**
 * 已解析的错误捕获器配置（所有字段必填）
 */
export type ResolvedErrorCatcherOptions = Required<Omit<ErrorCatcherOptions, 'beforeCapture' | 'onError'>> & {
  beforeCapture: (error: ErrorInfo) => ErrorInfo | null
  onError: (error: ErrorInfo) => void
}

/**
 * 错误上报器配置
 */
export interface ErrorReporterOptions {
  /** 是否启用 @default true */
  enabled?: boolean
  /** 上报地址 @default '/api/errors' */
  endpoint?: string
  /** 批量大小 @default 10 */
  batchSize?: number
  /** 批量发送间隔（毫秒）@default 5000 */
  batchInterval?: number
  /** 最大重试次数 @default 3 */
  maxRetries?: number
  /** 重试延迟（毫秒）@default 1000 */
  retryDelay?: number
  /** 采样率（0-1）@default 1 */
  sampleRate?: number
  /** 是否启用离线缓存 @default true */
  enableOfflineCache?: boolean
  /** 离线缓存最大数量 @default 100 */
  maxOfflineCacheSize?: number
  /** 自定义请求头 */
  headers?: Record<string, string>
  /** 请求超时（毫秒）@default 10000 */
  timeout?: number
  /** 是否使用 Beacon API @default true */
  useBeacon?: boolean
  /** 是否在页面卸载时发送 @default true */
  sendOnUnload?: boolean
  /** 上报前处理（返回 null 则取消上报） */
  beforeSend?: (errors: ErrorInfo[]) => ErrorInfo[] | null
  /** 上报成功回调 */
  onSuccess?: (errors: ErrorInfo[]) => void
  /** 上报失败回调 */
  onError?: (error: Error, failedErrors: ErrorInfo[]) => void
}

/**
 * 已解析的错误上报器配置（所有字段必填）
 */
export type ResolvedErrorReporterOptions = Required<Omit<ErrorReporterOptions, 'beforeSend' | 'onSuccess' | 'onError' | 'headers'>> & {
  headers: Record<string, string>
  beforeSend: (errors: ErrorInfo[]) => ErrorInfo[] | null
  onSuccess: (errors: ErrorInfo[]) => void
  onError: (error: Error, failedErrors: ErrorInfo[]) => void
}

/**
 * 错误边界显示模式
 */
export type ErrorBoundaryMode = 'full' | 'overlay' | 'inline'

/**
 * 错误边界配置
 */
export interface ErrorBoundaryOptions {
  /** 显示模式 @default 'full' */
  mode?: ErrorBoundaryMode
  /** 是否显示错误详情 @default true */
  showDetails?: boolean
  /** 是否显示堆栈 @default false */
  showStack?: boolean
  /** 是否可重试 @default true */
  retryable?: boolean
  /** 最大重试次数 @default 3 */
  maxRetries?: number
  /** 自定义错误标题 */
  errorTitle?: string
  /** 自定义错误消息 */
  errorMessage?: string
  /** overlay 模式最小高度 */
  overlayMinHeight?: string
  /** 错误回调 */
  onError?: (error: ErrorInfo) => void
  /** 重置回调 */
  onReset?: () => void
  /** 重试回调 */
  onRetry?: (count: number) => void
}

/**
 * 全局错误提示配置
 */
export interface ErrorToastOptions {
  /** 是否启用 @default true */
  enabled?: boolean
  /** 最大显示数量 @default 5 */
  maxToasts?: number
  /** 默认显示时长 (ms) @default 5000 */
  defaultDuration?: number
  /** 位置 @default 'top-right' */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  /** 是否自动显示 Vue 错误 */
  showVueErrors?: boolean
  /** 是否自动显示全局错误 */
  showGlobalErrors?: boolean
}

/**
 * Tracker 集成配置
 */
export interface TrackerIntegrationOptions {
  /** 是否启用 @default true */
  enabled?: boolean
  /** 最大获取的事件数量 @default 20 */
  maxEvents?: number
  /** 包含的事件类型 */
  includeTypes?: string[]
  /** 排除的事件类型 */
  excludeTypes?: string[]
  /** 是否包含事件详情数据 @default true */
  includeEventData?: boolean
}

// ============================================================================
// 工具类型
// ============================================================================

/**
 * 深度只读类型
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

/**
 * 可空类型
 */
export type Nullable<T> = T | null

/**
 * 可选类型
 */
export type Optional<T> = T | undefined

/**
 * 错误处理器函数类型
 */
export type ErrorHandler = (error: ErrorInfo) => void

/**
 * 错误过滤器函数类型
 */
export type ErrorFilter = (error: ErrorInfo) => boolean

/**
 * 错误转换器函数类型
 */
export type ErrorTransformer = (error: ErrorInfo) => ErrorInfo | null

/**
 * 异步错误处理器函数类型
 */
export type AsyncErrorHandler = (error: ErrorInfo) => Promise<void>

// ============================================================================
// 事件类型
// ============================================================================

/**
 * 错误事件类型
 */
export interface ErrorEvents {
  /** 捕获到错误 */
  error: ErrorInfo
  /** 上报成功 */
  reported: ErrorInfo[]
  /** 上报失败 */
  reportFailed: { error: Error, errors: ErrorInfo[] }
  /** 错误被忽略（去重/限流） */
  ignored: { error: ErrorInfo, reason: 'duplicate' | 'rateLimit' | 'filtered' }
}

/**
 * 事件监听器类型
 */
export type ErrorEventListener<K extends keyof ErrorEvents> = (payload: ErrorEvents[K]) => void

