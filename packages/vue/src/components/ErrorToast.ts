/**
 * 全局错误提示组件
 *
 * @description 非阻塞式 Toast 形式错误提示，显示在页面角落
 * 支持多个错误堆叠显示，自动消失，不阻塞用户操作
 *
 * @example
 * ```vue
 * <ErrorToastContainer />
 *
 * <script setup>
 * import { useGlobalErrorToast } from '@ldesign/error-vue'
 * const { showError } = useGlobalErrorToast()
 * showError({ message: 'Something went wrong' })
 * </script>
 * ```
 */

import {
  defineComponent,
  h,
  ref,
  reactive,
  onMounted,
  onUnmounted,
  Teleport,
  Transition,
  TransitionGroup,
  type PropType,
  type VNode,
} from 'vue'
import type { ErrorInfo } from '@ldesign/error-core'

// ============================================================================
// Toast 管理器 (单例)
// ============================================================================

export interface ToastItem {
  id: string
  error: ErrorInfo
  duration: number
  createdAt: number
  isExpanded: boolean
}

export interface ToastManagerOptions {
  /** 最大显示数量 */
  maxToasts?: number
  /** 默认显示时长 (ms) */
  defaultDuration?: number
  /** 位置 */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

const DEFAULT_MANAGER_OPTIONS: Required<ToastManagerOptions> = {
  maxToasts: 5,
  defaultDuration: 5000,
  position: 'top-right',
}

/** Toast 队列 */
const toastQueue = reactive<ToastItem[]>([])

/** 定时器映射 */
const timerMap = new Map<string, ReturnType<typeof setTimeout>>()

/** 管理器配置 */
let managerOptions = { ...DEFAULT_MANAGER_OPTIONS }

/** 生成唯一 ID */
function generateToastId(): string {
  return `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

/**
 * 添加错误提示
 */
export function addErrorToast(error: ErrorInfo, duration?: number): string {
  const id = generateToastId()
  const toastDuration = duration ?? managerOptions.defaultDuration

  const item: ToastItem = {
    id,
    error,
    duration: toastDuration,
    createdAt: Date.now(),
    isExpanded: false,
  }

  // 添加到队列
  toastQueue.unshift(item)

  // 限制数量
  while (toastQueue.length > managerOptions.maxToasts) {
    const removed = toastQueue.pop()
    if (removed) {
      clearToastTimer(removed.id)
    }
  }

  // 设置自动关闭
  if (toastDuration > 0) {
    const timer = setTimeout(() => {
      removeErrorToast(id)
    }, toastDuration)
    timerMap.set(id, timer)
  }

  return id
}

/**
 * 移除错误提示
 */
export function removeErrorToast(id: string): void {
  const index = toastQueue.findIndex(t => t.id === id)
  if (index > -1) {
    toastQueue.splice(index, 1)
    clearToastTimer(id)
  }
}

/**
 * 清除定时器
 */
function clearToastTimer(id: string): void {
  const timer = timerMap.get(id)
  if (timer) {
    clearTimeout(timer)
    timerMap.delete(id)
  }
}

/**
 * 清空所有提示
 */
export function clearAllToasts(): void {
  toastQueue.splice(0, toastQueue.length)
  timerMap.forEach(timer => clearTimeout(timer))
  timerMap.clear()
}

/**
 * 更新管理器配置
 */
export function setToastManagerOptions(options: ToastManagerOptions): void {
  managerOptions = { ...managerOptions, ...options }
}

/**
 * 获取 Toast 队列 (响应式)
 */
export function getToastQueue(): ToastItem[] {
  return toastQueue
}

// ============================================================================
// 单个 Toast 组件
// ============================================================================

export const ErrorToastItem = defineComponent({
  name: 'LErrorToastItem',

  props: {
    item: {
      type: Object as PropType<ToastItem>,
      required: true,
    },
  },

  emits: {
    close: (_id: string) => true,
  },

  setup(props, { emit }) {
    const isHovered = ref(false)

    function handleClose(): void {
      emit('close', props.item.id)
    }

    function toggleExpand(): void {
      props.item.isExpanded = !props.item.isExpanded
    }

    function handleMouseEnter(): void {
      isHovered.value = true
      // 暂停自动关闭
      clearToastTimer(props.item.id)
    }

    function handleMouseLeave(): void {
      isHovered.value = false
      // 恢复自动关闭
      if (props.item.duration > 0) {
        const remaining = props.item.duration - (Date.now() - props.item.createdAt)
        if (remaining > 0) {
          const timer = setTimeout(() => {
            removeErrorToast(props.item.id)
          }, Math.max(remaining, 1000))
          timerMap.set(props.item.id, timer)
        }
      }
    }

    function copyErrorInfo(): void {
      const { error } = props.item
      const text = `Error: ${error.name}\nMessage: ${error.message}\nTime: ${new Date(error.timestamp).toLocaleString()}${error.stack ? `\nStack: ${error.stack}` : ''}`
      navigator.clipboard?.writeText(text)
    }

    return () => {
      const { error, isExpanded } = props.item

      return h('div', {
        class: 'l-error-toast-item',
        style: styles.toast,
        onMouseenter: handleMouseEnter,
        onMouseleave: handleMouseLeave,
      }, [
        // 左侧颜色条
        h('div', { style: styles.colorBar }),

        // 主体内容
        h('div', { style: styles.toastContent }, [
          // 头部
          h('div', { style: styles.toastHeader }, [
            h('div', { style: styles.toastIcon, innerHTML: errorIconSvg }),
            h('div', { style: styles.toastTitle }, error.name || 'Error'),
            h('button', {
              style: styles.closeBtn,
              onClick: handleClose,
              title: 'Close',
            }, '×'),
          ]),

          // 消息
          h('div', {
            style: {
              ...styles.toastMessage,
              ...(isExpanded ? {} : styles.toastMessageTruncate),
            },
          }, error.message),

          // 组件信息
          error.componentInfo?.name
            ? h('div', { style: styles.toastMeta }, [
                h('span', { style: styles.metaLabel }, 'Component:'),
                h('span', null, error.componentInfo.name),
              ])
            : null,

          // 展开详情
          isExpanded
            ? h('div', { style: styles.toastDetails }, [
                error.stack
                  ? h('pre', { style: styles.toastStack }, error.stack.split('\n').slice(0, 4).join('\n'))
                  : null,
                h('div', { style: styles.toastMeta }, [
                  h('span', { style: styles.metaLabel }, 'Time:'),
                  h('span', null, new Date(error.timestamp).toLocaleTimeString()),
                ]),
              ])
            : null,

          // 底部操作
          h('div', { style: styles.toastActions }, [
            h('button', {
              style: styles.actionBtn,
              onClick: toggleExpand,
            }, isExpanded ? 'Hide' : 'Details'),
            h('button', {
              style: styles.actionBtn,
              onClick: copyErrorInfo,
            }, 'Copy'),
          ]),
        ]),
      ])
    }
  },
})

// ============================================================================
// Toast 容器组件
// ============================================================================

export const ErrorToastContainer = defineComponent({
  name: 'LErrorToastContainer',

  props: {
    /** 位置 */
    position: {
      type: String as PropType<'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'>,
      default: 'top-right',
    },
    /** 最大显示数量 */
    maxToasts: {
      type: Number,
      default: 5,
    },
    /** 默认显示时长 */
    defaultDuration: {
      type: Number,
      default: 5000,
    },
    /** z-index */
    zIndex: {
      type: Number,
      default: 9999,
    },
  },

  setup(props) {
    // 更新配置
    onMounted(() => {
      setToastManagerOptions({
        maxToasts: props.maxToasts,
        defaultDuration: props.defaultDuration,
        position: props.position,
      })
    })

    onUnmounted(() => {
      // 组件卸载时不清空队列，以支持多实例场景
    })

    function handleClose(id: string): void {
      removeErrorToast(id)
    }

    function getPositionStyle(): Record<string, string> {
      const base = { position: 'fixed' as const }
      switch (props.position) {
        case 'top-left':
          return { ...base, top: '16px', left: '16px' }
        case 'bottom-right':
          return { ...base, bottom: '16px', right: '16px' }
        case 'bottom-left':
          return { ...base, bottom: '16px', left: '16px' }
        case 'top-right':
        default:
          return { ...base, top: '16px', right: '16px' }
      }
    }

    return () => {
      return h(Teleport, { to: 'body' }, () =>
        h('div', {
          class: 'l-error-toast-container',
          style: {
            ...styles.container,
            ...getPositionStyle(),
            zIndex: props.zIndex,
          },
        }, [
          h(TransitionGroup, {
            name: 'l-toast',
            tag: 'div',
            style: styles.list,
          }, () =>
            toastQueue.map(item =>
              h(ErrorToastItem, {
                key: item.id,
                item,
                onClose: handleClose,
              }),
            ),
          ),
        ]),
      )
    }
  },
})

// ============================================================================
// 样式定义
// ============================================================================

const styles = {
  container: {
    pointerEvents: 'none' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    maxWidth: '380px',
    width: '100%',
  },
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  toast: {
    pointerEvents: 'auto' as const,
    display: 'flex',
    background: '#fff',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
    overflow: 'hidden',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '13px',
    animation: 'l-toast-in 0.3s ease',
  },
  colorBar: {
    width: '4px',
    flexShrink: '0',
    background: 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)',
  },
  toastContent: {
    flex: '1',
    padding: '12px 14px',
    minWidth: '0',
  },
  toastHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
  },
  toastIcon: {
    width: '16px',
    height: '16px',
    flexShrink: '0',
  },
  toastTitle: {
    flex: '1',
    fontWeight: '600',
    fontSize: '14px',
    color: '#b91c1c',
  },
  closeBtn: {
    width: '20px',
    height: '20px',
    padding: '0',
    fontSize: '18px',
    fontWeight: '300',
    color: '#9ca3af',
    background: 'transparent',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s',
    flexShrink: '0',
  },
  toastMessage: {
    color: '#374151',
    lineHeight: '1.5',
    wordBreak: 'break-word' as const,
  },
  toastMessageTruncate: {
    display: '-webkit-box',
    WebkitLineClamp: '2',
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
  },
  toastMeta: {
    display: 'flex',
    gap: '6px',
    marginTop: '6px',
    fontSize: '12px',
    color: '#6b7280',
  },
  metaLabel: {
    opacity: '0.7',
  },
  toastDetails: {
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px solid #e5e7eb',
  },
  toastStack: {
    margin: '0 0 8px',
    padding: '8px',
    background: '#f9fafb',
    borderRadius: '4px',
    fontSize: '10px',
    lineHeight: '1.4',
    color: '#6b7280',
    overflow: 'auto' as const,
    maxHeight: '80px',
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-all' as const,
  },
  toastActions: {
    display: 'flex',
    gap: '8px',
    marginTop: '10px',
  },
  actionBtn: {
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: '500',
    color: '#6b7280',
    background: '#f3f4f6',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
}

// SVG 图标
const errorIconSvg = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="8" cy="8" r="7" fill="#fef2f2" stroke="#fca5a5" stroke-width="1"/>
  <path d="M8 4v5" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round"/>
  <circle cx="8" cy="11" r="0.75" fill="#ef4444"/>
</svg>`

// ============================================================================
// CSS 动画 (需要注入)
// ============================================================================

const CSS_ANIMATIONS = `
@keyframes l-toast-in {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.l-toast-enter-active {
  animation: l-toast-in 0.3s ease;
}

.l-toast-leave-active {
  animation: l-toast-in 0.2s ease reverse;
}

.l-toast-move {
  transition: transform 0.3s ease;
}
`

// 自动注入样式
let styleInjected = false
export function injectToastStyles(): void {
  if (styleInjected || typeof document === 'undefined') return

  const style = document.createElement('style')
  style.textContent = CSS_ANIMATIONS
  style.setAttribute('data-ldesign-toast', '')
  document.head.appendChild(style)
  styleInjected = true
}

// 导出默认组件
export default ErrorToastContainer
