/** 与后端一致：仅 HTTP 200 响应体中的 body.code（404/405/5xx 走 axios error 分支，不在此列） */
export const SUCCESS_CODES = [0, 1000] as const

export const ResponseCode = {
  UNAUTHORIZED: 401,
  VALIDATION_ERROR: 400,
  INVALID_CREDENTIALS: 1001,
  FORBIDDEN: 403,
  NOT_FOUND: 1005,
  RATE_LIMITED: 1008,
} as const
