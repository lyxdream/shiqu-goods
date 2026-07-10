import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProductStatusEnum } from 'src/common/enums';

export class UpdateProductStatusDto {
  @ApiProperty({ description: '商品状态', enum: ProductStatusEnum })
  @IsEnum(ProductStatusEnum)
  @IsNotEmpty()
  status: ProductStatusEnum;
}
