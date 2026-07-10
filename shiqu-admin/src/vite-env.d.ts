/// <reference types="vite/client" />

import 'axios'

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
