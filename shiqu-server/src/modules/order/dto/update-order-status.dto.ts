import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderStatusEnum } from 'src/common/enums';

export class UpdateOrderStatusDto {
  @ApiProperty({ description: '订单状态', enum: OrderStatusEnum })
  @IsEnum(OrderStatusEnum)
  @IsNotEmpty()
  status: OrderStatusEnum;
}
