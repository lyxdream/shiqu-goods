import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'shiqu-user-jwt-secret',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  adminSecret: process.env.ADMIN_JWT_SECRET || 'shiqu-admin-jwt-secret',
  adminExpiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '7d',
}));
