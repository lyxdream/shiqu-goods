import { registerAs } from '@nestjs/config';

export default registerAs('ai', () => ({
  serviceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  internalSecret: process.env.AI_INTERNAL_SECRET || '',
}));
