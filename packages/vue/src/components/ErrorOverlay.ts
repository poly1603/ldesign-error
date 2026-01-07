/**
 * 错误覆盖组件
 *
 * @description 轻量级错误显示组件，覆盖在原组件位置上
 * 适用于组件报错时保持页面布局不变的场景
 *
 * @example
 * ```vue
 * <ErrorOverlay
 *   :error="errorInfo"
 *   @retry="handleRetry"
 *   @dismiss="handleDismiss"
 * />
 * ```
 */

import {
  defineComponent,
  h,
  ref,
  computed,
  type PropType,
  type VNode,
} from 'vue'
import type { ErrorInfo } from '@ldesign/error-core'

/**
 * 错误覆盖组件属性
 */
export interface ErrorOverlayProps {
  /** 错误信息 */
  error?: ErrorInfo | null
  /** 是否显示重试按钮 */
  showRetry?: boolean
  /** 是否显示关闭按钮 */
  showDismiss?: boolean
  /** 是否显示详情 */
  showDetails?: boolean
  /** 重试次数 */
  retryCount?: number
  /** 最大重试次数 */
  maxRetries?: number
  /** 透明度 (0-1) */
  opacity?: number
  /** 尺寸模式 */
  size?: 'auto' | 'fill'
  /** 最小高度 */
  minHeight?: string
}

/**
 * 错误覆盖组件
 */
export const ErrorOverlay = defineComponent({
  name: 'LErrorOverlay',

  props: {
    /** 错误信息 */
    error: {
      type: Object as PropType<ErrorInfo | null>,
      default: null,
    },
    /** 是否显示重试按钮 */
    showRetry: {
      type: Boolean,
      default: true,
    },
    /** 是否显示关闭按钮 */
    showDismiss: {
      type: Boolean,
      default: false,
    },
    /** 是否显示详情 */
    showDetails: {
      type: Boolean,
      default: true,
    },
    /** 重试次数 */
    retryCount: {
      type: Number,
      default: 0,
    },
    /** 最大重试次数 */
    maxRetries: {
      type: Number,
      default: 3,
    },
    /** 透明度 */
    opacity: {
      type: Number,
      default: 0.95,
    },
    /** 尺寸模式 */
    size: {
      type: String as PropType<'auto' | 'fill'>,
      default: 'fill',
    },
    /** 最小高度 */
    minHeight: {
      type: String,
      default: '80px',
    },
  },

  emits: {
    /** 重试事件 */
    retry: () => true,
    /** 关闭事件 */
    dismiss: () => true,
    /** 查看详情事件 */
    detail: (_error: ErrorInfo) => true,
  },

  setup(props, { emit }) {
    const isExpanded = ref(false)

    const canRetry = computed(() => {
      return props.showRetry && props.retryCount < props.maxRetries
    })

    const errorMessage = computed(() => {
      if (!props.error) return 'Unknown error'
      return props.error.message || props.error.name || 'Component error'
    })

    const componentName = computed(() => {
      return props.error?.componentInfo?.name || 'Component'
    })

    function toggleExpand(): void {
      isExpanded.value = !isExpanded.value
    }

    function handleRetry(): void {
      emit('retry')
    }

    function handleDismiss(): void {
      emit('dismiss')
    }

    function handleViewDetail(): void {
      if (props.error) {
        emit('detail', props.error)
      }
    }

    /** 渲染详情面板 */
    function renderDetails(): VNode | null {
      if (!props.showDetails || !props.error || !isExpanded.value) {
        return null
      }

      const err = props.error

      return h('div', { style: styles.details }, [
        h('div', { style: styles.detailRow }, [
          h('span', { style: styles.detailLabel }, 'Error:'),
          h('span', { style: styles.detailValue }, err.name),
        ]),
        h('div', { style: styles.detailRow }, [
          h('span', { style: styles.detailLabel }, 'Message:'),
          h('span', { style: styles.detailValue }, err.message),
        ]),
        err.componentInfo?.name
          ? h('div', { style: styles.detailRow }, [
              h('span', { style: styles.detailLabel }, 'Component:'),
              h('span', { style: styles.detailValue }, err.componentInfo.name),
            ])
          : null,
        h('div', { style: styles.detailRow }, [
          h('span', { style: styles.detailLabel }, 'Time:'),
          h('span', { style: styles.detailValue }, new Date(err.timestamp).toLocaleTimeString()),
        ]),
        err.stack
          ? h('pre', { style: styles.stack }, err.stack.split('\n').slice(0, 5).join('\n'))
          : null,
      ])
    }

    return () => {
      if (!props.error) return null

      return h('div', {
        class: 'l-error-overlay',
        style: {
          ...styles.container,
          minHeight: props.minHeight,
          opacity: props.opacity,
          ...(props.size === 'fill' ? styles.fillSize : styles.autoSize),
        },
      }, [
        // 错误图标
        h('div', {
          style: styles.icon,
          innerHTML: errorIconSvg,
        }),

        // 主体内容
        h('div', { style: styles.content }, [
          // 错误标题
          h('div', { style: styles.title }, [
            h('span', { style: styles.titleIcon }, '⚠'),
            `${componentName.value} Error`,
          ]),

          // 错误消息
          h('div', { style: styles.message }, errorMessage.value),

          // 操作按钮
          h('div', { style: styles.actions }, [
            props.showDetails
              ? h('button', {
                  style: styles.linkBtn,
                  onClick: toggleExpand,
                }, isExpanded.value ? 'Hide Details ▲' : 'Show Details ▼')
              : null,

            canRetry.value
              ? h('button', {
                  style: styles.retryBtn,
                  onClick: handleRetry,
                }, `Retry${props.maxRetries > 0 ? ` (${props.retryCount}/${props.maxRetries})` : ''}`)
              : null,

            props.showDismiss
              ? h('button', {
                  style: styles.dismissBtn,
                  onClick: handleDismiss,
                  title: 'Dismiss',
                }, '×')
              : null,
          ]),

          // 详情面板
          renderDetails(),
        ]),
      ])
    }
  },
})

// ============================================================================
// 样式定义
// ============================================================================

const styles = {
  container: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 16px',
    background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.95) 0%, rgba(185, 28, 28, 0.95) 100%)',
    borderRadius: '8px',
    boxShadow: '0 2px 12px rgba(220, 38, 38, 0.3)',
    color: '#fff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '13px',
    overflow: 'hidden',
    gap: '12px',
  },
  fillSize: {
    width: '100%',
    height: '100%',
  },
  autoSize: {
    width: 'auto',
    height: 'auto',
  },
  icon: {
    flexShrink: '0',
    width: '32px',
    height: '32px',
    opacity: '0.9',
  },
  content: {
    flex: '1',
    minWidth: '0',
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontWeight: '600',
    fontSize: '14px',
    marginBottom: '4px',
  },
  titleIcon: {
    fontSize: '14px',
  },
  message: {
    opacity: '0.9',
    lineHeight: '1.4',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    maxWidth: '100%',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginTop: '8px',
  },
  linkBtn: {
    padding: '0',
    fontSize: '12px',
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'underline',
    textUnderlineOffset: '2px',
  },
  retryBtn: {
    padding: '4px 12px',
    fontSize: '12px',
    fontWeight: '500',
    color: '#dc2626',
    background: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  dismissBtn: {
    position: 'absolute' as const,
    top: '8px',
    right: '8px',
    width: '20px',
    height: '20px',
    padding: '0',
    fontSize: '16px',
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.7)',
    background: 'transparent',
    border: 'none',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  details: {
    marginTop: '12px',
    padding: '10px',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '6px',
    fontSize: '12px',
  },
  detailRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '4px',
    lineHeight: '1.5',
  },
  detailLabel: {
    flexShrink: '0',
    width: '70px',
    opacity: '0.7',
  },
  detailValue: {
    flex: '1',
    wordBreak: 'break-word' as const,
  },
  stack: {
    margin: '8px 0 0',
    padding: '8px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '4px',
    fontSize: '10px',
    lineHeight: '1.4',
    overflow: 'auto' as const,
    maxHeight: '100px',
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-all' as const,
  },
}

// SVG 图标
const errorIconSvg = `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="16" cy="16" r="14" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
  <path d="M16 9v8" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="16" cy="22" r="1.5" fill="#fff"/>
</svg>`

export default ErrorOverlay
