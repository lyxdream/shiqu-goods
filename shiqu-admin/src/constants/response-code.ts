/** 与后端 ResponseCode 保持一致 */
export const SUCCESS_CODES = [0, 1000] as const

export const ResponseCode = {
  UNAUTHORIZED: 401,
  INVALID_CREDENTIALS: 1001,
} as const
