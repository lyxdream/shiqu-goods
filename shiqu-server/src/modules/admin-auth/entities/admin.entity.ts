import { Column, Entity } from 'typeorm';
import { BaseEntity } from 'src/common/entities';

@Entity('admins')
export class Admin extends BaseEntity {
  @Column({ unique: true, length: 50 })
  username: string;

  @Column({ length: 255 })
  password: string;
}
