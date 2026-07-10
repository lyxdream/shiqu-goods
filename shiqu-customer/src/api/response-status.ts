import type { AxiosResponse } from 'axios'
import { showToast } from 'vant'
import type { ApiResponse } from '@/types'
import { ResponseCode } from '@/constants/response-code'
import { tokenStorage } from '@/utils/storage'
import router from '@/router'

export function responseStatusCallback(response: AxiosResponse<ApiResponse>) {
  const { code, message } = response.data
  const errorCustom = response.config.errorCustom

  if (code === ResponseCode.UNAUTHORIZED) {
    tokenStorage.remove()
    router.push({ name: 'Login' })
    showToast(message || '登录已过期，请重新登录')
    return Promise.reject(response.data)
  }

  if (errorCustom) {
    return Promise.reject(response.data)
  }

  showToast(message || '请求失败')
  return Promise.reject(response.data)
}
