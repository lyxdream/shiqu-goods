import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductStatusEnum } from 'src/common/enums';
import {
  mapPageProductsToApi,
  mapProductToApi,
  toCents,
} from 'src/common/utils/money.util';
import { paginate } from 'src/common/utils/paginate.util';
import { PagingDto } from 'src/common/dto';
import { BizNoService } from 'src/shared/biz-no';
import { DbService } from 'src/shared/db';
import { Product } from './entities/product.entity';
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
    const product = await this.productRepository.findOne({
      where: { id, status: ProductStatusEnum.ON_SALE },
    });
    if (!product) {
      throw new NotFoundException('商品不存在或已下架');
    }
    return mapProductToApi(product);
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
    return mapPageProductsToApi(page);
  }

  async findOne(id: number) {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('商品不存在');
    }
    return mapProductToApi(product);
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
      return mapProductToApi(saved);
    });
  }

  async update(id: number, dto: UpdateProductDto) {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('商品不存在');
    }
    Object.assign(product, {
      ...dto,
      ...(dto.price !== undefined ? { price: toCents(dto.price) } : {}),
    });
    const saved = await this.productRepository.save(product);
    return mapProductToApi(saved);
  }

  async updateStatus(id: number, status: ProductStatusEnum) {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('商品不存在');
    }
    product.status = status;
    const saved = await this.productRepository.save(product);
    return mapProductToApi(saved);
  }

  async remove(id: number) {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('商品不存在');
    }
    await this.productRepository.remove(product);
    return null;
  }
}
