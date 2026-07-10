import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { comparePassword } from 'src/common/utils/bcrypt.util';
import { Admin } from './entities/admin.entity';
import { AdminLoginDto } from './dto/admin-login.dto';

@Injectable()
export class AdminAuthService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: AdminLoginDto) {
    const admin = await this.adminRepository.findOne({
      where: { username: dto.username },
    });
    if (!admin) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const valid = await comparePassword(dto.password, admin.password);
    if (!valid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const payload = {
      sub: admin.id,
      username: admin.username,
      type: 'admin' as const,
    };

    return {
      accessToken: this.jwtService.sign(payload, {
        secret: this.configService.get<string>('jwt.adminSecret'),
        expiresIn: (this.configService.get<string>('jwt.adminExpiresIn') ||
          '7d') as `${number}d`,
      }),
    };
  }
}
