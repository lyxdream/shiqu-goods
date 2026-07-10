import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication) {
  const configService = app.get(ConfigService);
  const enabled = configService.get<boolean>('app.swaggerEnabled');

  if (!enabled) {
    return;
  }

  const config = new DocumentBuilder()
    .setTitle('拾趣好物 API')
    .setDescription('拾趣好物业务后端接口文档')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);
}
