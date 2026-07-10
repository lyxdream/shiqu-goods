import type { OrderStatus } from '@/types'

export const ORDER_STATUS_MAP: Record<
  OrderStatus,
  { label: string; type: 'primary' | 'success' | 'warning' | 'danger' }
> = {
  pending_payment: { label: '待付款', type: 'warning' },
  paid: { label: '已付款', type: 'success' },
  picked_up: { label: '已自提', type: 'primary' },
  cancelled: { label: '已取消', type: 'danger' },
}

export function getOrderStatusMeta(status: string) {
  return ORDER_STATUS_MAP[status as OrderStatus]
}
