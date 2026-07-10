import { IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 时间区间对象
 */
export class DateParamsDto {
  @ApiProperty({ description: '开始时间' })
  @IsDateString()
  beginTime: string;

  @ApiProperty({ description: '结束时间' })
  @IsDateString()
  endTime: string;
}
