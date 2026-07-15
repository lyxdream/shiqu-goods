export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

export interface PageResult<T> {
  list: T[]
  total: number
  pageNum: number
  pageSize: number
}

export interface LoginResult {
  accessToken: string
}

export interface AdminUser {
  id: number
  username: string
  nickname: string
  avatar: string
  phone: string
  status: 'enabled' | 'disabled'
  createdAt: string
  updatedAt: string
}

export interface Product {
  id: number
  /** 商品编号（12 位展示号） */
  productNo: string
  name: string
  /** 价格（元），API 层与展示单位 */
  price: number
  /** 可售库存（C 端下单依据） */
  stock: number
  image: string
  description: string | null
  status: 'on_sale' | 'off_sale'
  createdAt: string
  updatedAt: string
  /** 管理端：待付款预占 */
  pendingReserved?: number
  /** 管理端：已付款待自提预占 */
  paidReserved?: number
  /** 管理端：预占合计 */
  reservedStock?: number
  /** 管理端：实物库存（可售 + 预占） */
  physicalStock?: number
}

export interface OrderItem {
  id: number
  productId: number
  productNo?: string
  productName: string
  quantity: number
  /** 成交单价（元） */
  unitPrice: number
}

export interface Order {
  id: number
  /** 订单号（19 位展示号） */
  orderNo: string
  userId: number
  contactName: string
  contactPhone: string
  pickupAddress: string
  /** 订单总金额（元） */
  totalAmount: number
  status: 'pending_payment' | 'paid' | 'picked_up' | 'cancelled'
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}

export interface UploadResult {
  url: string
  filename: string
}

export interface AdminAuditLog {
  id: number
  adminId: number
  adminUsername: string
  action: string
  targetType: string
  targetId: number
  targetLabel: string
  detail: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}
