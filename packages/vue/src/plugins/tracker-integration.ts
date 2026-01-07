/**
 * Tracker 集成模块
 *
 * @description 将错误处理与用户行为追踪集成
 * 错误发生时自动获取最近的用户操作记录，一同上报
 *
 * @example
 * ```ts
 * import { createErrorPlugin } from '@ldesign/error-vue'
 * import { createTrackerIntegration } from '@ldesign/error-vue/plugins'
 *
 * // 假设 tracker 已初始化
 * const integration = createTrackerIntegration({
 *   tracker,
 *   maxEvents: 20,
 *   includeTypes: ['click', 'navigation', 'input'],
 * })
 *
 * app.use(createErrorPlugin({
 *   trackerIntegration: integration,
 * }))
 * ```
 */

import type { ErrorInfo, Breadcrumb } from '@ldesign/error-core'
import { ErrorLevel } from '@ldesign/error-core'

// Breadcrumb 类型中支持的 type 值
type ValidBreadcrumbType = 'navigation' | 'click' | 'input' | 'xhr' | 'fetch' | 'console' | 'custom'

// ============================================================================
// 类型定义
// ============================================================================

/**
 * Tracker 事件类型 (与 @ldesign/tracker-core 兼容)
 */
export interface TrackerEvent {
  id: string
  type: string
  name: string
  timestamp: number
  url: string
  pageTitle?: string
  data?: Record<string, unknown>
  target?: {
    tagName: string
    id?: string
    className?: string
    text?: string
    xpath?: string
    attributes?: Record<string, string>
  }
  userId?: string
  sessionId: string
  pageId?: string
  priority?: number
  properties?: Record<string, unknown>
}

/**
 * Tracker 接口 (最小兼容接口)
 */
export interface TrackerLike {
  /** 获取事件队列 */
  getEvents(): TrackerEvent[]
  /** 获取会话 ID */
  getSessionId(): string
  /** 是否已初始化 */
  isInitialized(): boolean
}

/**
 * Tracker 集成配置
 */
export interface TrackerIntegrationOptions {
  /** Tracker 实例 */
  tracker?: TrackerLike
  /** 获取 Tracker 实例的函数 (延迟获取) */
  getTracker?: () => TrackerLike | undefined
  /** 最大获取的事件数量 */
  maxEvents?: number
  /** 包含的事件类型 */
  includeTypes?: string[]
  /** 排除的事件类型 */
  excludeTypes?: string[]
  /** 是否包含事件详情数据 */
  includeEventData?: boolean
  /** 自定义事件转换函数 */
  transformEvent?: (event: TrackerEvent) => Breadcrumb | null
  /** 是否启用 */
  enabled?: boolean
}

const DEFAULT_OPTIONS: Required<Omit<TrackerIntegrationOptions, 'tracker' | 'getTracker' | 'transformEvent'>> = {
  maxEvents: 20,
  includeTypes: ['click', 'navigation', 'page_view', 'input', 'form_submit', 'scroll'],
  excludeTypes: [],
  includeEventData: true,
  enabled: true,
}

// ============================================================================
// 事件类型映射
// ============================================================================

/**
 * 将 Tracker 事件类型映射为 Breadcrumb 类型
 */
function mapEventTypeToBreadcrumbType(type: string): ValidBreadcrumbType {
  const typeMap: Record<string, ValidBreadcrumbType> = {
    click: 'click',
    page_view: 'navigation',
    page_leave: 'navigation',
    navigation: 'navigation',
    input: 'input',
    form_submit: 'input',
    scroll: 'custom',
    exposure: 'custom',
    error: 'custom', // 映射为 custom
    network: 'xhr',
    fetch: 'fetch',
    xhr: 'xhr',
    custom: 'custom',
  }
  return typeMap[type] || 'custom'
}

/**
 * 将 Tracker 事件转换为 Breadcrumb
 */
function defaultTransformEvent(
  event: TrackerEvent,
  includeData: boolean,
): Breadcrumb {
  const type = mapEventTypeToBreadcrumbType(event.type)

  // 构建消息
  let message = event.name
  if (event.target?.text) {
    message = `${event.name}: ${event.target.text.slice(0, 50)}`
  } else if (event.target?.tagName) {
    const identifier = event.target.id
      ? `#${event.target.id}`
      : event.target.className
        ? `.${event.target.className.split(' ')[0]}`
        : ''
    message = `${event.name}: <${event.target.tagName.toLowerCase()}${identifier}>`
  }

  // 构建数据
  const data: Record<string, unknown> = {
    eventType: event.type,
    url: event.url,
  }

  if (event.target) {
    data.target = {
      tagName: event.target.tagName,
      id: event.target.id,
      className: event.target.className,
    }
  }

  if (includeData && event.data) {
    // 只保留安全的数据字段
    const safeData: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(event.data)) {
      // 过滤敏感字段
      if (!['password', 'token', 'secret', 'credit', 'card'].some(s => key.toLowerCase().includes(s))) {
        safeData[key] = value
      }
    }
    if (Object.keys(safeData).length > 0) {
      data.eventData = safeData
    }
  }

  return {
    type,
    category: event.type,
    message,
    data,
    timestamp: event.timestamp,
    level: ErrorLevel.INFO,
  }
}

// ============================================================================
// Tracker 集成类
// ============================================================================

/**
 * Tracker 集成
 */
export class TrackerIntegration {
  private options: Required<Omit<TrackerIntegrationOptions, 'tracker' | 'getTracker' | 'transformEvent'>> & {
    tracker?: TrackerLike
    getTracker?: () => TrackerLike | undefined
    transformEvent?: (event: TrackerEvent) => Breadcrumb | null
  }

  constructor(options: TrackerIntegrationOptions = {}) {
    this.options = {
      ...DEFAULT_OPTIONS,
      tracker: options.tracker,
      getTracker: options.getTracker,
      transformEvent: options.transformEvent,
      maxEvents: options.maxEvents ?? DEFAULT_OPTIONS.maxEvents,
      includeTypes: options.includeTypes ?? DEFAULT_OPTIONS.includeTypes,
      excludeTypes: options.excludeTypes ?? DEFAULT_OPTIONS.excludeTypes,
      includeEventData: options.includeEventData ?? DEFAULT_OPTIONS.includeEventData,
      enabled: options.enabled ?? DEFAULT_OPTIONS.enabled,
    }
  }

  /**
   * 获取 Tracker 实例
   */
  private getTracker(): TrackerLike | undefined {
    if (this.options.tracker) {
      return this.options.tracker
    }
    if (this.options.getTracker) {
      return this.options.getTracker()
    }
    return undefined
  }

  /**
   * 检查事件是否应该被包含
   */
  private shouldIncludeEvent(event: TrackerEvent): boolean {
    const { includeTypes, excludeTypes } = this.options

    // 检查排除列表
    if (excludeTypes.length > 0 && excludeTypes.includes(event.type)) {
      return false
    }

    // 检查包含列表
    if (includeTypes.length > 0 && !includeTypes.includes(event.type)) {
      return false
    }

    return true
  }

  /**
   * 获取最近的用户操作记录
   */
  getRecentEvents(): TrackerEvent[] {
    if (!this.options.enabled) {
      return []
    }

    const tracker = this.getTracker()
    if (!tracker || !tracker.isInitialized()) {
      return []
    }

    try {
      const events = tracker.getEvents()

      // 过滤事件
      const filteredEvents = events.filter(e => this.shouldIncludeEvent(e))

      // 按时间倒序排列，取最近的
      return filteredEvents
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, this.options.maxEvents)
    } catch {
      return []
    }
  }

  /**
   * 将 Tracker 事件转换为 Breadcrumbs
   */
  convertToBreadcrumbs(events: TrackerEvent[]): Breadcrumb[] {
    const breadcrumbs: Breadcrumb[] = []

    for (const event of events) {
      try {
        let breadcrumb: Breadcrumb | null

        if (this.options.transformEvent) {
          breadcrumb = this.options.transformEvent(event)
        } else {
          breadcrumb = defaultTransformEvent(event, this.options.includeEventData)
        }

        if (breadcrumb) {
          breadcrumbs.push(breadcrumb)
        }
      } catch {
        // 忽略转换错误
      }
    }

    // 按时间正序返回
    return breadcrumbs.reverse()
  }

  /**
   * 增强错误信息，添加用户操作记录
   */
  enrichError(error: ErrorInfo): ErrorInfo {
    if (!this.options.enabled) {
      return error
    }

    const events = this.getRecentEvents()
    if (events.length === 0) {
      return error
    }

    const trackerBreadcrumbs = this.convertToBreadcrumbs(events)

    // 合并现有的 breadcrumbs
    const existingBreadcrumbs = error.breadcrumbs || []
    const mergedBreadcrumbs = [...existingBreadcrumbs, ...trackerBreadcrumbs]

    // 按时间排序并去重
    const uniqueBreadcrumbs = mergedBreadcrumbs
      .sort((a, b) => a.timestamp - b.timestamp)
      .filter((crumb, index, arr) => {
        if (index === 0) return true
        const prev = arr[index - 1]
        // 去除时间戳相近且消息相同的重复项
        return !(Math.abs(crumb.timestamp - prev.timestamp) < 100 && crumb.message === prev.message)
      })

    // 获取 Tracker 的会话信息
    const tracker = this.getTracker()
    const trackerSessionId = tracker?.getSessionId()

    return {
      ...error,
      breadcrumbs: uniqueBreadcrumbs,
      extra: {
        ...error.extra,
        trackerSessionId,
        trackerEventsCount: events.length,
      },
    }
  }

  /**
   * 更新配置
   */
  setOptions(options: Partial<TrackerIntegrationOptions>): void {
    this.options = {
      ...this.options,
      ...options,
    }
  }

  /**
   * 是否启用
   */
  isEnabled(): boolean {
    return this.options.enabled
  }

  /**
   * 设置 Tracker 实例
   */
  setTracker(tracker: TrackerLike): void {
    this.options.tracker = tracker
  }
}

/**
 * 创建 Tracker 集成实例
 */
export function createTrackerIntegration(
  options: TrackerIntegrationOptions = {},
): TrackerIntegration {
  return new TrackerIntegration(options)
}

export default TrackerIntegration
