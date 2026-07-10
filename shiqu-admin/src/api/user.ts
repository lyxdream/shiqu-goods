import request from './request'
import type { AdminUser, PageResult } from '@/types'

export interface UserListQuery {
  pageNum: number
  pageSize: number
  username: string
  status: string
}

export function getUserList(params: Partial<UserListQuery>) {
  return request.get<never, PageResult<AdminUser>>('/api/admin/users', {
    params,
  })
}

export function getUserDetail(id: number) {
  return request.get<never, AdminUser>(`/api/admin/users/${id}`)
}

export function updateUser(
  id: number,
  data: Partial<Pick<AdminUser, 'nickname' | 'avatar' | 'phone' | 'status'>>,
) {
  return request.put<never, AdminUser>(`/api/admin/users/${id}`, data)
}

export function updateUserStatus(id: number, status: AdminUser['status']) {
  return request.patch<never, AdminUser>(`/api/admin/users/${id}/status`, {
    status,
  })
}
