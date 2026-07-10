import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  comparePassword,
  hashPassword,
} from 'src/common/utils/bcrypt.util';
import { UserStatusEnum } from 'src/constants/user-status.enum';
import { User } from 'src/modules/user/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new UnauthorizedException('两次密码不一致');
    }

    const exists = await this.userRepository.findOne({
      where: { username: dto.username },
    });
    if (exists) {
      throw new UnauthorizedException('用户名已存在');
    }

    const user = this.userRepository.create({
      username: dto.username,
      password: await hashPassword(dto.password),
      nickname: dto.username,
      status: UserStatusEnum.ENABLED,
    });
    await this.userRepository.save(user);

    return this.buildToken(user);
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { username: dto.username },
    });
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    if (user.status === UserStatusEnum.DISABLED) {
      throw new UnauthorizedException('账号已被禁用');
    }

    const valid = await comparePassword(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    return this.buildToken(user);
  }

  private buildToken(user: User) {
    const payload = {
      sub: user.id,
      username: user.username,
      type: 'user' as const,
    };
    return {
      accessToken: this.jwtService.sign(payload, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: (this.configService.get<string>('jwt.expiresIn') ||
          '7d') as `${number}d`,
      }),
    };
  }
}
