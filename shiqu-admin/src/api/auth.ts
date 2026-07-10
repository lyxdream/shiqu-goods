import request from './request'
import type { LoginResult } from '@/types'

export function login(data: { username: string; password: string }) {
  return request.post<never, LoginResult>('/api/admin/auth/login', data)
}
