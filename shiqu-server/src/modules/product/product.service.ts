import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductStatusEnum, UNFINISHED_ORDER_STATUSES } from 'src/common/enums';
import {
  throwBusiness,
  throwNotFound,
} from 'src/common/exceptions/biz-error.util';
import type { JwtAdminPayload } from 'src/common/types/jwt-payload';
import {
  mapPageProductsToApi,
  mapProductToApi,
  toCents,
} from 'src/common/utils/money.util';
import { paginate } from 'src/common/utils/paginate.util';
import { PagingDto } from 'src/common/dto';
import { AuditService } from 'src/modules/audit/audit.service';
import { OrderItem } from 'src/modules/order/entities/order-item.entity';
import { BizNoService } from 'src/shared/biz-no';
import { DbService } from 'src/shared/db';
import { Product } from './entities/product.entity';
import {
  getProductReservedStock,
  toPhysicalStock,
  toSellableStock,
} from './product-stock.util';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly dbService: DbService,
    private readonly bizNoService: BizNoService,
    private readonly auditService: AuditService,
  ) {}

  async findAllForCustomer(query: PagingDto) {
    const qb = this.productRepository
      .createQueryBuilder('product')
      .where('product.status = :status', { status: ProductStatusEnum.ON_SALE })
      .orderBy('product.createdAt', 'DESC');
    const page = await paginate(qb, query);
    return mapPageProductsToApi(page);
  }

  async findOneForCustomer(id: number) {
    const product = await this.findVisibleForCustomer(id);
    if (!product) {
      throwNotFound('商品不存在或已下架');
    }
    return mapProductToApi(product);
  }

  /** C 端可见商品：在售且未软删（供 AI context 等复用） */
  async findVisibleForCustomer(id: number): Promise<Product | null> {
    return this.productRepository.findOne({
      where: { id, status: ProductStatusEnum.ON_SALE },
    });
  }

  async findAllForAdmin(query: QueryProductDto) {
    const qb = this.productRepository.createQueryBuilder('product');

    if (query.name) {
      qb.andWhere('product.name LIKE :name', { name: `%${query.name}%` });
    }
    if (query.status) {
      qb.andWhere('product.status = :status', { status: query.status });
    }

    qb.orderBy('product.createdAt', 'DESC');
    const page = await paginate(qb, query);
    const list = await Promise.all(
      page.list.map((product) => this.mapProductToAdminApi(product)),
    );
    return { ...page, list };
  }

  async findOne(id: number) {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throwNotFound('商品不存在');
    }
    return this.mapProductToAdminApi(product);
  }

  async create(dto: CreateProductDto) {
    return this.dbService.transaction(async (manager) => {
      const productNo = await this.bizNoService.nextProductNo(manager);
      const product = manager.create(Product, {
        ...dto,
        price: toCents(dto.price),
        productNo,
      });
      const saved = await manager.save(product);
      return this.mapProductToAdminApi(saved);
    });
  }

  async update(id: number, dto: UpdateProductDto) {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throwNotFound('商品不存在');
    }

    const { stock: physicalStock, ...rest } = dto;
    Object.assign(product, {
      ...rest,
      ...(rest.price !== undefined ? { price: toCents(rest.price) } : {}),
    });

    if (physicalStock !== undefined) {
      const reserved = await getProductReservedStock(
        this.productRepository.manager,
        id,
      );
      product.stock = toSellableStock(physicalStock, reserved.reservedStock);
    }

    const saved = await this.productRepository.save(product);
    return this.mapProductToAdminApi(saved);
  }

  async updateStatus(id: number, status: ProductStatusEnum) {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throwNotFound('商品不存在');
    }
    product.status = status;
    const saved = await this.productRepository.save(product);
    return this.mapProductToAdminApi(saved);
  }

  async remove(id: number, admin: JwtAdminPayload) {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throwNotFound('商品不存在');
    }

    await this.dbService.transaction(async (manager) => {
      const unfinishedCount = await manager
        .createQueryBuilder(OrderItem, 'item')
        .innerJoin('item.order', 'order')
        .where('item.productId = :productId', { productId: id })
        .andWhere('order.status IN (:...statuses)', {
          statuses: UNFINISHED_ORDER_STATUSES,
        })
        .getCount();

      if (unfinishedCount > 0) {
        throwBusiness(
          `该商品存在 ${unfinishedCount} 笔未完结订单（待付款或已付款），无法删除`,
        );
      }

      product.status = ProductStatusEnum.OFF_SALE;
      await manager.save(product);
      await manager.softRemove(product);
      await this.auditService.recordProductDelete(manager, admin, product);
    });

    return null;
  }

  private async mapProductToAdminApi(product: Product) {
    const reserved = await getProductReservedStock(
      this.productRepository.manager,
      product.id,
    );
    const mapped = mapProductToApi(product);
    return {
      ...mapped,
      pendingReserved: reserved.pendingReserved,
      paidReserved: reserved.paidReserved,
      reservedStock: reserved.reservedStock,
      physicalStock: toPhysicalStock(mapped.stock, reserved.reservedStock),
    };
  }
}
