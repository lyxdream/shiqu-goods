import { Column, DeleteDateColumn, Entity } from 'typeorm';
import { BaseEntity } from 'src/common/entities';
import { ProductStatusEnum } from 'src/common/enums';

@Entity('products')
export class Product extends BaseEntity {
  /** 商品编号（业务号，唯一） */
  @Column({ name: 'product_no', length: 20, unique: true })
  productNo: string;

  @Column({ length: 100 })
  name: string;

  /** 价格，单位：分 */
  @Column({ type: 'int' })
  price: number;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ length: 500, default: '' })
  image: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ProductStatusEnum,
    default: ProductStatusEnum.ON_SALE,
  })
  status: ProductStatusEnum;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}
