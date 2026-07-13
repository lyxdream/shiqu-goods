import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from 'src/common/entities';
import { OrderStatusEnum } from 'src/constants/order-status.enum';
import { User } from 'src/modules/user/entities/user.entity';
import { OrderItem } from './order-item.entity';

@Entity('orders')
export class Order extends BaseEntity {
  /** 订单号（业务号，唯一） */
  @Column({ name: 'order_no', length: 32, unique: true })
  orderNo: string;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'contact_name', length: 50 })
  contactName: string;

  @Column({ name: 'contact_phone', length: 20 })
  contactPhone: string;

  @Column({ name: 'pickup_address', type: 'text' })
  pickupAddress: string;

  /** 订单总金额，单位：分 */
  @Column({ name: 'total_amount', type: 'int' })
  totalAmount: number;

  @Column({
    type: 'enum',
    enum: OrderStatusEnum,
    default: OrderStatusEnum.PENDING_PAYMENT,
  })
  status: OrderStatusEnum;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];
}
