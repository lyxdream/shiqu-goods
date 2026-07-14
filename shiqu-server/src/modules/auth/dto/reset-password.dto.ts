import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

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

  @ApiProperty({ description: '新密码（6-72 位）' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: '密码至少 6 位' })
  @MaxLength(72, { message: '密码最长 72 位' })
  newPassword: string;

  @ApiProperty({ description: '确认新密码' })
  @IsString()
  @IsNotEmpty()
  confirmPassword: string;
}
