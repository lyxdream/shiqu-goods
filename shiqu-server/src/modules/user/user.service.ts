import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  comparePassword,
  hashPassword,
} from 'src/common/utils/bcrypt.util';
import { User } from './entities/user.entity';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getProfile(userId: number) {
    const user = await this.findById(userId);
    return this.sanitize(user);
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.findById(userId);
    Object.assign(user, dto);
    await this.userRepository.save(user);
    return this.sanitize(user);
  }

  async updatePassword(userId: number, dto: UpdatePasswordDto) {
    const user = await this.findById(userId);
    const valid = await comparePassword(dto.oldPassword, user.password);
    if (!valid) {
      throw new BadRequestException('原密码错误');
    }
    user.password = await hashPassword(dto.newPassword);
    await this.userRepository.save(user);
    return { message: '密码修改成功' };
  }

  async findById(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  sanitize(user: User) {
    const { password: _password, ...rest } = user;
    return rest;
  }
}
