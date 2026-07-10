import { ValidationPipe, RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { setupSwagger } from './setup-swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') || 3000;
  const uploadDir = configService.get<string>('upload.dir') || 'uploads';
  const corsOrigins = configService.get<string[]>('app.corsOrigins') || [];

  app.setGlobalPrefix('api', {
    exclude: [{ path: 'health', method: RequestMethod.GET }],
  });
  app.enableCors({ origin: corsOrigins, credentials: true });
  app.useStaticAssets(join(process.cwd(), uploadDir), {
    prefix: `/${uploadDir}`,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  setupSwagger(app);

  await app.listen(port);
  console.log(`shiqu-server running on http://localhost:${port}`);
}
bootstrap();
