import axios from 'axios'
import { ElMessage } from 'element-plus'
import type { ApiResponse } from '@/types'
import { SUCCESS_CODES } from '@/constants/response-code'
import { tokenStorage } from '@/utils/storage'
import { responseStatusCallback } from './response-status'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 15000,
})

request.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // 空字符串不要传给后端，否则 @IsOptional + @IsEnum 会校验失败
  if (config.params && typeof config.params === 'object') {
    const cleaned: Record<string, unknown> = {}
    Object.entries(config.params as Record<string, unknown>).forEach(
      ([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          cleaned[key] = value
        }
      },
    )
    config.params = cleaned
  }

  return config
})

request.interceptors.response.use(
  (response) => {
    const { code, data } = response.data as ApiResponse
    if (SUCCESS_CODES.includes(code as (typeof SUCCESS_CODES)[number])) {
      return data as never
    }
    return responseStatusCallback(response)
  },
  (error) => {
    const message = error.message || '网络异常'
    ElMessage.error(message)
    return Promise.reject(error)
  },
)

export default request
