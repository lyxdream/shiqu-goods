import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BizNoModule } from 'src/shared/biz-no';
import { DbModule } from 'src/shared/db';
import { ProductAdminController } from './product-admin.controller';
import { ProductController } from './product.controller';
import { Product } from './entities/product.entity';
import { ProductService } from './product.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product]), DbModule, BizNoModule],
  controllers: [ProductController, ProductAdminController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
