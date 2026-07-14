import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResponseCode } from 'src/common/constants/response-code';
import { BusinessException } from 'src/common/exceptions/business.exception';
import { UserStatusEnum } from 'src/common/enums';
import type { JwtUserPayload } from 'src/common/types/jwt-payload';
import { comparePassword, hashPassword } from 'src/common/utils/bcrypt.util';
import { RedisService } from 'src/shared/redis/redis.service';
import { User } from 'src/modules/user/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

/** 验证码有效期（秒） */
const OTP_TTL = 300;
/** 验证码最大错误次数 */
const OTP_MAX_FAIL = 5;
/** 错误次数超限后的锁定时长（秒） */
const OTP_LOCK_TTL = 300;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
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

  /**
   * 发送忘记密码验证码。
   * 无论手机号是否注册，统一返回相同响应，防止用户枚举。
   */
  async sendOtp(dto: SendOtpDto) {
    const phone = dto.phone.trim();

    const user = await this.userRepository.findOne({ where: { phone } });

    if (user && user.status !== UserStatusEnum.DISABLED) {
      const code = this.generateOtp();
      await this.redisService.set(`otp:phone:${phone}`, code, OTP_TTL);
      // 清空历史错误计数
      await this.redisService.del(`otp:fail:${phone}`);

      // TODO: 接入真实短信服务商后，替换下面这行为 SMS SDK 调用
      this.logger.log(
        `[短信 Mock] 手机号 ${phone} 验证码：${code}（${OTP_TTL / 60} 分钟内有效）`,
      );
    }

    // 统一返回，不暴露手机号是否已注册
    return { message: '如果该手机号已注册，验证码将在几秒内发送' };
  }

  /**
   * 验证 OTP 并重置密码。
   */
  async resetPassword(dto: ResetPasswordDto) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BusinessException(
        ResponseCode.VALIDATION_ERROR,
        '两次密码不一致',
      );
    }

    const phone = dto.phone.trim();
    const lockKey = `otp:fail:${phone}`;
    const otpKey = `otp:phone:${phone}`;

    // 检查是否已被锁定
    const failCount = await this.redisService.get(lockKey);
    if (failCount && parseInt(failCount, 10) >= OTP_MAX_FAIL) {
      throw new BusinessException(
        ResponseCode.BUSINESS_ERROR,
        `验证码错误次数过多，请 ${OTP_LOCK_TTL / 60} 分钟后重试`,
      );
    }

    // 取出验证码
    const storedCode = await this.redisService.get(otpKey);
    if (!storedCode) {
      throw new BusinessException(
        ResponseCode.BUSINESS_ERROR,
        '验证码已过期或不存在，请重新获取',
      );
    }

    // 比对验证码
    if (storedCode !== dto.code) {
      const newCount = await this.redisService.incr(lockKey);
      // 第一次写入时设置过期时间
      if (newCount === 1) {
        await this.redisService.expire(lockKey, OTP_LOCK_TTL);
      }
      const remaining = OTP_MAX_FAIL - newCount;
      throw new BusinessException(
        ResponseCode.INVALID_CREDENTIALS,
        remaining > 0
          ? `验证码错误，还剩 ${remaining} 次机会`
          : `验证码错误次数过多，请 ${OTP_LOCK_TTL / 60} 分钟后重试`,
      );
    }

    // 验证码正确：改密并立即删除验证码（防重放）
    const user = await this.userRepository.findOne({ where: { phone } });
    if (!user) {
      throw new BusinessException(ResponseCode.NOT_FOUND, '用户不存在');
    }
    if (user.status === UserStatusEnum.DISABLED) {
      throw new BusinessException(ResponseCode.ACCOUNT_DISABLED, '账号已被禁用');
    }

    user.password = await hashPassword(dto.newPassword);
    await this.userRepository.save(user);

    await this.redisService.del(otpKey);
    await this.redisService.del(lockKey);

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

  private generateOtp(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }
}
