/**
 * 常量配置
 * @module constants
 */

/**
 * 默认错误捕获器配置
 */
export const DEFAULT_CATCHER_OPTIONS = {
  /** 是否启用 */
  enabled: true,
  /** 是否捕获全局错误 */
  captureGlobalErrors: true,
  /** 是否捕获未处理的 Promise 拒绝 */
  captureUnhandledRejections: true,
  /** 是否捕获资源加载错误 */
  captureResourceErrors: true,
  /** 是否捕获网络错误 */
  captureNetworkErrors: true,
  /** 最大面包屑数量 */
  maxBreadcrumbs: 50,
  /** 是否启用去重 */
  enableDeduplication: true,
  /** 去重时间窗口（毫秒） */
  deduplicationWindow: 5 * 60 * 1000, // 5 分钟
  /** 是否启用限流 */
  enableRateLimit: true,
  /** 限流：每分钟最大错误数 */
  maxErrorsPerMinute: 100,
} as const

/**
 * 默认错误上报器配置
 */
export const DEFAULT_REPORTER_OPTIONS = {
  /** 是否启用 */
  enabled: true,
  /** 上报地址 */
  endpoint: '/api/errors',
  /** 批量大小 */
  batchSize: 10,
  /** 批量发送间隔（毫秒） */
  batchInterval: 5000,
  /** 最大重试次数 */
  maxRetries: 3,
  /** 重试延迟（毫秒） */
  retryDelay: 1000,
  /** 采样率（0-1） */
  sampleRate: 1,
  /** 是否启用离线缓存 */
  enableOfflineCache: true,
  /** 离线缓存最大数量 */
  maxOfflineCacheSize: 100,
  /** 请求超时（毫秒） */
  timeout: 10000,
  /** 是否使用 Beacon API */
  useBeacon: true,
  /** 是否在页面卸载时发送 */
  sendOnUnload: true,
} as const

/**
 * IndexedDB 配置
 */
export const INDEXED_DB_CONFIG = {
  /** 数据库名称 */
  dbName: 'ldesign_error_cache',
  /** 存储名称 */
  storeName: 'errors',
  /** 数据库版本 */
  version: 1,
} as const

/**
 * 错误级别权重
 *
 * 用于排序和过滤
 */
export const ERROR_LEVEL_WEIGHT = {
  fatal: 4,
  error: 3,
  warning: 2,
  info: 1,
} as const

/**
 * 默认忽略的错误模式
 *
 * 这些错误通常是无害的或来自第三方脚本
 */
export const DEFAULT_IGNORE_PATTERNS = [
  // Chrome 扩展错误
  /^chrome-extension:\/\//,
  // Firefox 扩展错误
  /^moz-extension:\/\//,
  // Safari 扩展错误
  /^safari-extension:\/\//,
  // 跨域脚本错误
  /^Script error\.?$/,
  // ResizeObserver 循环限制
  /ResizeObserver loop/,
  // 网络错误（可选忽略）
  // /Failed to fetch/,
  // /NetworkError/,
] as const

/**
 * 最大堆栈长度
 */
export const MAX_STACK_LENGTH = 50

/**
 * 最大错误消息长度
 */
export const MAX_MESSAGE_LENGTH = 1000

/**
 * 最大额外数据大小（字节）
 */
export const MAX_EXTRA_SIZE = 10 * 1024 // 10KB

/**
 * 版本号
 */
export const VERSION = '1.0.0'
