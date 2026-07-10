import request from './request'

export function aiChat(data: { message: string; sessionId?: string }) {
  return request.post<never, unknown>('/api/ai/chat', data)
}

export function aiParseDocument(data: { content: string; prompt?: string }) {
  return request.post<never, unknown>('/api/ai/document', data)
}
