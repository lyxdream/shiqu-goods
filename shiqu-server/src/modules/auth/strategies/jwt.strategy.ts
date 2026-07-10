import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserStatusEnum } from 'src/constants/user-status.enum';
import { User } from 'src/modules/user/entities/user.entity';

export interface UserJwtPayload {
  sub: number;
  username: string;
  type: 'user';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret')!,
    });
  }

  async validate(payload: UserJwtPayload) {
    if (payload.type !== 'user') {
      throw new UnauthorizedException('无效的令牌');
    }
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });
    if (!user || user.status === UserStatusEnum.DISABLED) {
      throw new UnauthorizedException('用户不存在或已被禁用');
    }
    return payload;
  }
}
