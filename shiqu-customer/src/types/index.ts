export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

export interface LoginResult {
  accessToken: string
}

export interface UserProfile {
  id: number
  username: string
  nickname: string
  avatar: string
  phone: string
  status: 'enabled' | 'disabled'
  createdAt: string
  updatedAt: string
}

export interface Address {
  id: number
  userId: number
  contactName: string
  phone: string
  address: string
  createdAt: string
  updatedAt: string
}

export interface Product {
  id: number
  name: string
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
  productName: string
  quantity: number
  unitPrice: number
}

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'picked_up'
  | 'cancelled'

export interface Order {
  id: number
  userId: number
  contactName: string
  contactPhone: string
  pickupAddress: string
  totalAmount: number
  status: OrderStatus
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}

export interface UploadResult {
  url: string
  filename: string
}
