import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiHost: process.env.API_HOST || 'api.shiqu.com',
  adminApiHost: process.env.ADMIN_API_HOST || 'admin-api.shiqu.com',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174')
    .split(',')
    .map((s) => s.trim()),
}));
