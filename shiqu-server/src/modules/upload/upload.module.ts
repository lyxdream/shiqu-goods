import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dir = configService.get<string>('upload.dir') || 'uploads';
        return {
          storage: diskStorage({
            destination: (_req, _file, cb) => {
              cb(null, UploadService.resolveUploadDir(dir));
            },
            filename: (_req, file, cb) => {
              cb(null, UploadService.generateFilename(file.originalname));
            },
          }),
          limits: {
            fileSize: configService.get<number>('upload.maxSize'),
          },
        };
      },
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
