import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PagingDto } from 'src/common/dto';
import {
  AdminAuditActionEnum,
  AdminAuditTargetEnum,
} from 'src/common/enums';

export class QueryAuditLogDto extends PagingDto {
  @ApiProperty({
    required: false,
    description: '操作类型',
    enum: AdminAuditActionEnum,
  })
  @IsOptional()
  @IsEnum(AdminAuditActionEnum)
  action?: AdminAuditActionEnum;

  @ApiProperty({
    required: false,
    description: '目标类型',
    enum: AdminAuditTargetEnum,
  })
  @IsOptional()
  @IsEnum(AdminAuditTargetEnum)
  targetType?: AdminAuditTargetEnum;

  @ApiProperty({ required: false, description: '管理员用户名（模糊）' })
  @IsOptional()
  @IsString()
  adminUsername?: string;
}
