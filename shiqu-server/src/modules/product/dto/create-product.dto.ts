import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProductStatusEnum } from 'src/common/enums';

export class CreateProductDto {
  @ApiProperty({ description: '商品名称' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '价格（元）' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ description: '实物库存（管理端录入；新建时等于可售库存）' })
  @IsInt()
  @Min(0)
  stock: number;

  @ApiProperty({ required: false, description: '图片 URL' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({ required: false, description: '简介' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    required: false,
    description: '状态',
    enum: ProductStatusEnum,
  })
  @IsOptional()
  @IsEnum(ProductStatusEnum)
  status?: ProductStatusEnum;
}
