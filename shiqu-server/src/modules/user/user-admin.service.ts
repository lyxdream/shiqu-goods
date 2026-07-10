import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserStatusEnum } from 'src/common/enums';
import { paginate } from 'src/common/utils/paginate.util';
import { User } from './entities/user.entity';
import { UserService } from './user.service';
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
    const qb = this.userRepository.createQueryBuilder('user');

    if (query.username) {
      qb.andWhere('user.username LIKE :username', {
        username: `%${query.username}%`,
      });
    }
    if (query.status) {
      qb.andWhere('user.status = :status', { status: query.status });
    }

    qb.orderBy('user.createdAt', 'DESC');
    return paginate(qb, query);
  }

  async findOne(id: number) {
    return this.userService.findById(id);
  }

  async update(id: number, dto: UpdateUserDto) {
    const user = await this.userService.findById(id);
    Object.assign(user, dto);
    return this.userRepository.save(user);
  }

  async updateStatus(id: number, status: UserStatusEnum) {
    const user = await this.userService.findById(id);
    user.status = status;
    return this.userRepository.save(user);
  }
}
