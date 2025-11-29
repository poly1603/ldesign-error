/**
 * Error Engine Plugin
 *
 * 将错误处理功能集成到 LDesign Engine
 *
 * @example
 * ```ts
 * import { createVueEngine } from '@ldesign/engine-vue3'
 * import { createErrorEnginePlugin } from '@ldesign/error-vue/plugins'
 *
 * const engine = createVueEngine({
 *   plugins: [
 *     createErrorEnginePlugin({
 *       enabled: true,
 *       catcher: { maxBreadcrumbs: 50 },
 *       reporter: { endpoint: '/api/errors' },
 *     })
 *   ]
 * })
 * ```
 */
import type { App } from 'vue'
import type { ErrorCatcher, ErrorReporter } from '@ldesign/error-core'
import type { ErrorPluginOptions } from '../plugin/error-plugin'
import { createErrorPlugin } from '../plugin/error-plugin'

/** 引擎类型接口 */
interface EngineLike {
  getApp?: () => App | null
  events?: {
    on: (event: string, handler: (...args: unknown[]) => void) => void
    emit: (event: string, payload?: unknown) => void
    once: (event: string, handler: (...args: unknown[]) => void) => void
  }
  api?: {
    register: (api: unknown) => void
    get: (name: string) => unknown
  }
}

/** 插件上下文 */
interface PluginContext {
  engine?: EngineLike
}

/** 插件接口 */
interface Plugin {
  name: string
  version: string
  dependencies?: string[]
  install: (context: PluginContext | EngineLike) => void | Promise<void>
  uninstall?: (context: PluginContext | EngineLike) => void | Promise<void>
}

/**
 * Error Engine 插件选项
 */
export interface ErrorEnginePluginOptions extends ErrorPluginOptions {
  /** 插件名称（引擎插件标识）@default 'error' */
  pluginName?: string
  /** 插件版本 @default '1.0.0' */
  pluginVersion?: string
  /** 是否启用调试模式 @default false */
  debug?: boolean
}

/** 错误捕获器实例缓存 */
let catcherInstance: ErrorCatcher | null = null
/** 错误上报器实例缓存 */
let reporterInstance: ErrorReporter | null = null

/**
 * 创建 Error Engine 插件
 *
 * @param options - 插件配置选项
 * @returns Engine 插件实例
 */
export function createErrorEnginePlugin(
  options: ErrorEnginePluginOptions = {},
): Plugin {
  const {
    pluginName = 'error',
    pluginVersion = '1.0.0',
    debug = false,
    ...errorOptions
  } = options

  // Vue 插件安装标志
  let vueInstalled = false

  if (debug) {
    console.log('[Error Plugin] createErrorEnginePlugin called with options:', options)
  }

  // 创建 Vue 插件
  const vuePlugin = createErrorPlugin(errorOptions)

  return {
    name: pluginName,
    version: pluginVersion,
    dependencies: [],

    async install(context: PluginContext | EngineLike) {
      const engine = (context as PluginContext).engine || (context as EngineLike)

      if (debug) {
        console.log('[Error Plugin] install called, engine:', !!engine)
      }

      // 注册 Error API 到 API 注册表
      if (engine?.api?.register) {
        const errorAPI = {
          name: 'error',
          version: pluginVersion,
          getCatcher: () => catcherInstance,
          getReporter: () => reporterInstance,
        }
        engine.api.register(errorAPI)
      }

      // 安装 Vue 插件
      const installVuePlugin = (app: App): void => {
        if (vueInstalled) return
        vueInstalled = true

        // 使用 Vue 插件的 install 方法
        vuePlugin.install(app)

        if (debug) {
          console.log('[Error Plugin] Vue 插件已安装')
        }
      }

      // 尝试立即安装到 Vue
      const vueApp = engine?.getApp?.()
      if (vueApp) {
        installVuePlugin(vueApp)
      }
      else {
        // 等待 Vue 应用创建
        engine?.events?.once?.('app:created', (payload: unknown) => {
          const app = (payload as { app?: App })?.app
          if (app) installVuePlugin(app)
        })
      }
    },

    async uninstall(_context: PluginContext | EngineLike) {
      vueInstalled = false
      catcherInstance = null
      reporterInstance = null

      if (debug) {
        console.log('[Error Plugin] uninstall called')
      }
    },
  }
}

/**
 * 获取当前错误捕获器实例
 */
export function getErrorCatcherInstance(): ErrorCatcher | null {
  return catcherInstance
}

/**
 * 获取当前错误上报器实例
 */
export function getErrorReporterInstance(): ErrorReporter | null {
  return reporterInstance
}

