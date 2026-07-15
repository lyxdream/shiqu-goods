import { getProductStatusMeta } from '@/constants/status'

export const AUDIT_ACTION_MAP = {
  'product.delete': { label: '删除商品', tagType: 'danger' as const },
} as const

export const AUDIT_TARGET_MAP = {
  product: { label: '商品' },
} as const

export const AUDIT_ACTION_OPTIONS = Object.entries(AUDIT_ACTION_MAP).map(
  ([value, item]) => ({
    value,
    label: item.label,
  }),
)

export const AUDIT_TARGET_OPTIONS = Object.entries(AUDIT_TARGET_MAP).map(
  ([value, item]) => ({
    value,
    label: item.label,
  }),
)

export function getAuditActionMeta(action: string) {
  return (
    AUDIT_ACTION_MAP[action as keyof typeof AUDIT_ACTION_MAP] ?? {
      label: action,
      tagType: 'info' as const,
    }
  )
}

export function getAuditTargetMeta(targetType: string) {
  return (
    AUDIT_TARGET_MAP[targetType as keyof typeof AUDIT_TARGET_MAP] ?? {
      label: targetType,
    }
  )
}

export function formatAuditDetail(
  action: string,
  detail: Record<string, unknown> | null,
) {
  if (!detail) return '无'

  if (action === 'product.delete') {
    const lines = [
      detail.productNo ? `商品编号：${detail.productNo}` : '',
      detail.name ? `商品名称：${detail.name}` : '',
      detail.price !== undefined ? `价格：¥${detail.price}` : '',
      detail.stock !== undefined ? `库存：${detail.stock}` : '',
      detail.status
        ? `状态：${getProductStatusMeta(String(detail.status)).label}`
        : '',
    ].filter(Boolean)
    return lines.join('\n')
  }

  return JSON.stringify(detail, null, 2)
}
