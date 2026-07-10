import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProductStatusEnum } from 'src/constants/product-status.enum';

export class UpdateProductDto {
  @ApiProperty({ required: false, description: '商品名称' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false, description: '价格' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiProperty({ required: false, description: '库存' })
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @ApiProperty({ required: false, description: '图片 URL' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({ required: false, description: '简介' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, description: '状态', enum: ProductStatusEnum })
  @IsOptional()
  @IsEnum(ProductStatusEnum)
  status?: ProductStatusEnum;
}
