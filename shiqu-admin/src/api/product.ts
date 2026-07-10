import request from './request'
import type { PageResult, Product } from '@/types'

export interface ProductListQuery {
  pageNum: number
  pageSize: number
  name: string
  status: string
}

export function getProductList(params: Partial<ProductListQuery>) {
  return request.get<never, PageResult<Product>>('/api/admin/products', {
    params,
  })
}

export function getProductDetail(id: number) {
  return request.get<never, Product>(`/api/admin/products/${id}`)
}

export function createProduct(data: Partial<Product>) {
  return request.post<never, Product>('/api/admin/products', data)
}

export function updateProduct(id: number, data: Partial<Product>) {
  return request.put<never, Product>(`/api/admin/products/${id}`, data)
}

export function updateProductStatus(id: number, status: Product['status']) {
  return request.patch<never, Product>(`/api/admin/products/${id}/status`, {
    status,
  })
}

export function deleteProduct(id: number) {
  return request.delete<never, { message: string }>(
    `/api/admin/products/${id}`,
  )
}
