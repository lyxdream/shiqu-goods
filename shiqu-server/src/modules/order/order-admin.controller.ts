import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminJwtAuthGuard } from 'src/common/guards/admin-jwt-auth.guard';
import { DefaultThrottled } from 'src/common/decorators/throttle-scope.decorator';
import { QueryOrderDto } from './dto/query-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderService } from './order.service';

@ApiTags('B端-订单管理')
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard)
@DefaultThrottled()
@Controller('admin/orders')
export class OrderAdminController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @ApiOperation({ summary: '订单列表' })
  findAll(@Query() query: QueryOrderDto) {
    return this.orderService.findAllForAdmin(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '订单详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.orderService.findOneForAdmin(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: '修改订单状态' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateStatus(id, dto);
  }
}
