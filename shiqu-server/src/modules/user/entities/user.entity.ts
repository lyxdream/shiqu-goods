import { Column, Entity } from 'typeorm';
import { BaseEntity } from 'src/common/entities';
import { UserStatusEnum } from 'src/constants/user-status.enum';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true, length: 50 })
  username: string;

  @Column({ length: 255 })
  password: string;

  @Column({ length: 50, default: '' })
  nickname: string;

  @Column({ length: 500, default: '' })
  avatar: string;

  @Column({ length: 20, default: '' })
  phone: string;

  @Column({
    type: 'enum',
    enum: UserStatusEnum,
    default: UserStatusEnum.ENABLED,
  })
  status: UserStatusEnum;
}
