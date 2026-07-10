import request from './request'
import type { Order, PageResult } from '@/types'

export interface OrderListQuery {
  pageNum: number
  pageSize: number
  status: string
}

export function getOrderList(params: Partial<OrderListQuery>) {
  return request.get<never, PageResult<Order>>('/api/admin/orders', {
    params,
  })
}

export function getOrderDetail(id: number) {
  return request.get<never, Order>(`/api/admin/orders/${id}`)
}

export function updateOrderStatus(id: number, status: Order['status']) {
  return request.patch<never, Order>(`/api/admin/orders/${id}/status`, {
    status,
  })
}
