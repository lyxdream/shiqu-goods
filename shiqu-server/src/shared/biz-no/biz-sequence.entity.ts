import { Column, Entity, PrimaryColumn } from 'typeorm';

/** 业务号发号器（按 name 分段自增，事务内加锁） */
@Entity('biz_sequences')
export class BizSequence {
  @PrimaryColumn({ length: 32 })
  name: string;

  @Column({ type: 'bigint', default: 0 })
  value: number;
}
