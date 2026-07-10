import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PagingDto } from 'src/common/dto';
import { UserStatusEnum } from 'src/constants/user-status.enum';

export class QueryUserDto extends PagingDto {
  @ApiProperty({ required: false, description: '用户名' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({ required: false, description: '状态', enum: UserStatusEnum })
  @IsOptional()
  @IsEnum(UserStatusEnum)
  status?: UserStatusEnum;
}
