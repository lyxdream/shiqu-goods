import axios from 'axios'
import { ElMessage } from 'element-plus'
import type { ApiResponse } from '@/types'
import { tokenStorage } from '@/utils/storage'
import router from '@/router'

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
    const res = response.data as ApiResponse
    if (res.code !== 200) {
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res.data as never
  },
  (error) => {
    const status = error.response?.status
    const message =
      error.response?.data?.message || error.message || '网络异常'

    if (status === 401) {
      tokenStorage.remove()
      router.push({ name: 'Login' })
      ElMessage.error('登录已过期，请重新登录')
    } else {
      ElMessage.error(message)
    }

    return Promise.reject(error)
  },
)

export default request
