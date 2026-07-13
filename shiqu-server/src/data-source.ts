/**
 * TypeORM CLI 专用 DataSource。
 * 仅用于执行 migration:generate / migration:run / migration:revert。
 * 应用运行时使用 DbModule（db.module.ts）。
 */
import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config(); // 读取 .env

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'shiqu_goods',
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
});
