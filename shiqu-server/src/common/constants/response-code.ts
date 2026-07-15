/** 成功 */
export const ResponseCode = {
  SUCCESS: 0,
  SUCCESS_ALT: 1000,

  /** token 过期、无效、未登录 */
  UNAUTHORIZED: 401,

  /** 用户名或密码错误 */
  INVALID_CREDENTIALS: 1001,
  /** 参数校验 / 请求不合法 */
  VALIDATION_ERROR: 1002,
  /** 账号已禁用 */
  ACCOUNT_DISABLED: 1003,
  /** 资源已存在 */
  ALREADY_EXISTS: 1004,
  /** 资源不存在 */
  NOT_FOUND: 1005,
  /** 业务规则不满足 */
  BUSINESS_ERROR: 1006,
  /** 无权限 */
  FORBIDDEN: 1007,

  INTERNAL_ERROR: 1099,
} as const;

export type ResponseCodeValue =
  (typeof ResponseCode)[keyof typeof ResponseCode];

export const SUCCESS_CODES: number[] = [
  ResponseCode.SUCCESS,
  ResponseCode.SUCCESS_ALT,
];

export function isSuccessCode(code: number): boolean {
  return SUCCESS_CODES.includes(code);
}
