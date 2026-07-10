import {
  IsEnum,
  IsNumberString,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { SortRuleEnum } from 'src/common/enum';
import { DateParamsDto } from './date-params.dto';

/**
 * 分页 DTO
 */
export class PagingDto {
  @ApiProperty({ required: false, description: '当前页码', default: 1 })
  @IsOptional()
  @Transform(({ value }) => value?.toString?.() || '1')
  @IsNumberString()
  pageNum?: string;

  @ApiProperty({ required: false, description: '每页数量', default: 10 })
  @IsOptional()
  @Transform(({ value }) => value?.toString?.() || '10')
  @IsNumberString()
  pageSize?: string;

  @ApiProperty({ required: false, description: '时间范围' })
  @IsOptional()
  @ValidateNested()
  @Type(() => DateParamsDto)
  @IsObject()
  params?: DateParamsDto;

  @ApiProperty({ required: false, description: '排序字段' })
  @IsOptional()
  @IsString()
  orderByColumn?: string;

  @ApiProperty({ required: false, description: '排序规则', enum: SortRuleEnum })
  @IsOptional()
  @IsEnum(SortRuleEnum)
  isAsc?: SortRuleEnum;
}
