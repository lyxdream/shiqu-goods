import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { OrderStatusEnum } from 'src/common/enums';
import { DbService } from 'src/shared/db';
import { Product } from 'src/modules/product/entities/product.entity';
import { Order } from './entities/order.entity';

/** 待付款超时时长（毫秒），默认 30 分钟 */
const PENDING_TIMEOUT_MS =
  parseInt(process.env.ORDER_PENDING_TIMEOUT_MINUTES || '30', 10) * 60 * 1000;

/** 扫描间隔（毫秒），默认 5 分钟扫一次 */
const SCAN_INTERVAL_MS = 5 * 60 * 1000;

@Injectable()
export class OrderTaskService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(OrderTaskService.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly dbService: DbService,
  ) {}

  onApplicationBootstrap() {
    this.timer = setInterval(
      () => void this.cancelExpiredOrders(),
      SCAN_INTERVAL_MS,
    );
    this.logger.log(
      `待付款超时任务已启动，超时=${PENDING_TIMEOUT_MS / 60000}min，扫描间隔=${SCAN_INTERVAL_MS / 60000}min`,
    );
  }

  onApplicationShutdown() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

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
          for (const item of order.items) {
            await manager
              .createQueryBuilder()
              .update(Product)
              .set({ stock: () => `stock + ${item.quantity}` })
              .where('id = :id', { id: item.productId })
              .execute();
          }
          order.status = OrderStatusEnum.CANCELLED;
          await manager.save(order);
        });
        this.logger.log(`订单 ${order.orderNo} 已超时取消，库存已回滚`);
      } catch (err) {
        this.logger.error(`订单 ${order.orderNo} 取消失败`, err);
      }
    }
  }
}
