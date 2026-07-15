import request from './request'
import type { AdminAuditLog, PageResult } from '@/types'

export interface AuditLogListQuery {
  pageNum: number
  pageSize: number
  action: string
  targetType: string
  adminUsername: string
}

export function getAuditLogList(params: Partial<AuditLogListQuery>) {
  return request.get<never, PageResult<AdminAuditLog>>('/api/admin/audit-logs', {
    params,
  })
}
