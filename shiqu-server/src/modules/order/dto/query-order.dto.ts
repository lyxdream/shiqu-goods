import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PagingDto } from 'src/common/dto';
import { OrderStatusEnum } from 'src/common/enums';

export class QueryOrderDto extends PagingDto {
  @ApiProperty({
    required: false,
    description: '订单状态',
    enum: OrderStatusEnum,
  })
  @IsOptional()
  @IsEnum(OrderStatusEnum)
  status?: OrderStatusEnum;
}
