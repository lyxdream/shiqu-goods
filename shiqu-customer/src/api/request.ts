import axios from 'axios'
import { showToast } from 'vant'
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
    let message = '网络异常，请稍后重试'
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      message = '请求超时，请检查网络后重试'
    } else if (error.message === 'Network Error') {
      message = '网络连接失败，请检查网络'
    }
    showToast(message)
    return Promise.reject(error)
  },
)

export default request
