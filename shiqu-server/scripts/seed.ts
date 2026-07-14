import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { hashPassword } from '../src/common/utils/bcrypt.util';
import { AppModule } from '../src/app.module';
import { Admin } from '../src/modules/admin-auth/entities/admin.entity';

async function seed() {
  const isProduction = process.env.NODE_ENV === 'production';
  const username = process.env.SEED_ADMIN_USERNAME || 'admin';
  const password = process.env.SEED_ADMIN_PASSWORD || '';

  // 生产环境必须通过环境变量传入密码，禁止使用默认弱口令
  if (isProduction && !password) {
    console.error(
      '[seed] 生产环境必须设置 SEED_ADMIN_PASSWORD 环境变量，脚本已中止。\n' +
        '示例：SEED_ADMIN_PASSWORD=你的强密码 npm run seed',
    );
    process.exit(1);
  }

  // 非生产环境未传密码时使用默认值（仅本地开发，值来自 .env 的 SEED_ADMIN_PASSWORD_DEFAULT）
  const defaultPassword = process.env.SEED_ADMIN_PASSWORD_DEFAULT || 'admin123';
  const finalPassword = password || defaultPassword;

  if (!isProduction && !password) {
    console.warn(`[seed] 未设置 SEED_ADMIN_PASSWORD，使用默认密码（仅限开发环境）`);
  }

  const app = await NestFactory.createApplicationContext(AppModule);
  const adminRepository = app.get<Repository<Admin>>(
    getRepositoryToken(Admin),
  );

  const exists = await adminRepository.findOne({ where: { username } });

  if (exists) {
    console.log(`管理员 ${username} 已存在，跳过预置`);
  } else {
    const admin = adminRepository.create({
      username,
      password: await hashPassword(finalPassword),
    });
    await adminRepository.save(admin);
    console.log(`管理员预置成功：用户名=${username}`);
  }

  await app.close();
}

seed().catch((error) => {
  console.error('Seed 失败:', error);
  process.exit(1);
});
