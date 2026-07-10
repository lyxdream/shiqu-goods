import { registerAs } from '@nestjs/config';

export default registerAs('upload', () => ({
  dir: process.env.UPLOAD_DIR || 'uploads',
  maxSize: parseInt(process.env.UPLOAD_MAX_SIZE || '5242880', 10),
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
}));
