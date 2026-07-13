import request from './request'

export type AiScene = 'product_qa' | 'order_help' | 'assistant'

export interface AiChatPayload {
  message: string
  sessionId?: string
  scene?: AiScene
  productId?: number
  orderId?: number
}

export interface AiChatResult {
  reply: string
  sessionId?: string
  scene?: string
  productIds?: number[]
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
