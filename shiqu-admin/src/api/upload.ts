import request from './request'
import type { UploadResult } from '@/types'

export function uploadImage(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return request.post<never, UploadResult>('/api/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
