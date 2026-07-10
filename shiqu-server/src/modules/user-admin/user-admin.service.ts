import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserStatusEnum } from 'src/constants/user-status.enum';
import { User } from 'src/modules/user/entities/user.entity';
import { UserService } from 'src/modules/user/user.service';
import { QueryUserDto } from './dto/query-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserAdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly userService: UserService,
  ) {}

  async findAll(query: QueryUserDto) {
    const pageNum = parseInt(query.pageNum || '1', 10);
    const pageSize = parseInt(query.pageSize || '10', 10);

    const qb = this.userRepository.createQueryBuilder('user');

    if (query.username) {
      qb.andWhere('user.username LIKE :username', {
        username: `%${query.username}%`,
      });
    }
    if (query.status) {
      qb.andWhere('user.status = :status', { status: query.status });
    }

    qb.orderBy('user.createdAt', 'DESC')
      .skip((pageNum - 1) * pageSize)
      .take(pageSize);

    const [list, total] = await qb.getManyAndCount();

    return {
      list: list.map((u) => this.userService.sanitize(u)),
      total,
      pageNum,
      pageSize,
    };
  }

  async update(id: number, dto: UpdateUserDto) {
    const user = await this.userService.findById(id);
    Object.assign(user, dto);
    await this.userRepository.save(user);
    return this.userService.sanitize(user);
  }

  async updateStatus(id: number, status: UserStatusEnum) {
    const user = await this.userService.findById(id);
    user.status = status;
    await this.userRepository.save(user);
    return this.userService.sanitize(user);
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return this.userService.sanitize(user);
  }
}
