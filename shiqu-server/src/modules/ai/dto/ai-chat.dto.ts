import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { AiSceneEnum } from 'src/common/enums';

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
    enum: AiSceneEnum,
    description:
      '场景：product_qa | order_help | assistant | product_recommend | grass_copy | purchase_list',
  })
  @IsOptional()
  @IsEnum(AiSceneEnum, { message: '无效的场景参数' })
  @MaxLength(32)
  @Matches(/^[a-z_]+$/, { message: '无效的场景参数' })
  scene?: AiSceneEnum;

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
