import { registerAs } from '@nestjs/config';

const isProd = process.env.NODE_ENV === 'production';

function requireSecret(name: string, fallback: string) {
  const value = process.env[name];
  if (value) return value;
  if (isProd) {
    throw new Error(`生产环境必须配置 ${name}`);
  }
  return fallback;
}

const JWT_EXPIRES_IN_DAYS = parseInt(process.env.JWT_EXPIRES_IN_DAYS || '7', 10);

export default registerAs('jwt', () => ({
  secret: requireSecret('JWT_SECRET', 'shiqu-user-jwt-secret'),
  expiresIn: `${JWT_EXPIRES_IN_DAYS}d`,
  expiresInSeconds: JWT_EXPIRES_IN_DAYS * 24 * 3600,
  /** Token 白名单 Key 兜底 TTL（秒），默认 30 天，防止长期不活跃用户数据堆积 */
  whitelistTtl: 30 * 24 * 3600,
  adminSecret: requireSecret('ADMIN_JWT_SECRET', 'shiqu-admin-jwt-secret'),
  adminExpiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '7d',
}));
