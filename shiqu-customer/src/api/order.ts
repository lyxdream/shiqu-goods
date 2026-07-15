import request from './request'
import type { Order, PageResult } from '@/types'
import type { OrderStatus } from '@/types'

export function createOrder(data: {
  productId: number
  quantity: number
  addressId: number
}) {
  return request.post<never, Order>('/api/orders', data)
}

export function payOrder(id: number) {
  return request.post<never, Order>(`/api/orders/${id}/pay`)
}

export function cancelOrder(id: number) {
  return request.post<never, Order>(`/api/orders/${id}/cancel`)
}

export function getOrderList(params?: { pageNum?: number; pageSize?: number; status?: OrderStatus }) {
  return request.get<never, PageResult<Order>>('/api/orders', {
    params,
    errorCustom: true,
  })
}

export function getOrderDetail(id: number) {
  return request.get<never, Order>(`/api/orders/${id}`)
}
