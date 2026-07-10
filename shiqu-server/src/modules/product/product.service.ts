import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductStatusEnum } from 'src/constants/product-status.enum';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async findAllForCustomer() {
    return this.productRepository.find({
      where: { status: ProductStatusEnum.ON_SALE },
      order: { createdAt: 'DESC' },
    });
  }

  async findOneForCustomer(id: number) {
    const product = await this.productRepository.findOne({
      where: { id, status: ProductStatusEnum.ON_SALE },
    });
    if (!product) {
      throw new NotFoundException('商品不存在或已下架');
    }
    return product;
  }

  async findAllForAdmin(query: QueryProductDto) {
    const pageNum = parseInt(query.pageNum || '1', 10);
    const pageSize = parseInt(query.pageSize || '10', 10);
    const qb = this.productRepository.createQueryBuilder('product');

    if (query.name) {
      qb.andWhere('product.name LIKE :name', { name: `%${query.name}%` });
    }
    if (query.status) {
      qb.andWhere('product.status = :status', { status: query.status });
    }

    qb.orderBy('product.createdAt', 'DESC')
      .skip((pageNum - 1) * pageSize)
      .take(pageSize);

    const [list, total] = await qb.getManyAndCount();
    return { list, total, pageNum, pageSize };
  }

  async findOne(id: number) {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('商品不存在');
    }
    return product;
  }

  create(dto: CreateProductDto) {
    const product = this.productRepository.create(dto);
    return this.productRepository.save(product);
  }

  async update(id: number, dto: UpdateProductDto) {
    const product = await this.findOne(id);
    Object.assign(product, dto);
    return this.productRepository.save(product);
  }

  async updateStatus(id: number, status: ProductStatusEnum) {
    const product = await this.findOne(id);
    product.status = status;
    return this.productRepository.save(product);
  }

  async remove(id: number) {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
    return { message: '删除成功' };
  }
}
