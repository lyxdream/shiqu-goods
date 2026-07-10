import request from './request'
import type { Order } from '@/types'

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

export function getOrderList() {
  return request.get<never, Order[]>('/api/orders')
}

export function getOrderDetail(id: number) {
  return request.get<never, Order>(`/api/orders/${id}`)
}
