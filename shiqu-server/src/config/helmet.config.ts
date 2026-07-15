import type { HelmetOptions } from 'helmet';

/**
 * Helmet 安全响应头配置。
 * - CSP：Swagger 开启时关闭，避免 /api-docs 白屏
 * - HSTS：仅生产环境开启
 * - CORP：cross-origin，便于 C 端跨域加载 /uploads 图片
 */
export function getHelmetOptions(
  isProduction: boolean,
  swaggerEnabled: boolean,
): HelmetOptions {
  return {
    contentSecurityPolicy: swaggerEnabled ? false : undefined,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    strictTransportSecurity: isProduction
      ? { maxAge: 31_536_000, includeSubDomains: true }
      : false,
  };
}
