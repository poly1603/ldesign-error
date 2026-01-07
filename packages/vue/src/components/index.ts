/**
 * Vue 错误组件
 * @packageDocumentation
 */

export { ErrorBoundary, type ErrorBoundaryMode } from './ErrorBoundary'
export { ErrorFallback } from './ErrorFallback'
export type { ErrorFallbackProps } from './ErrorFallback'
export { ErrorOverlay } from './ErrorOverlay'
export type { ErrorOverlayProps } from './ErrorOverlay'
export {
  ErrorToastContainer,
  ErrorToastItem,
  addErrorToast,
  removeErrorToast,
  clearAllToasts,
  getToastQueue,
  setToastManagerOptions,
  injectToastStyles,
} from './ErrorToast'
export type { ToastItem, ToastManagerOptions } from './ErrorToast'

