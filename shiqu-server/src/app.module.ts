import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
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
import { UserAdminModule } from 'src/modules/user-admin/user-admin.module';
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
    DbModule,
    LoggerModule,
    AuthModule,
    AdminAuthModule,
    UserModule,
    UserAdminModule,
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
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ApiHostMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
