import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DbService } from 'src/shared/db';
import { OrderStatusEnum } from 'src/constants/order-status.enum';
import { ProductStatusEnum } from 'src/constants/product-status.enum';
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
  ) {}

  async create(userId: number, dto: CreateOrderDto) {
    return this.dbService.transaction(async (queryRunner) => {
      const product = await queryRunner.manager.findOne(Product, {
        where: { id: dto.productId, status: ProductStatusEnum.ON_SALE },
        lock: { mode: 'pessimistic_write' },
      });
      if (!product) {
        throw new NotFoundException('商品不存在或已下架');
      }
      if (product.stock < dto.quantity) {
        throw new BadRequestException('库存不足');
      }

      const address = await this.addressService.findOwned(userId, dto.addressId);
      const unitPrice = Number(product.price);
      const totalAmount = unitPrice * dto.quantity;

      const order = queryRunner.manager.create(Order, {
        userId,
        contactName: address.contactName,
        contactPhone: address.phone,
        pickupAddress: address.address,
        totalAmount,
        status: OrderStatusEnum.PENDING_PAYMENT,
      });
      const savedOrder = await queryRunner.manager.save(order);

      const orderItem = queryRunner.manager.create(OrderItem, {
        orderId: savedOrder.id,
        productId: product.id,
        productName: product.name,
        quantity: dto.quantity,
        unitPrice,
      });
      await queryRunner.manager.save(orderItem);

      product.stock -= dto.quantity;
      await queryRunner.manager.save(product);

      return queryRunner.manager.findOne(Order, {
        where: { id: savedOrder.id },
        relations: ['items'],
      });
    });
  }

  async pay(userId: number, orderId: number) {
    const order = await this.findOwned(userId, orderId);
    if (order.status !== OrderStatusEnum.PENDING_PAYMENT) {
      throw new BadRequestException('订单状态不允许付款');
    }
    order.status = OrderStatusEnum.PAID;
    await this.orderRepository.save(order);
    return order;
  }

  findAllForUser(userId: number) {
    return this.orderRepository.find({
      where: { userId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOneForUser(userId: number, id: number) {
    const order = await this.orderRepository.findOne({
      where: { id, userId },
      relations: ['items'],
    });
    if (!order) {
      throw new NotFoundException('订单不存在');
    }
    return order;
  }

  async findAllForAdmin(query: QueryOrderDto) {
    const pageNum = parseInt(query.pageNum || '1', 10);
    const pageSize = parseInt(query.pageSize || '10', 10);
    const qb = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items');

    if (query.status) {
      qb.andWhere('order.status = :status', { status: query.status });
    }

    qb.orderBy('order.createdAt', 'DESC')
      .skip((pageNum - 1) * pageSize)
      .take(pageSize);

    const [list, total] = await qb.getManyAndCount();
    return { list, total, pageNum, pageSize };
  }

  async findOneForAdmin(id: number) {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!order) {
      throw new NotFoundException('订单不存在');
    }
    return order;
  }

  async updateStatus(id: number, dto: UpdateOrderStatusDto) {
    const order = await this.findOneForAdmin(id);
    order.status = dto.status;
    await this.orderRepository.save(order);
    return order;
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
