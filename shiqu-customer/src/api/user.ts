import request from './request'
import type { UserProfile } from '@/types'

export function getProfile() {
  return request.get<never, UserProfile>('/api/user/profile')
}

export function updateProfile(
  data: Partial<Pick<UserProfile, 'nickname' | 'avatar' | 'phone'>>,
) {
  return request.put<never, UserProfile>('/api/user/profile', data)
}

export function updatePassword(data: {
  oldPassword: string
  newPassword: string
}) {
  return request.put<never, null>('/api/user/password', data)
}
