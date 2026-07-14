import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResponseCode } from 'src/common/constants/response-code';
import { BusinessException } from 'src/common/exceptions/business.exception';
import { UserStatusEnum } from 'src/common/enums';
import type { JwtUserPayload } from 'src/common/types/jwt-payload';
import { RedisService } from 'src/shared/redis/redis.service';
import { User } from 'src/modules/user/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly redisService: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret')!,
    });
  }

  async validate(payload: JwtUserPayload) {
    if (payload.type !== 'user') {
      throw new BusinessException(ResponseCode.UNAUTHORIZED, '无效的令牌');
    }

    // 白名单校验：jti 不在集合里说明已退出登录或改密后被吊销
    const score = await this.redisService.zscore(
      `token:user:${payload.sub}`,
      payload.jti,
    );
    if (score === null) {
      throw new BusinessException(
        ResponseCode.UNAUTHORIZED,
        '登录已失效，请重新登录',
      );
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });
    if (!user || user.status === UserStatusEnum.DISABLED) {
      throw new BusinessException(
        ResponseCode.UNAUTHORIZED,
        '用户不存在或已被禁用',
      );
    }
    return payload;
  }
}
