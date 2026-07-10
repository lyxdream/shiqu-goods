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

export default registerAs('jwt', () => ({
  secret: requireSecret('JWT_SECRET', 'shiqu-user-jwt-secret'),
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  adminSecret: requireSecret('ADMIN_JWT_SECRET', 'shiqu-admin-jwt-secret'),
  adminExpiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '7d',
}));
