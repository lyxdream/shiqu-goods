import type { Order, Product, AdminUser } from '@/types'

type StatusMeta = {
  label: string
  tagType: 'success' | 'warning' | 'info' | 'danger'
}

export const USER_STATUS_MAP: Record<AdminUser['status'], StatusMeta> = {
  enabled: { label: '启用', tagType: 'success' },
  disabled: { label: '禁用', tagType: 'danger' },
}

export const PRODUCT_STATUS_MAP: Record<Product['status'], StatusMeta> = {
  on_sale: { label: '上架', tagType: 'success' },
  off_sale: { label: '下架', tagType: 'info' },
}

export const ORDER_STATUS_MAP: Record<Order['status'], StatusMeta> = {
  pending_payment: { label: '待付款', tagType: 'warning' },
  paid: { label: '已付款', tagType: 'success' },
  picked_up: { label: '已自提', tagType: 'info' },
  cancelled: { label: '已取消', tagType: 'danger' },
}

function toOptions<T extends string>(map: Record<T, StatusMeta>) {
  return (Object.entries(map) as [T, StatusMeta][]).map(([value, item]) => ({
    value,
    label: item.label,
  }))
}

export const USER_STATUS_OPTIONS = toOptions(USER_STATUS_MAP)
export const PRODUCT_STATUS_OPTIONS = toOptions(PRODUCT_STATUS_MAP)
export const ORDER_STATUS_OPTIONS = toOptions(ORDER_STATUS_MAP)

export function getUserStatusMeta(status: string) {
  return USER_STATUS_MAP[status as AdminUser['status']]
}

export function getProductStatusMeta(status: string) {
  return PRODUCT_STATUS_MAP[status as Product['status']]
}

export function getOrderStatusMeta(status: string) {
  return ORDER_STATUS_MAP[status as Order['status']]
}
