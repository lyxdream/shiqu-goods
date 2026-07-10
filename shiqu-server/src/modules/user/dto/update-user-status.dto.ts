import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserStatusEnum } from 'src/common/enums';

export class UpdateUserStatusDto {
  @ApiProperty({ description: '用户状态', enum: UserStatusEnum })
  @IsEnum(UserStatusEnum)
  @IsNotEmpty()
  status: UserStatusEnum;
}
