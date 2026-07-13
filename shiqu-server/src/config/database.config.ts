import { registerAs } from '@nestjs/config';

const synchronize = process.env.DB_SYNC === 'true';
const isProduction = process.env.NODE_ENV === 'production';

// 生产环境禁止开启 synchronize，防止 TypeORM 自动改表导致数据丢失
if (isProduction && synchronize) {
  throw new Error(
    '[database] 生产环境禁止设置 DB_SYNC=true，请使用 migration:run 管理表结构变更。',
  );
}

export default registerAs('database', () => ({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'shiqu_goods',
  synchronize,
}));
