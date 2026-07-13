import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { BizSequence } from './biz-sequence.entity';

function formatOrderDatePart(date: Date): string {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}${mm}${dd}`;
}

@Injectable()
export class BizNoService {
  /** 商品编号：12 位，如 100000000005 */
  async nextProductNo(manager: EntityManager): Promise<string> {
    const seq = await this.nextSeq(manager, 'product');
    return `100${String(seq).padStart(9, '0')}`;
  }

  /** 订单号：19 位，如 2672607100000000003 */
  async nextOrderNo(manager: EntityManager, at = new Date()): Promise<string> {
    const yymmdd = formatOrderDatePart(at);
    const seq = await this.nextSeq(manager, `order_${yymmdd}`);
    return `267${yymmdd}${String(seq).padStart(10, '0')}`;
  }

  private async nextSeq(manager: EntityManager, name: string): Promise<number> {
    let row = await manager.findOne(BizSequence, {
      where: { name },
      lock: { mode: 'pessimistic_write' },
    });

    if (!row) {
      row = manager.create(BizSequence, { name, value: 1 });
      try {
        await manager.save(row);
        return 1;
      } catch {
        row = await manager.findOne(BizSequence, {
          where: { name },
          lock: { mode: 'pessimistic_write' },
        });
        if (!row) {
          throw new Error(`发号失败：${name}`);
        }
      }
    }

    row.value = Number(row.value) + 1;
    await manager.save(row);
    return Number(row.value);
  }
}
