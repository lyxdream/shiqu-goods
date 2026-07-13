import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class AiChatDto {
  @ApiProperty({ description: '用户消息' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ required: false, description: '会话 ID' })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiProperty({
    required: false,
    description: '场景：product_qa | order_help | assistant',
  })
  @IsOptional()
  @IsString()
  scene?: string;

  @ApiProperty({ required: false, description: '商品 ID（商品答疑）' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productId?: number;

  @ApiProperty({ required: false, description: '订单 ID（订单答疑）' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  orderId?: number;
}
