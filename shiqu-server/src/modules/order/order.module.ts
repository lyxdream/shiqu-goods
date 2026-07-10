import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddressModule } from 'src/modules/address/address.module';
import { Product } from 'src/modules/product/entities/product.entity';
import { DbModule } from 'src/shared/db';
import { OrderAdminController } from './order-admin.controller';
import { OrderController } from './order.controller';
import { OrderItem } from './entities/order-item.entity';
import { Order } from './entities/order.entity';
import { OrderService } from './order.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Product]),
    AddressModule,
    DbModule,
  ],
  controllers: [OrderController, OrderAdminController],
  providers: [OrderService],
})
export class OrderModule {}
