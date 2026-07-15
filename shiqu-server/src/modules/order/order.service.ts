import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ORDER_STATUS_TRANSITIONS,
  OrderStatusEnum,
  ProductStatusEnum,
} from 'src/common/enums';
import { BizNoService } from 'src/shared/biz-no';
import {
  calcLineAmountCents,
  mapOrderToApi,
  mapOrdersToApi,
  mapPageOrdersToApi,
} from 'src/common/utils/money.util';
import { paginate } from 'src/common/utils/paginate.util';
import { DbService } from 'src/shared/db';
import { AddressService } from 'src/modules/address/address.service';
import { Product } from 'src/modules/product/entities/product.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderItem } from './entities/order-item.entity';
import { Order } from './entities/order.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly addressService: AddressService,
    private readonly dbService: DbService,
    private readonly bizNoService: BizNoService,
  ) {}

  async create(userId: number, dto: CreateOrderDto) {
    return this.dbService.transaction(async (manager) => {
      const product = await manager.findOne(Product, {
        where: { id: dto.productId, status: ProductStatusEnum.ON_SALE },
        lock: { mode: 'pessimistic_write' },
      });
      if (!product) {
        throw new NotFoundException('商品不存在或已下架');
      }
      if (product.stock < dto.quantity) {
        throw new BadRequestException('库存不足');
      }

      const address = await this.addressService.findOwned(
        userId,
        dto.addressId,
        manager,
      );
      const unitPriceCents = Number(product.price);
      const totalAmountCents = calcLineAmountCents(
        unitPriceCents,
        dto.quantity,
      );

      const orderNo = await this.bizNoService.nextOrderNo(manager);
      const order = manager.create(Order, {
        userId,
        orderNo,
        contactName: address.contactName,
        contactPhone: address.phone,
        pickupAddress: address.address,
        totalAmount: totalAmountCents,
        status: OrderStatusEnum.PENDING_PAYMENT,
      });
      const savedOrder = await manager.save(order);

      const orderItem = manager.create(OrderItem, {
        orderId: savedOrder.id,
        productId: product.id,
        productNo: product.productNo,
        productName: product.name,
        quantity: dto.quantity,
        unitPrice: unitPriceCents,
      });
      await manager.save(orderItem);

      product.stock -= dto.quantity;
      await manager.save(product);

      const createdOrder = await manager.findOne(Order, {
        where: { id: savedOrder.id },
        relations: ['items'],
      });
      return mapOrderToApi(createdOrder!);
    });
  }

  async pay(userId: number, orderId: number) {
    // 先校验订单归属和当前状态（不加锁，仅做前置校验）
    const order = await this.findOwned(userId, orderId);
    this.assertTransition(order.status, OrderStatusEnum.PAID);

    // 条件更新：只有当前仍为 pending_payment 时才能改为 paid
    // 防止与超时取消 Cron 产生竞态（两者都写时，后到的 affectedRows=0 即失败）
    const result = await this.orderRepository
      .createQueryBuilder()
      .update(Order)
      .set({ status: OrderStatusEnum.PAID })
      .where('id = :id AND status = :status', {
        id: orderId,
        status: OrderStatusEnum.PENDING_PAYMENT,
      })
      .execute();

    if (!result.affected) {
      throw new BadRequestException('订单状态已变更，支付失败，请刷新后重试');
    }

    const updated = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items'],
    });
    return mapOrderToApi(updated!);
  }

  async findAllForUser(userId: number, query: QueryOrderDto) {
    const qb = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .where('order.userId = :userId', { userId });

    if (query.status) {
      qb.andWhere('order.status = :status', { status: query.status });
    }

    qb.orderBy('order.createdAt', 'DESC');
    const page = await paginate(qb, query);
    return mapPageOrdersToApi(page);
  }

  async cancel(userId: number, orderId: number) {
    const order = await this.findOwned(userId, orderId);
    this.assertTransition(order.status, OrderStatusEnum.CANCELLED);

    await this.dbService.transaction(async (manager) => {
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
        throw new BadRequestException('订单状态已变更，无法取消');
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

    const updated = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items'],
    });
    return mapOrderToApi(updated!);
  }

  async findOneForUser(userId: number, id: number) {
    const order = await this.findOwned(userId, id);
    return mapOrderToApi(order);
  }

  async findAllForAdmin(query: QueryOrderDto) {
    const qb = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items');

    if (query.status) {
      qb.andWhere('order.status = :status', { status: query.status });
    }

    qb.orderBy('order.createdAt', 'DESC');
    const page = await paginate(qb, query);
    return mapPageOrdersToApi(page);
  }

  async findOneForAdmin(id: number) {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!order) {
      throw new NotFoundException('订单不存在');
    }
    return mapOrderToApi(order);
  }

  async updateStatus(id: number, dto: UpdateOrderStatusDto) {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!order) {
      throw new NotFoundException('订单不存在');
    }
    this.assertTransition(order.status, dto.status);

    if (dto.status === OrderStatusEnum.CANCELLED) {
      await this.dbService.transaction(async (manager) => {
        // 条件更新状态：只有仍为 pending_payment 才能取消，防止与 pay() 竞态
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
          throw new BadRequestException('订单状态已变更，无法取消');
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
    } else {
      order.status = dto.status;
      await this.orderRepository.save(order);
    }

    const updated = await this.orderRepository.findOne({
      where: { id },
      relations: ['items'],
    });
    return mapOrderToApi(updated!);
  }

  private assertTransition(from: OrderStatusEnum, to: OrderStatusEnum) {
    if (from === to) return;
    const allowed = ORDER_STATUS_TRANSITIONS[from] || [];
    if (!allowed.includes(to)) {
      throw new BadRequestException(`订单状态不允许从 ${from} 变更为 ${to}`);
    }
  }

  private async findOwned(userId: number, id: number) {
    const order = await this.orderRepository.findOne({
      where: { id, userId },
      relations: ['items'],
    });
    if (!order) {
      throw new NotFoundException('订单不存在');
    }
    return order;
  }
}
