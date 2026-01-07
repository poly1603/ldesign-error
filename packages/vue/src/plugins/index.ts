/**
 * Error 引擎插件导出
 */
export {
  createErrorEnginePlugin,
  getErrorCatcherInstance,
  getErrorReporterInstance,
} from './engine-plugin'
export type { ErrorEnginePluginOptions } from './engine-plugin'

export {
  TrackerIntegration,
  createTrackerIntegration,
} from './tracker-integration'
export type {
  TrackerEvent,
  TrackerLike,
  TrackerIntegrationOptions,
} from './tracker-integration'

