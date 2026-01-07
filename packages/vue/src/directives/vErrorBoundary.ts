/**
 * v-error-boundary 指令
 *
 * @description 为元素添加错误边界功能，无需手动包裹 ErrorBoundary 组件
 *
 * @example
 * ```vue
 * <template>
 *   <!-- 基本用法 -->
 *   <div v-error-boundary>
 *     <RiskyComponent />
 *   </div>
 *
 *   <!-- 使用 overlay 模式 -->
 *   <div v-error-boundary="'overlay'">
 *     <RiskyComponent />
 *   </div>
 *
 *   <!-- 完整配置 -->
 *   <div v-error-boundary="{ mode: 'overlay', showRetry: true, onError: handleError }">
 *     <RiskyComponent />
 *   </div>
 * </template>
 * ```
 */

import {
  h,
  render,
  ref,
  type Directive,
  type DirectiveBinding,
  type VNode,
} from 'vue'
import type { ErrorInfo } from '@ldesign/error-core'
import { ErrorLevel, ErrorSource } from '@ldesign/error-core'
import { ErrorOverlay } from '../components/ErrorOverlay'
import { addErrorToast } from '../components/ErrorToast'

/**
 * 指令配置
 */
export interface ErrorBoundaryDirectiveOptions {
  /** 显示模式 */
  mode?: 'full' | 'overlay' | 'inline'
  /** 是否显示重试按钮 */
  showRetry?: boolean
  /** 最大重试次数 */
  maxRetries?: number
  /** 是否显示详情 */
  showDetails?: boolean
  /** 是否显示 Toast */
  showToast?: boolean
  /** 错误回调 */
  onError?: (error: ErrorInfo) => void
  /** 重试回调 */
  onRetry?: () => void
}

/**
 * 解析指令值
 */
function parseDirectiveValue(
  value: string | ErrorBoundaryDirectiveOptions | undefined,
): ErrorBoundaryDirectiveOptions {
  if (!value) {
    return { mode: 'overlay' }
  }

  if (typeof value === 'string') {
    return { mode: value as 'full' | 'overlay' | 'inline' }
  }

  return value
}

/**
 * 生成错误 ID
 */
function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

/** 存储原始内容和错误状态 */
const elementStates = new WeakMap<
  HTMLElement,
  {
    originalHTML: string
    hasError: boolean
    errorInfo: ErrorInfo | null
    retryCount: number
    options: ErrorBoundaryDirectiveOptions
    errorContainer: HTMLElement | null
  }
>()

/**
 * 创建错误信息
 */
function createErrorInfo(error: Error, el: HTMLElement): ErrorInfo {
  return {
    id: generateErrorId(),
    name: error.name || 'Error',
    message: error.message || 'Unknown error',
    stack: error.stack,
    level: ErrorLevel.ERROR,
    source: ErrorSource.VUE,
    timestamp: Date.now(),
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    componentInfo: {
      name: el.tagName.toLowerCase(),
    },
  }
}

/**
 * 显示错误覆盖层
 */
function showErrorOverlay(el: HTMLElement, errorInfo: ErrorInfo, options: ErrorBoundaryDirectiveOptions): void {
  const state = elementStates.get(el)
  if (!state) return

  // 创建错误容器
  const container = document.createElement('div')
  container.style.cssText = `
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 60px;
  `

  // 渲染 ErrorOverlay
  const vnode = h(ErrorOverlay, {
    error: errorInfo,
    showRetry: options.showRetry ?? true,
    showDetails: options.showDetails ?? true,
    retryCount: state.retryCount,
    maxRetries: options.maxRetries ?? 3,
    onRetry: () => handleRetry(el),
    onDismiss: () => handleDismiss(el),
  })

  render(vnode, container)

  // 替换内容
  el.innerHTML = ''
  el.appendChild(container)
  state.errorContainer = container
}

/**
 * 显示 inline 错误
 */
function showInlineError(el: HTMLElement, errorInfo: ErrorInfo, options: ErrorBoundaryDirectiveOptions): void {
  const state = elementStates.get(el)
  if (!state) return

  const container = document.createElement('div')
  container.style.cssText = `
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: linear-gradient(90deg, #fef2f2 0%, #fee2e2 100%);
    border-radius: 6px;
    border: 1px solid #fca5a5;
    font-size: 13px;
    color: #7f1d1d;
    flex-wrap: wrap;
  `

  container.innerHTML = `
    <span style="color: #dc2626; font-size: 14px;">⚠</span>
    <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
      Error: ${errorInfo.message}
    </span>
    ${options.showRetry !== false && state.retryCount < (options.maxRetries ?? 3)
      ? `<button class="l-error-retry-btn" style="
          padding: 3px 8px;
          font-size: 11px;
          color: #b91c1c;
          background: #fff;
          border: 1px solid #fca5a5;
          border-radius: 4px;
          cursor: pointer;
        ">Retry</button>`
      : ''
    }
    <button class="l-error-dismiss-btn" style="
      padding: 3px 8px;
      font-size: 11px;
      color: #6b7280;
      background: #fff;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      cursor: pointer;
    ">Dismiss</button>
  `

  // 绑定事件
  const retryBtn = container.querySelector('.l-error-retry-btn')
  const dismissBtn = container.querySelector('.l-error-dismiss-btn')

  retryBtn?.addEventListener('click', () => handleRetry(el))
  dismissBtn?.addEventListener('click', () => handleDismiss(el))

  el.innerHTML = ''
  el.appendChild(container)
  state.errorContainer = container
}

/**
 * 处理重试
 */
function handleRetry(el: HTMLElement): void {
  const state = elementStates.get(el)
  if (!state) return

  state.retryCount++
  state.hasError = false
  state.errorInfo = null

  // 恢复原始内容
  el.innerHTML = state.originalHTML
  state.errorContainer = null

  // 触发回调
  state.options.onRetry?.()
}

/**
 * 处理关闭
 */
function handleDismiss(el: HTMLElement): void {
  const state = elementStates.get(el)
  if (!state) return

  state.hasError = false
  state.errorInfo = null
  state.retryCount = 0

  // 恢复原始内容
  el.innerHTML = state.originalHTML
  state.errorContainer = null
}

/**
 * 处理元素内的错误
 */
function handleElementError(el: HTMLElement, error: Error): void {
  const state = elementStates.get(el)
  if (!state) return

  const errorInfo = createErrorInfo(error, el)
  state.hasError = true
  state.errorInfo = errorInfo

  // 触发回调
  state.options.onError?.(errorInfo)

  // 显示 Toast
  if (state.options.showToast !== false) {
    addErrorToast(errorInfo)
  }

  // 根据模式显示错误
  switch (state.options.mode) {
    case 'inline':
      showInlineError(el, errorInfo, state.options)
      break
    case 'full':
      // full 模式显示 overlay
    case 'overlay':
    default:
      showErrorOverlay(el, errorInfo, state.options)
      break
  }
}

/**
 * v-error-boundary 指令
 */
export const vErrorBoundary: Directive<HTMLElement, string | ErrorBoundaryDirectiveOptions> = {
  mounted(el: HTMLElement, binding: DirectiveBinding<string | ErrorBoundaryDirectiveOptions>) {
    const options = parseDirectiveValue(binding.value)

    // 保存原始内容
    elementStates.set(el, {
      originalHTML: el.innerHTML,
      hasError: false,
      errorInfo: null,
      retryCount: 0,
      options,
      errorContainer: null,
    })

    // 监听元素内的错误
    el.addEventListener('error', (event) => {
      if (event.target !== el) {
        event.stopPropagation()
        handleElementError(el, new Error((event as ErrorEvent).message || 'Unknown error'))
      }
    }, true)
  },

  updated(el: HTMLElement, binding: DirectiveBinding<string | ErrorBoundaryDirectiveOptions>) {
    const state = elementStates.get(el)
    if (state && !state.hasError) {
      // 更新原始内容和配置
      state.originalHTML = el.innerHTML
      state.options = parseDirectiveValue(binding.value)
    }
  },

  unmounted(el: HTMLElement) {
    const state = elementStates.get(el)
    if (state?.errorContainer) {
      render(null, state.errorContainer)
    }
    elementStates.delete(el)
  },
}

export default vErrorBoundary
