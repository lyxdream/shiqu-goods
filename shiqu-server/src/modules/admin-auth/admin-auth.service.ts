import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { throwInvalidCredentials } from 'src/common/exceptions/biz-error.util';
import type { JwtAdminPayload } from 'src/common/types/jwt-payload';
import { comparePassword } from 'src/common/utils/bcrypt.util';
import { Admin } from './entities/admin.entity';
import { AdminLoginDto } from './dto/admin-login.dto';

@Injectable()
export class AdminAuthService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: AdminLoginDto) {
    const admin = await this.adminRepository
      .createQueryBuilder('admin')
      .addSelect('admin.password')
      .where('admin.username = :username', { username: dto.username })
      .getOne();

    if (!admin) {
      throwInvalidCredentials('用户名或密码错误');
    }

    const valid = await comparePassword(dto.password, admin.password);
    if (!valid) {
      throwInvalidCredentials('用户名或密码错误');
    }

    const payload: JwtAdminPayload = {
      sub: admin.id,
      username: admin.username,
      type: 'admin',
    };

    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
