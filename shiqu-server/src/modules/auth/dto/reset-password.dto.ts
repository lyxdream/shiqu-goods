import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { IsStrongPassword } from 'src/common/validators/password.validator';

export class ResetPasswordDto {
  @ApiProperty({ description: '手机号', example: '13800138000' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^1\d{10}$/, { message: '手机号格式不正确' })
  phone: string;

  @ApiProperty({ description: '短信验证码（6 位数字）', example: '123456' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: '验证码为 6 位数字' })
  code: string;

  @ApiProperty({
    description: '新密码（8-12 位，须包含数字、大写、小写、下划线中至少三种）',
  })
  @IsString()
  @IsNotEmpty()
  @IsStrongPassword()
  newPassword: string;

  @ApiProperty({ description: '确认新密码' })
  @IsString()
  @IsNotEmpty()
  confirmPassword: string;
}
