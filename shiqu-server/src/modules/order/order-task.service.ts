import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { OrderStatusEnum } from 'src/common/enums';
import { DbService } from 'src/shared/db';
import { Product } from 'src/modules/product/entities/product.entity';
import { Order } from './entities/order.entity';

/** 待付款超时时长（毫秒），默认 30 分钟 */
const PENDING_TIMEOUT_MS =
  parseInt(process.env.ORDER_PENDING_TIMEOUT_MINUTES || '30', 10) * 60 * 1000;

@Injectable()
export class OrderTaskService {
  private readonly logger = new Logger(OrderTaskService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly dbService: DbService,
  ) {}

  /** 每 5 分钟扫描一次超时待付款订单，自动取消并回滚库存 */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async cancelExpiredOrders() {
    const deadline = new Date(Date.now() - PENDING_TIMEOUT_MS);

    const expiredOrders = await this.orderRepository.find({
      where: {
        status: OrderStatusEnum.PENDING_PAYMENT,
        createdAt: LessThan(deadline),
      },
      relations: ['items'],
    });

    if (!expiredOrders.length) return;

    this.logger.log(`发现 ${expiredOrders.length} 笔超时待付款订单，开始取消`);

    for (const order of expiredOrders) {
      try {
        await this.dbService.transaction(async (manager) => {
          // 条件更新状态：只有仍为 pending_payment 才执行取消
          // 防止扫描到订单后、事务执行前用户已完成支付的竞态
          const result = await manager
            .createQueryBuilder()
            .update(Order)
            .set({ status: OrderStatusEnum.CANCELLED })
            .where('id = :id AND status = :status', {
              id: order.id,
              status: OrderStatusEnum.PENDING_PAYMENT,
            })
            .execute();

          if (!result.affected) {
            // 订单已被支付或其他状态，跳过库存回滚
            return;
          }

          for (const item of order.items) {
            await manager
              .createQueryBuilder()
              .update(Product)
              .set({ stock: () => `stock + ${item.quantity}` })
              .where('id = :id', { id: item.productId })
              .execute();
          }
        });
        this.logger.log(`订单 ${order.orderNo} 已超时取消，库存已回滚`);
      } catch (err) {
        this.logger.error(`订单 ${order.orderNo} 取消失败`, err);
      }
    }
  }
}
