import { IsInt, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({ description: '商品 ID' })
  @IsInt()
  @Min(1)
  productId: number;

  @ApiProperty({ description: '购买数量' })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: '收货地址 ID' })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  addressId: number;
}
