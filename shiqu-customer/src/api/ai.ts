import request from './request'

export type AiScene =
  | 'product_qa'
  | 'order_help'
  | 'assistant'
  | 'product_recommend'
  | 'grass_copy'
  | 'purchase_list'

export interface AiChatPayload {
  message: string
  sessionId?: string
  scene?: AiScene
  productId?: number
  orderId?: number
}

export interface AiProductBrief {
  id: number
  name: string
  price: number | null
}

export interface AiChatResult {
  reply: string
  sessionId?: string
  scene?: string
  productIds?: number[]
  products?: AiProductBrief[]
}

export function aiChat(data: AiChatPayload) {
  return request.post<never, AiChatResult>('/api/ai/chat', data)
}

export function aiParseDocument(data: { content: string; prompt?: string }) {
  return request.post<never, { reply?: string; available?: boolean }>(
    '/api/ai/document',
    data,
  )
}
