import request from './request'
import type { Address } from '@/types'

export function getAddressList() {
  return request.get<never, Address[]>('/api/addresses')
}

export function createAddress(
  data: Pick<Address, 'contactName' | 'phone' | 'address'>,
) {
  return request.post<never, Address>('/api/addresses', data)
}

export function updateAddress(
  id: number,
  data: Partial<Pick<Address, 'contactName' | 'phone' | 'address'>>,
) {
  return request.put<never, Address>(`/api/addresses/${id}`, data)
}

export function deleteAddress(id: number) {
  return request.delete<never, null>(`/api/addresses/${id}`)
}
