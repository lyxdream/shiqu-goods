import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResponseCode } from 'src/common/constants/response-code';
import { BusinessException } from 'src/common/exceptions/business.exception';
import { UserStatusEnum } from 'src/common/enums';
import type { JwtUserPayload } from 'src/common/types/jwt-payload';
import { comparePassword, hashPassword } from 'src/common/utils/bcrypt.util';
import { User } from 'src/modules/user/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BusinessException(
        ResponseCode.VALIDATION_ERROR,
        '两次密码不一致',
      );
    }

    const exists = await this.userRepository.findOne({
      where: { username: dto.username },
    });
    if (exists) {
      throw new BusinessException(ResponseCode.ALREADY_EXISTS, '用户名已存在');
    }

    const phoneExists = await this.userRepository.findOne({
      where: { phone: dto.phone.trim() },
    });
    if (phoneExists) {
      throw new BusinessException(
        ResponseCode.ALREADY_EXISTS,
        '手机号已被注册',
      );
    }

    const user = this.userRepository.create({
      username: dto.username,
      password: await hashPassword(dto.password),
      nickname: dto.username,
      phone: dto.phone.trim(),
      status: UserStatusEnum.ENABLED,
    });
    await this.userRepository.save(user);

    return this.buildToken(user);
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.username = :username', { username: dto.username })
      .getOne();

    if (!user) {
      throw new BusinessException(
        ResponseCode.INVALID_CREDENTIALS,
        '用户名或密码错误',
      );
    }
    if (user.status === UserStatusEnum.DISABLED) {
      throw new BusinessException(
        ResponseCode.ACCOUNT_DISABLED,
        '账号已被禁用',
      );
    }

    const valid = await comparePassword(dto.password, user.password);
    if (!valid) {
      throw new BusinessException(
        ResponseCode.INVALID_CREDENTIALS,
        '用户名或密码错误',
      );
    }

    return this.buildToken(user);
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BusinessException(
        ResponseCode.VALIDATION_ERROR,
        '两次密码不一致',
      );
    }

    const user = await this.userRepository.findOne({
      where: { username: dto.username },
    });

    if (!user) {
      throw new BusinessException(ResponseCode.NOT_FOUND, '用户不存在');
    }
    if (user.status === UserStatusEnum.DISABLED) {
      throw new BusinessException(
        ResponseCode.ACCOUNT_DISABLED,
        '账号已被禁用',
      );
    }
    if (!user.phone?.trim()) {
      throw new BusinessException(
        ResponseCode.BUSINESS_ERROR,
        '该账号未登记手机号，请联系管理员处理',
      );
    }
    if (user.phone.trim() !== dto.phone.trim()) {
      throw new BusinessException(
        ResponseCode.INVALID_CREDENTIALS,
        '手机号与账号不匹配',
      );
    }

    user.password = await hashPassword(dto.newPassword);
    await this.userRepository.save(user);
    return null;
  }

  private buildToken(user: User) {
    const payload: JwtUserPayload = {
      sub: user.id,
      username: user.username,
      type: 'user',
    };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
