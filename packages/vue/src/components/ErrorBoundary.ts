/**
 * 错误边界组件
 * @description 捕获子组件错误并显示友好的错误界面
 * @example
 * ```vue
 * <ErrorBoundary @error="handleError" :show-stack="isDev">
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */

import { defineComponent, h, onErrorCaptured, ref, computed, type PropType, type VNode } from 'vue'
import type { ErrorInfo } from '@ldesign/error-core'
import { ErrorLevel, ErrorSource } from '@ldesign/error-core'

/** 生成错误 ID */
function generateId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

/**
 * 错误边界组件
 */
export const ErrorBoundary = defineComponent({
  name: 'ErrorBoundary',

  props: {
    /** 是否显示错误详情 */
    showDetails: {
      type: Boolean as PropType<boolean>,
      default: true,
    },
    /** 是否显示堆栈 */
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
    errorTitle: {
      type: String as PropType<string>,
      default: '组件发生错误',
    },
    /** 自定义错误消息 */
    errorMessage: {
      type: String as PropType<string>,
      default: '抱歉，该组件遇到了问题',
    },
  },

  emits: {
    error: (_error: ErrorInfo) => true,
    reset: () => true,
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

      const componentName = instance?.$options?.name || instance?.$options?.__name || '未知组件'

      errorInfo.value = {
        id: generateId(),
        name: error.name,
        message: error.message,
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
      if (!canRetry.value)
        return

      retryCount.value++
      hasError.value = false
      errorInfo.value = null

      emit('retry', retryCount.value)
    }

    /** 重置 */
    function handleReset(): void {
      hasError.value = false
      errorInfo.value = null
      retryCount.value = 0

      emit('reset')
    }

    /** 切换详情展开 */
    function toggleExpand(): void {
      isExpanded.value = !isExpanded.value
    }

    /** 渲染错误界面 */
    function renderErrorUI(): VNode {
      const err = errorInfo.value

      return h('div', { class: 'error-boundary', style: errorBoundaryStyles.container }, [
        h('div', { class: 'error-boundary__content', style: errorBoundaryStyles.content }, [
          // 错误图标
          h('div', { class: 'error-boundary__icon', style: errorBoundaryStyles.icon }, '❌'),

          // 错误标题
          h('h3', { class: 'error-boundary__title', style: errorBoundaryStyles.title }, props.errorTitle),

          // 错误消息
          h('p', { class: 'error-boundary__message', style: errorBoundaryStyles.message }, props.errorMessage),

          // 错误详情
          props.showDetails && err
            ? renderDetails(err)
            : null,

          // 操作按钮
          renderActions(),
        ]),
      ])
    }

    /** 渲染详情 */
    function renderDetails(err: ErrorInfo): VNode {
      return h('div', { class: 'error-boundary__details', style: errorBoundaryStyles.details }, [
        h('button', {
          class: 'error-boundary__toggle',
          style: errorBoundaryStyles.toggle,
          onClick: toggleExpand,
        }, isExpanded.value ? '收起详情 ▲' : '查看详情 ▼'),

        isExpanded.value
          ? h('div', { class: 'error-boundary__info', style: errorBoundaryStyles.info }, [
            h('p', null, [h('strong', null, '错误名称: '), err.name]),
            h('p', null, [h('strong', null, '错误消息: '), err.message]),
            err.componentInfo?.name
              ? h('p', null, [h('strong', null, '组件: '), err.componentInfo.name])
              : null,
            h('p', null, [h('strong', null, '时间: '), new Date(err.timestamp).toLocaleString()]),

            // 堆栈信息
            props.showStack && err.stack
              ? h('div', { class: 'error-boundary__stack', style: errorBoundaryStyles.stack }, [
                h('strong', null, '堆栈:'),
                h('pre', { style: errorBoundaryStyles.stackPre }, err.stack),
              ])
              : null,
          ])
          : null,
      ])
    }

    /** 渲染操作按钮 */
    function renderActions(): VNode {
      return h('div', { class: 'error-boundary__actions', style: errorBoundaryStyles.actions }, [
        canRetry.value
          ? h('button', {
            class: 'error-boundary__btn error-boundary__btn--retry',
            style: errorBoundaryStyles.btnRetry,
            onClick: handleRetry,
          }, `重试 (${retryCount.value}/${props.maxRetries})`)
          : null,
        h('button', {
          class: 'error-boundary__btn error-boundary__btn--reset',
          style: errorBoundaryStyles.btnReset,
          onClick: handleReset,
        }, '重置'),
      ])
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
        })
      }

      // 默认错误界面
      return renderErrorUI()
    }
  },
})

/** 内联样式 */
const errorBoundaryStyles = {
  container: {
    position: 'relative' as const,
    minHeight: '100px',
    padding: '20px',
    background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
    border: '2px solid #ef4444',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
  },
  content: {
    textAlign: 'center' as const,
  },
  icon: {
    fontSize: '48px',
    marginBottom: '12px',
  },
  title: {
    margin: '0 0 8px',
    fontSize: '18px',
    fontWeight: '600',
    color: '#dc2626',
  },
  message: {
    margin: '0 0 16px',
    fontSize: '14px',
    color: '#7f1d1d',
  },
  details: {
    marginBottom: '16px',
    textAlign: 'left' as const,
  },
  toggle: {
    display: 'inline-block',
    padding: '4px 12px',
    fontSize: '12px',
    color: '#dc2626',
    background: 'transparent',
    border: '1px solid #dc2626',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  info: {
    marginTop: '12px',
    padding: '12px',
    background: 'rgba(255, 255, 255, 0.8)',
    borderRadius: '4px',
    fontSize: '13px',
    color: '#374151',
  },
  stack: {
    marginTop: '8px',
  },
  stackPre: {
    margin: '8px 0 0',
    padding: '8px',
    background: '#1f2937',
    color: '#f3f4f6',
    borderRadius: '4px',
    fontSize: '11px',
    overflowX: 'auto' as const,
    maxHeight: '200px',
  },
  actions: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
  },
  btnRetry: {
    padding: '8px 20px',
    fontSize: '14px',
    fontWeight: '500',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    background: '#dc2626',
    color: '#fff',
  },
  btnReset: {
    padding: '8px 20px',
    fontSize: '14px',
    fontWeight: '500',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    background: '#6b7280',
    color: '#fff',
  },
}

export default ErrorBoundary

