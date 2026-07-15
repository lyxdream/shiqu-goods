import request from './request'
import type { PageResult, Product } from '@/types'

export function getProductList(params?: { pageNum?: number; pageSize?: number }) {
  return request.get<never, PageResult<Product>>('/api/products', {
    params,
    errorCustom: true,
  })
}

export function getProductDetail(id: number) {
  return request.get<never, Product>(`/api/products/${id}`)
}
