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
  stock: number
  image: string
  description: string | null
  status: 'on_sale' | 'off_sale'
  createdAt: string
  updatedAt: string
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
