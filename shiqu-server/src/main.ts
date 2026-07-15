import { ValidationPipe, RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { join } from 'path';
import { getHelmetOptions } from 'src/config/helmet.config';
import { LoggerService } from 'src/shared/logger';
import { AppModule } from './app.module';
import { setupSwagger } from './setup-swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = app.get(LoggerService);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') || 3000;
  const uploadDir = configService.get<string>('upload.dir') || 'uploads';
  const corsOrigins = configService.get<string[]>('app.corsOrigins') || [];
  const trustProxy = configService.get<false | true | number>('app.trustProxy');

  if (trustProxy !== false) {
    app.set('trust proxy', trustProxy);
  } else if (configService.get<string>('app.nodeEnv') === 'production') {
    logger.warn(
      'TRUST_PROXY 未启用，反向代理后 IP 限流与域名隔离可能异常',
      'Bootstrap',
    );
  }

  const isProduction =
    configService.get<string>('app.nodeEnv') === 'production';
  const swaggerEnabled = configService.get<boolean>('app.swaggerEnabled') === true;
  app.use(helmet(getHelmetOptions(isProduction, swaggerEnabled)));

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
  logger.log(`shiqu-server running on http://localhost:${port}`, 'Bootstrap');
}
void bootstrap();
