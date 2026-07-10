import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/common/entities';
import { User } from 'src/modules/user/entities/user.entity';

@Entity('addresses')
export class Address extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'contact_name', length: 50 })
  contactName: string;

  @Column({ length: 20 })
  phone: string;

  @Column({ type: 'text' })
  address: string;
}
