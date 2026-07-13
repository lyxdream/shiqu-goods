import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbService } from './db.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        autoLoadEntities: true,
        synchronize: configService.get<boolean>('database.synchronize'),
        migrations: [__dirname + '/../../migrations/*{.ts,.js}'],
        // 非 sync 模式（生产/预发）启动时自动执行未跑的 migration
        migrationsRun: !configService.get<boolean>('database.synchronize'),
      }),
    }),
  ],
  providers: [DbService],
  exports: [DbService, TypeOrmModule],
})
export class DbModule {}
