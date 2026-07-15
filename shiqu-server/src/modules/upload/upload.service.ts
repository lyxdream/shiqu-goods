import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { throwValidation } from 'src/common/exceptions/biz-error.util';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';

@Injectable()
export class UploadService {
  constructor(private readonly configService: ConfigService) {}

  getUploadDir() {
    return UploadService.resolveUploadDir(
      this.configService.get<string>('upload.dir') || 'uploads',
    );
  }

  static resolveUploadDir(dir: string) {
    const fullPath = join(process.cwd(), dir);
    if (!existsSync(fullPath)) {
      mkdirSync(fullPath, { recursive: true });
    }
    return fullPath;
  }

  static generateFilename(originalname: string) {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    return `${unique}${extname(originalname)}`;
  }

  validateFile(file: Express.Multer.File) {
    if (!file) {
      throwValidation('请选择文件');
    }
    const allowed = this.configService.get<string[]>('upload.allowedMimeTypes');
    if (allowed && !allowed.includes(file.mimetype)) {
      throwValidation('不支持的文件类型');
    }
    const maxSize = this.configService.get<number>('upload.maxSize');
    if (maxSize && file.size > maxSize) {
      throwValidation('文件大小超出限制');
    }
  }

  buildFileUrl(filename: string) {
    const dir = this.configService.get<string>('upload.dir') || 'uploads';
    return `/${dir}/${filename}`;
  }

  generateFilename(originalname: string) {
    return UploadService.generateFilename(originalname);
  }
}
