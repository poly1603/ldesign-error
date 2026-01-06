/**
 * 错误回退组件
 *
 * @description 可复用的错误显示组件，支持自定义主题和操作
 *
 * @example
 * ```vue
 * <ErrorFallback
 *   :error="errorInfo"
 *   title="加载失败"
 *   message="请检查网络连接"
 *   @retry="handleRetry"
 *   @reset="handleReset"
 * />
 * ```
 */

import {
  defineComponent,
  h,
  ref,
  type PropType,
  type VNode,
} from 'vue'
import type { ErrorInfo } from '@ldesign/error-core'

/**
 * 错误回退组件属性
 */
export interface ErrorFallbackProps {
  /** 错误信息 */
  error?: ErrorInfo | null
  /** 错误标题 */
  title?: string
  /** 错误消息 */
  message?: string
  /** 是否显示详情 */
  showDetails?: boolean
  /** 是否显示堆栈 */
  showStack?: boolean
  /** 是否显示重试按钮 */
  showRetry?: boolean
  /** 是否显示重置按钮 */
  showReset?: boolean
  /** 重试次数 */
  retryCount?: number
  /** 最大重试次数 */
  maxRetries?: number
  /** 主题 */
  theme?: 'light' | 'dark' | 'auto'
  /** 尺寸 */
  size?: 'small' | 'medium' | 'large'
}

/**
 * 错误回退组件
 */
export const ErrorFallback = defineComponent({
  name: 'LErrorFallback',

  props: {
    /** 错误信息 */
    error: {
      type: Object as PropType<ErrorInfo | null>,
      default: null,
    },
    /** 错误标题 */
    title: {
      type: String,
      default: 'Something went wrong',
    },
    /** 错误消息 */
    message: {
      type: String,
      default: 'An unexpected error occurred',
    },
    /** 是否显示详情 */
    showDetails: {
      type: Boolean,
      default: false,
    },
    /** 是否显示堆栈 */
    showStack: {
      type: Boolean,
      default: false,
    },
    /** 是否显示重试按钮 */
    showRetry: {
      type: Boolean,
      default: true,
    },
    /** 是否显示重置按钮 */
    showReset: {
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
    /** 主题 */
    theme: {
      type: String as PropType<'light' | 'dark' | 'auto'>,
      default: 'light',
    },
    /** 尺寸 */
    size: {
      type: String as PropType<'small' | 'medium' | 'large'>,
      default: 'medium',
    },
  },

  emits: {
    /** 重试事件 */
    retry: () => true,
    /** 重置事件 */
    reset: () => true,
  },

  setup(props, { emit, slots }) {
    const isExpanded = ref(false)

    /** 判断是否可以重试 */
    const canRetry = () => props.retryCount < props.maxRetries

    /** 获取尺寸样式 */
    function getSizeStyles() {
      const sizeMap = {
        small: { padding: '16px', iconSize: '40px', fontSize: '14px', titleSize: '16px' },
        medium: { padding: '24px', iconSize: '56px', fontSize: '14px', titleSize: '18px' },
        large: { padding: '32px', iconSize: '72px', fontSize: '16px', titleSize: '22px' },
      }
      return sizeMap[props.size]
    }

    /** 获取主题样式 */
    function getThemeStyles() {
      const isDark = props.theme === 'dark'
        || (props.theme === 'auto' && typeof window !== 'undefined'
          && window.matchMedia('(prefers-color-scheme: dark)').matches)

      return isDark
        ? {
            bg: '#1f1f23',
            border: '#3f3f46',
            title: '#fca5a5',
            text: '#a1a1aa',
            btnPrimaryBg: '#dc2626',
            btnSecondaryBg: 'transparent',
            btnSecondaryBorder: '#52525b',
            infoBg: 'rgba(0,0,0,0.3)',
          }
        : {
            bg: '#fef2f2',
            border: '#fca5a5',
            title: '#b91c1c',
            text: '#7f1d1d',
            btnPrimaryBg: '#dc2626',
            btnSecondaryBg: 'transparent',
            btnSecondaryBorder: '#d1d5db',
            infoBg: 'rgba(255,255,255,0.9)',
          }
    }

    /** 切换详情展开 */
    function toggleExpand() {
      isExpanded.value = !isExpanded.value
    }

    /** 渲染操作按钮 */
    function renderActions(): VNode | null {
      const hasActions = props.showRetry || props.showReset
      if (!hasActions) return null

      const theme = getThemeStyles()

      return h('div', { style: styles.actions }, [
        props.showRetry && canRetry()
          ? h('button', {
            style: { ...styles.btnPrimary, background: theme.btnPrimaryBg },
            onClick: () => emit('retry'),
          }, `Retry${props.maxRetries > 0 ? ` (${props.retryCount}/${props.maxRetries})` : ''}`)
          : null,
        props.showReset
          ? h('button', {
            style: {
              ...styles.btnSecondary,
              background: theme.btnSecondaryBg,
              borderColor: theme.btnSecondaryBorder,
            },
            onClick: () => emit('reset'),
          }, 'Reset')
          : null,
      ])
    }

    /** 渲染详情 */
    function renderDetails(): VNode | null {
      if (!props.showDetails || !props.error) return null

      const theme = getThemeStyles()
      const err = props.error

      return h('div', { style: styles.details }, [
        h('button', {
          style: { ...styles.toggle, color: theme.text },
          onClick: toggleExpand,
        }, [
          isExpanded.value ? 'Hide' : 'Details',
          h('span', {
            style: {
              marginLeft: '4px',
              transform: isExpanded.value ? 'rotate(180deg)' : 'none',
              display: 'inline-block',
              transition: 'transform 0.2s',
            },
          }, '▼'),
        ]),

        isExpanded.value
          ? h('div', { style: { ...styles.info, background: theme.infoBg } }, [
            h('div', { style: styles.infoRow }, [
              h('span', { style: styles.infoLabel }, 'Error'),
              h('span', null, err.name),
            ]),
            h('div', { style: styles.infoRow }, [
              h('span', { style: styles.infoLabel }, 'Message'),
              h('span', null, err.message),
            ]),
            props.showStack && err.stack
              ? h('pre', { style: styles.stack }, err.stack)
              : null,
          ])
          : null,
      ])
    }

    return () => {
      // 支持自定义内容
      if (slots.default) {
        return slots.default({
          error: props.error,
          retry: () => emit('retry'),
          reset: () => emit('reset'),
          canRetry: canRetry(),
        })
      }

      const theme = getThemeStyles()
      const size = getSizeStyles()

      return h('div', {
        class: 'l-error-fallback',
        style: {
          ...styles.container,
          padding: size.padding,
          background: theme.bg,
          borderColor: theme.border,
        },
      }, [
        // 图标
        h('div', {
          style: { ...styles.icon, width: size.iconSize, height: size.iconSize },
          innerHTML: errorIconSvg,
        }),

        // 标题
        h('h3', {
          style: { ...styles.title, fontSize: size.titleSize, color: theme.title },
        }, props.title),

        // 消息
        h('p', {
          style: { ...styles.message, fontSize: size.fontSize, color: theme.text },
        }, props.message),

        // 详情
        renderDetails(),

        // 操作按钮
        renderActions(),
      ])
    }
  },
})

// 样式定义
const styles = {
  container: {
    textAlign: 'center' as const,
    borderRadius: '12px',
    border: '1px solid',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  icon: {
    margin: '0 auto 12px',
  },
  title: {
    margin: '0 0 8px',
    fontWeight: '600',
  },
  message: {
    margin: '0 0 16px',
    opacity: '0.8',
    lineHeight: '1.5',
  },
  details: {
    marginBottom: '16px',
    textAlign: 'left' as const,
  },
  toggle: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 8px',
    fontSize: '12px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
  },
  info: {
    marginTop: '8px',
    padding: '12px',
    borderRadius: '6px',
    fontSize: '12px',
  },
  infoRow: {
    display: 'flex',
    marginBottom: '6px',
  },
  infoLabel: {
    width: '70px',
    fontWeight: '500',
    opacity: '0.7',
  },
  stack: {
    margin: '8px 0 0',
    padding: '8px',
    background: '#18181b',
    color: '#a1a1aa',
    borderRadius: '4px',
    fontSize: '10px',
    overflow: 'auto' as const,
    maxHeight: '120px',
  },
  actions: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },
  btnPrimary: {
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '500',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    color: '#fff',
    transition: 'opacity 0.2s',
  },
  btnSecondary: {
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '500',
    border: '1px solid',
    borderRadius: '6px',
    cursor: 'pointer',
    color: '#6b7280',
    transition: 'opacity 0.2s',
  },
}

const errorIconSvg = `<svg viewBox="0 0 64 64" fill="none">
  <circle cx="32" cy="32" r="28" fill="#fef2f2" stroke="#fca5a5" stroke-width="2"/>
  <path d="M32 18v18" stroke="#ef4444" stroke-width="4" stroke-linecap="round"/>
  <circle cx="32" cy="44" r="3" fill="#ef4444"/>
</svg>`

export default ErrorFallback
