import request from './request'
import type { Product } from '@/types'

export function getProductList() {
  return request.get<never, Product[]>('/api/products')
}

export function getProductDetail(id: number) {
  return request.get<never, Product>(`/api/products/${id}`)
}
