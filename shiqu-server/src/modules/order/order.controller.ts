import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { JwtUserPayload } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderService } from './order.service';

@ApiTags('C端-订单')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({ summary: '提交订单' })
  create(@CurrentUser() user: JwtUserPayload, @Body() dto: CreateOrderDto) {
    return this.orderService.create(user.sub, dto);
  }

  @Post(':id/pay')
  @ApiOperation({ summary: '模拟付款' })
  pay(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.orderService.pay(user.sub, id);
  }

  @Get()
  @ApiOperation({ summary: '我的订单列表' })
  findAll(@CurrentUser() user: JwtUserPayload) {
    return this.orderService.findAllForUser(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: '订单详情' })
  findOne(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.orderService.findOneForUser(user.sub, id);
  }
}
