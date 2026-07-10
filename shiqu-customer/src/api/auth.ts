import request from './request'
import type { LoginResult } from '@/types'

export function register(data: {
  username: string
  phone: string
  password: string
  confirmPassword: string
}) {
  return request.post<never, LoginResult>('/api/auth/register', data)
}

export function login(data: { username: string; password: string }) {
  return request.post<never, LoginResult>('/api/auth/login', data)
}

export function forgotPassword(data: {
  username: string
  phone: string
  newPassword: string
  confirmPassword: string
}) {
  return request.post<never, null>('/api/auth/forgot-password', data)
}
