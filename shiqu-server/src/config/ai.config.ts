import { registerAs } from '@nestjs/config';

const isProduction = process.env.NODE_ENV === 'production';
const internalSecret = process.env.AI_INTERNAL_SECRET || '';

if (isProduction && !internalSecret) {
  throw new Error(
    '[ai] 生产环境必须配置 AI_INTERNAL_SECRET，防止 AI 服务被绕过直接访问。',
  );
}

export default registerAs('ai', () => ({
  serviceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  internalSecret,
}));
