/**
 * 错误边界组件
 *
 * @description 捕获子组件错误并显示友好的错误界面
 * 支持自定义主题、重试、自定义回退内容
 * 支持三种显示模式: full（完整界面）、overlay（覆盖层）、inline（行内）
 *
 * @example
 * ```vue
 * <ErrorBoundary @error="handleError" :show-stack="isDev">
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 *
 * @example
 * ```vue
 * <!-- 使用 overlay 模式 -->
 * <ErrorBoundary mode="overlay">
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 *
 * @example
 * ```vue
 * <!-- 自定义回退内容 -->
 * <ErrorBoundary>
 *   <MyComponent />
 *   <template #fallback="{ error, retry, reset }">
 *     <div>自定义错误界面: {{ error.message }}</div>
 *   </template>
 * </ErrorBoundary>
 * ```
 */

import {
  computed,
  defineComponent,
  h,
  onErrorCaptured,
  ref,
  Transition,
  type PropType,
  type VNode,
} from 'vue'
import type { ErrorInfo } from '@ldesign/error-core'
import { ErrorLevel, ErrorSource } from '@ldesign/error-core'
import { ErrorOverlay } from './ErrorOverlay'

/**
 * 错误边界显示模式
 * - full: 完整错误界面（默认）
 * - overlay: 红色覆盖层，保持原组件位置
 * - inline: 行内简短显示
 */
export type ErrorBoundaryMode = 'full' | 'overlay' | 'inline'

/** 生成错误 ID */
function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

/**
 * 错误边界组件
 */
export const ErrorBoundary = defineComponent({
  name: 'LErrorBoundary',

  props: {
    /**
     * 显示模式
     * - full: 完整错误界面（默认）
     * - overlay: 红色覆盖层，保持原组件位置
     * - inline: 行内简短显示
     */
    mode: {
      type: String as PropType<ErrorBoundaryMode>,
      default: 'full',
    },
    /** 是否显示错误详情 */
    showDetails: {
      type: Boolean as PropType<boolean>,
      default: true,
    },
    /** 是否显示堆栈（建议仅开发环境启用） */
    showStack: {
      type: Boolean as PropType<boolean>,
      default: false,
    },
    /** 是否可重试 */
    retryable: {
      type: Boolean as PropType<boolean>,
      default: true,
    },
    /** 最大重试次数 */
    maxRetries: {
      type: Number as PropType<number>,
      default: 3,
    },
    /** 自定义错误标题 */
    title: {
      type: String as PropType<string>,
      default: 'Oops! Something went wrong',
    },
    /** 自定义错误消息 */
    message: {
      type: String as PropType<string>,
      default: 'We encountered an unexpected error. Please try again.',
    },
    /** 是否显示图标 */
    showIcon: {
      type: Boolean as PropType<boolean>,
      default: true,
    },
    /** 主题色 */
    theme: {
      type: String as PropType<'light' | 'dark' | 'auto'>,
      default: 'light',
    },
    /** overlay 模式的最小高度 */
    overlayMinHeight: {
      type: String as PropType<string>,
      default: '80px',
    },
  },

  emits: {
    /** 错误事件 */
    error: (_error: ErrorInfo) => true,
    /** 重置事件 */
    reset: () => true,
    /** 重试事件 */
    retry: (_count: number) => true,
  },

  setup(props, { emit, slots }) {
    /** 是否有错误 */
    const hasError = ref(false)
    /** 错误信息 */
    const errorInfo = ref<ErrorInfo | null>(null)
    /** 重试次数 */
    const retryCount = ref(0)
    /** 是否展开详情 */
    const isExpanded = ref(false)

    /** 是否可以重试 */
    const canRetry = computed(() => {
      return props.retryable && retryCount.value < props.maxRetries
    })

    /** 捕获错误 */
    onErrorCaptured((error: Error, instance, info) => {
      hasError.value = true

      const componentName = instance?.$options?.name
        || instance?.$options?.__name
        || 'UnknownComponent'

      errorInfo.value = {
        id: generateErrorId(),
        name: error.name || 'Error',
        message: error.message || 'Unknown error',
        stack: error.stack,
        level: ErrorLevel.ERROR,
        source: ErrorSource.VUE,
        timestamp: Date.now(),
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        componentInfo: {
          name: componentName,
          tree: [componentName],
        },
        extra: {
          vueInfo: info,
        },
      }

      emit('error', errorInfo.value)

      // 阻止错误继续传播
      return false
    })

    /** 重试 */
    function handleRetry(): void {
      if (!canRetry.value) return

      retryCount.value++
      hasError.value = false
      errorInfo.value = null
      isExpanded.value = false

      emit('retry', retryCount.value)
    }

    /** 重置 */
    function handleReset(): void {
      hasError.value = false
      errorInfo.value = null
      retryCount.value = 0
      isExpanded.value = false

      emit('reset')
    }

    /** 切换详情展开 */
    function toggleExpand(): void {
      isExpanded.value = !isExpanded.value
    }

    /** 获取主题样式 */
    function getThemeStyles(): Record<string, string> {
      const isDark = props.theme === 'dark'
        || (props.theme === 'auto' && typeof window !== 'undefined'
          && window.matchMedia('(prefers-color-scheme: dark)').matches)

      return isDark ? darkTheme : lightTheme
    }

    /** 渲染错误图标 */
    function renderIcon(): VNode {
      return h('div', {
        class: 'l-error-boundary__icon',
        style: styles.icon,
        innerHTML: errorIconSvg,
      })
    }

    /** 渲染错误详情 */
    function renderDetails(err: ErrorInfo): VNode {
      const theme = getThemeStyles()

      return h('div', { class: 'l-error-boundary__details', style: styles.details }, [
        h('button', {
          class: 'l-error-boundary__toggle',
          style: { ...styles.toggle, color: theme.textSecondary },
          onClick: toggleExpand,
        }, [
          isExpanded.value ? 'Hide Details' : 'Show Details',
          h('span', {
            style: {
              marginLeft: '4px',
              transform: isExpanded.value ? 'rotate(180deg)' : 'rotate(0deg)',
              display: 'inline-block',
              transition: 'transform 0.2s ease',
            },
          }, '▼'),
        ]),

        h(Transition, { name: 'l-error-expand' }, () =>
          isExpanded.value
            ? h('div', {
              class: 'l-error-boundary__info',
              style: { ...styles.info, background: theme.infoBg },
            }, [
              renderInfoRow('Error', err.name),
              renderInfoRow('Message', err.message),
              err.componentInfo?.name
                ? renderInfoRow('Component', err.componentInfo.name)
                : null,
              renderInfoRow('Time', new Date(err.timestamp).toLocaleString()),

              props.showStack && err.stack
                ? h('div', { class: 'l-error-boundary__stack', style: styles.stack }, [
                  h('div', { style: styles.stackLabel }, 'Stack Trace'),
                  h('pre', { style: styles.stackPre }, err.stack),
                ])
                : null,
            ])
            : null,
        ),
      ])
    }

    /** 渲染信息行 */
    function renderInfoRow(label: string, value: string): VNode {
      return h('div', { style: styles.infoRow }, [
        h('span', { style: styles.infoLabel }, label),
        h('span', { style: styles.infoValue }, value),
      ])
    }

    /** 渲染操作按钮 */
    function renderActions(): VNode {
      return h('div', { class: 'l-error-boundary__actions', style: styles.actions }, [
        canRetry.value
          ? h('button', {
            class: 'l-error-boundary__btn l-error-boundary__btn--primary',
            style: styles.btnPrimary,
            onClick: handleRetry,
          }, [
            h('span', { innerHTML: retryIconSvg, style: styles.btnIcon }),
            `Retry (${retryCount.value}/${props.maxRetries})`,
          ])
          : null,
        h('button', {
          class: 'l-error-boundary__btn l-error-boundary__btn--secondary',
          style: styles.btnSecondary,
          onClick: handleReset,
        }, [
          h('span', { innerHTML: resetIconSvg, style: styles.btnIcon }),
          'Reset',
        ]),
      ])
    }

    /** 渲染 full 模式错误界面 */
    function renderFullErrorUI(): VNode {
      const err = errorInfo.value
      const theme = getThemeStyles()

      return h('div', {
        class: 'l-error-boundary',
        style: {
          ...styles.container,
          background: theme.background,
          borderColor: theme.border,
        },
      }, [
        h('div', { class: 'l-error-boundary__content', style: styles.content }, [
          // 错误图标
          props.showIcon ? renderIcon() : null,

          // 错误标题
          h('h3', {
            class: 'l-error-boundary__title',
            style: { ...styles.title, color: theme.title },
          }, props.title),

          // 错误消息
          h('p', {
            class: 'l-error-boundary__message',
            style: { ...styles.message, color: theme.text },
          }, props.message),

          // 错误详情
          props.showDetails && err ? renderDetails(err) : null,

          // 操作按钮
          renderActions(),
        ]),
      ])
    }

    /** 渲染 overlay 模式错误界面 */
    function renderOverlayUI(): VNode {
      const err = errorInfo.value
      if (!err) return h('div')

      return h(ErrorOverlay, {
        error: err,
        showRetry: props.retryable,
        showDetails: props.showDetails,
        retryCount: retryCount.value,
        maxRetries: props.maxRetries,
        minHeight: props.overlayMinHeight,
        onRetry: handleRetry,
        onDismiss: handleReset,
      })
    }

    /** 渲染 inline 模式错误界面 */
    function renderInlineUI(): VNode {
      const err = errorInfo.value
      const componentName = err?.componentInfo?.name || 'Component'

      return h('div', {
        class: 'l-error-boundary--inline',
        style: styles.inlineContainer,
      }, [
        h('span', { style: styles.inlineIcon }, '⚠'),
        h('span', { style: styles.inlineText }, [
          `${componentName} error: `,
          h('span', { style: styles.inlineMessage }, err?.message || 'Unknown error'),
        ]),
        canRetry.value
          ? h('button', {
              style: styles.inlineBtn,
              onClick: handleRetry,
            }, 'Retry')
          : null,
        h('button', {
          style: styles.inlineBtn,
          onClick: handleReset,
        }, 'Reset'),
      ])
    }

    /** 根据 mode 渲染错误界面 */
    function renderErrorUI(): VNode {
      switch (props.mode) {
        case 'overlay':
          return renderOverlayUI()
        case 'inline':
          return renderInlineUI()
        case 'full':
        default:
          return renderFullErrorUI()
      }
    }

    // 渲染函数
    return (): VNode | VNode[] | undefined => {
      if (!hasError.value) {
        return slots.default?.()
      }

      // 使用 fallback 插槽
      if (slots.fallback) {
        return slots.fallback({
          error: errorInfo.value,
          reset: handleReset,
          retry: handleRetry,
          canRetry: canRetry.value,
          retryCount: retryCount.value,
          mode: props.mode,
        })
      }

      // 根据模式渲染错误界面
      return renderErrorUI()
    }
  },
})

// ============================================================================
// 主题配置
// ============================================================================

const lightTheme = {
  background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
  border: '#fca5a5',
  title: '#b91c1c',
  text: '#7f1d1d',
  textSecondary: '#991b1b',
  infoBg: 'rgba(255, 255, 255, 0.9)',
}

const darkTheme = {
  background: 'linear-gradient(135deg, #1f1f23 0%, #2a2a2e 100%)',
  border: '#4b4b52',
  title: '#fca5a5',
  text: '#d1d5db',
  textSecondary: '#9ca3af',
  infoBg: 'rgba(0, 0, 0, 0.3)',
}

// ============================================================================
// 样式定义
// ============================================================================

const styles = {
  container: {
    position: 'relative' as const,
    minHeight: '120px',
    padding: '32px 24px',
    borderRadius: '12px',
    border: '1px solid',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflow: 'hidden',
  },
  content: {
    textAlign: 'center' as const,
    maxWidth: '480px',
    margin: '0 auto',
  },
  icon: {
    width: '64px',
    height: '64px',
    margin: '0 auto 16px',
    opacity: '0.9',
  },
  title: {
    margin: '0 0 8px',
    fontSize: '20px',
    fontWeight: '600',
    letterSpacing: '-0.02em',
  },
  message: {
    margin: '0 0 24px',
    fontSize: '14px',
    lineHeight: '1.6',
    opacity: '0.85',
  },
  details: {
    marginBottom: '24px',
    textAlign: 'left' as const,
  },
  toggle: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '500',
    background: 'transparent',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  info: {
    marginTop: '12px',
    padding: '16px',
    borderRadius: '8px',
    fontSize: '13px',
  },
  infoRow: {
    display: 'flex',
    marginBottom: '8px',
  },
  infoLabel: {
    flexShrink: '0',
    width: '80px',
    fontWeight: '500',
    opacity: '0.7',
  },
  infoValue: {
    flex: '1',
    wordBreak: 'break-word' as const,
  },
  stack: {
    marginTop: '12px',
  },
  stackLabel: {
    fontSize: '12px',
    fontWeight: '500',
    marginBottom: '8px',
    opacity: '0.7',
  },
  stackPre: {
    margin: '0',
    padding: '12px',
    background: '#18181b',
    color: '#a1a1aa',
    borderRadius: '6px',
    fontSize: '11px',
    lineHeight: '1.5',
    overflowX: 'auto' as const,
    maxHeight: '180px',
  },
  actions: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
    flexWrap: 'wrap' as const,
  },
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '500',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    background: '#dc2626',
    color: '#fff',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)',
  },
  btnSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '500',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    cursor: 'pointer',
    background: 'transparent',
    color: '#6b7280',
    transition: 'all 0.2s ease',
  },
  btnIcon: {
    width: '16px',
    height: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Inline 模式样式
  inlineContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    background: 'linear-gradient(90deg, #fef2f2 0%, #fee2e2 100%)',
    borderRadius: '6px',
    border: '1px solid #fca5a5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '13px',
    color: '#7f1d1d',
    flexWrap: 'wrap' as const,
  },
  inlineIcon: {
    color: '#dc2626',
    fontSize: '14px',
    flexShrink: '0',
  },
  inlineText: {
    flex: '1',
    minWidth: '0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  inlineMessage: {
    opacity: '0.85',
  },
  inlineBtn: {
    padding: '3px 8px',
    fontSize: '11px',
    fontWeight: '500',
    color: '#b91c1c',
    background: '#fff',
    border: '1px solid #fca5a5',
    borderRadius: '4px',
    cursor: 'pointer',
    flexShrink: '0',
    transition: 'all 0.15s',
  },
}

// ============================================================================
// SVG 图标
// ============================================================================

const errorIconSvg = `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="32" cy="32" r="28" fill="#fef2f2" stroke="#fca5a5" stroke-width="2"/>
  <path d="M32 18v18" stroke="#ef4444" stroke-width="4" stroke-linecap="round"/>
  <circle cx="32" cy="44" r="3" fill="#ef4444"/>
</svg>`

const retryIconSvg = `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"/><path fill-rule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"/></svg>`

const resetIconSvg = `<svg viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/><path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/></svg>`

export default ErrorBoundary

