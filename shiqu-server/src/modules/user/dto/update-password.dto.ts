import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsStrongPassword } from 'src/common/validators/password.validator';

export class UpdatePasswordDto {
  @ApiProperty({ description: '原密码' })
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @ApiProperty({ description: '新密码（8-12 位，须包含数字、大写、小写、下划线中至少三种）' })
  @IsString()
  @IsNotEmpty()
  @IsStrongPassword()
  newPassword: string;
}
