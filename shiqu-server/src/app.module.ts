import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ApiHostMiddleware } from 'src/common/middleware/api-host.middleware';
import { HttpExceptionFilter } from 'src/common/filters/http-exception.filter';
import { TransformInterceptor } from 'src/common/interceptors/transform.interceptor';
import appConfig from 'src/config/app.config';
import databaseConfig from 'src/config/database.config';
import jwtConfig from 'src/config/jwt.config';
import uploadConfig from 'src/config/upload.config';
import aiConfig from 'src/config/ai.config';
import { DbModule } from 'src/shared/db';
import { LoggerModule } from 'src/shared/logger';
import { AuthModule } from 'src/modules/auth/auth.module';
import { AdminAuthModule } from 'src/modules/admin-auth/admin-auth.module';
import { UserModule } from 'src/modules/user/user.module';
import { AddressModule } from 'src/modules/address/address.module';
import { ProductModule } from 'src/modules/product/product.module';
import { OrderModule } from 'src/modules/order/order.module';
import { UploadModule } from 'src/modules/upload/upload.module';
import { AiModule } from 'src/modules/ai/ai.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, uploadConfig, aiConfig],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'auth',    // 认证类：IP 限流，5次/60s
        ttl: 60_000,
        limit: 5,
      },
      {
        name: 'ai',      // AI 类：用户 ID 限流，20次/60s
        ttl: 60_000,
        limit: 20,
      },
      {
        name: 'default', // 全局兜底：IP 限流，120次/60s
        ttl: 60_000,
        limit: 120,
      },
    ]),
    DbModule,
    LoggerModule,
    AuthModule,
    AdminAuthModule,
    UserModule,
    AddressModule,
    ProductModule,
    OrderModule,
    UploadModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ApiHostMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
