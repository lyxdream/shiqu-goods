import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { comparePassword, hashPassword } from 'src/common/utils/bcrypt.util';
import { RedisService } from 'src/shared/redis/redis.service';
import { User } from './entities/user.entity';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly redisService: RedisService,
  ) {}

  async getProfile(userId: number) {
    return this.findById(userId);
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.findById(userId);
    Object.assign(user, dto);
    return this.userRepository.save(user);
  }

  async updatePassword(userId: number, dto: UpdatePasswordDto) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :id', { id: userId })
      .getOne();

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const valid = await comparePassword(dto.oldPassword, user.password);
    if (!valid) {
      throw new BadRequestException('原密码错误');
    }
    user.password = await hashPassword(dto.newPassword);
    await this.userRepository.save(user);
    // 修改密码后吊销所有设备的 Token
    await this.redisService.del(`token:user:${userId}`);
    return null;
  }

  async findById(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }
}
