/// <reference types="vite/client" />

import 'vue-router'
import 'axios'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    public?: boolean
  }
}

declare module 'axios' {
  export interface AxiosRequestConfig {
    /** 为 true 时不自动 toast，由调用方处理错误 */
    errorCustom?: boolean
  }
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface WeixinJSBridge {
  invoke: (method: string, params?: Record<string, unknown>) => void
  on: (event: string, callback: () => void) => void
}

interface Window {
  WeixinJSBridge?: WeixinJSBridge
}
