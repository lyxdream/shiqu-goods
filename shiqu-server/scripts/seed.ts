import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { hashPassword } from '../src/common/utils/bcrypt.util';
import { AppModule } from '../src/app.module';
import { Admin } from '../src/modules/admin-auth/entities/admin.entity';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const adminRepository = app.get<Repository<Admin>>(
    getRepositoryToken(Admin),
  );

  const username = 'admin';
  const exists = await adminRepository.findOne({ where: { username } });

  if (exists) {
    console.log(`管理员 ${username} 已存在，跳过预置`);
  } else {
    const admin = adminRepository.create({
      username,
      password: await hashPassword('admin123'),
    });
    await adminRepository.save(admin);
    console.log(`管理员预置成功：${username} / admin123`);
  }

  await app.close();
}

seed().catch((error) => {
  console.error('Seed 失败:', error);
  process.exit(1);
});
