import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  throwAccountDisabled,
  throwAlreadyExists,
  throwBusiness,
  throwInvalidCredentials,
  throwNotFound,
  throwValidation,
} from 'src/common/exceptions/biz-error.util';
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
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    if (dto.password !== dto.confirmPassword) {
      throwValidation('两次密码不一致');
    }

    const exists = await this.userRepository.findOne({
      where: { username: dto.username },
    });
    if (exists) {
      throwAlreadyExists('用户名已存在');
    }

    const phoneExists = await this.userRepository.findOne({
      where: { phone: dto.phone.trim() },
    });
    if (phoneExists) {
      throwAlreadyExists('手机号已被注册');
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
      throwInvalidCredentials('用户名或密码错误');
    }
    if (user.status === UserStatusEnum.DISABLED) {
      throwAccountDisabled('账号已被禁用');
    }

    const valid = await comparePassword(dto.password, user.password);
    if (!valid) {
      throwInvalidCredentials('用户名或密码错误');
    }

    return this.buildToken(user);
  }

  /**
   * 发送忘记密码验证码。手机号未注册时明确提示，已注册则发送验证码。
   */
  async sendOtp(dto: SendOtpDto) {
    const phone = dto.phone.trim();

    const user = await this.userRepository.findOne({ where: { phone } });

    if (!user) {
      throwNotFound('该手机号未注册，请先注册');
    }
    if (user.status === UserStatusEnum.DISABLED) {
      throwAccountDisabled('账号已被禁用');
    }

    const code = this.generateOtp();
    await this.redisService.set(`otp:phone:${phone}`, code, OTP_TTL);
    await this.redisService.del(`otp:fail:${phone}`);

    // TODO: 接入真实短信服务商后，替换下面这行为 SMS SDK 调用
    this.logger.log(
      `[短信 Mock] 手机号 ${phone} 验证码：${code}（${OTP_TTL / 60} 分钟内有效）`,
    );

    return { message: '验证码已发送，请在 5 分钟内完成验证' };
  }

  /**
   * 验证 OTP 并重置密码。
   */
  async resetPassword(dto: ResetPasswordDto) {
    if (dto.newPassword !== dto.confirmPassword) {
      throwValidation('两次密码不一致');
    }

    const phone = dto.phone.trim();
    const lockKey = `otp:fail:${phone}`;
    const otpKey = `otp:phone:${phone}`;

    // 检查是否已被锁定
    const failCount = await this.redisService.get(lockKey);
    if (failCount && parseInt(failCount, 10) >= OTP_MAX_FAIL) {
      throwBusiness(`验证码错误次数过多，请 ${OTP_LOCK_TTL / 60} 分钟后重试`);
    }

    // 取出验证码
    const storedCode = await this.redisService.get(otpKey);
    if (!storedCode) {
      throwBusiness('验证码已过期或不存在，请重新获取');
    }

    // 比对验证码
    if (storedCode !== dto.code) {
      const newCount = await this.redisService.incr(lockKey);
      // 第一次写入时设置过期时间
      if (newCount === 1) {
        await this.redisService.expire(lockKey, OTP_LOCK_TTL);
      }
      const remaining = OTP_MAX_FAIL - newCount;
      throwInvalidCredentials(
        remaining > 0
          ? `验证码错误，还剩 ${remaining} 次机会`
          : `验证码错误次数过多，请 ${OTP_LOCK_TTL / 60} 分钟后重试`,
      );
    }

    // 验证码正确：改密并立即删除验证码（防重放）
    const user = await this.userRepository.findOne({ where: { phone } });
    if (!user) {
      throwNotFound('用户不存在');
    }
    if (user.status === UserStatusEnum.DISABLED) {
      throwAccountDisabled('账号已被禁用');
    }

    user.password = await hashPassword(dto.newPassword);
    await this.userRepository.save(user);

    await this.redisService.del(otpKey);
    await this.redisService.del(lockKey);
    await this.revokeAllTokens(user.id);

    return null;
  }

  private async buildToken(user: User) {
    const jti = crypto.randomUUID();
    const expiresInSeconds = this.configService.get<number>(
      'jwt.expiresInSeconds',
    )!;
    const whitelistTtl = this.configService.get<number>('jwt.whitelistTtl')!;
    const now = Math.floor(Date.now() / 1000);
    const expiry = now + expiresInSeconds;
    const whitelistKey = `token:user:${user.id}`;

    // 清理已过期的 jti，再写入新 jti，最后刷新兜底 TTL
    await this.redisService.zremrangebyscore(whitelistKey, 0, now);
    await this.redisService.zadd(whitelistKey, expiry, jti);
    await this.redisService.expire(whitelistKey, whitelistTtl);

    const payload: JwtUserPayload = {
      sub: user.id,
      username: user.username,
      type: 'user',
      jti,
    };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  /** 退出登录：从白名单移除当前 jti */
  async logout(userId: number, jti: string): Promise<void> {
    await this.redisService.zrem(`token:user:${userId}`, jti);
  }

  /** 强制该用户所有设备下线（改密/重置密码时调用） */
  private async revokeAllTokens(userId: number): Promise<void> {
    await this.redisService.del(`token:user:${userId}`);
  }

  private generateOtp(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }
}
