import { IsNotEmpty, IsString, Length, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ description: '用户名' })
  @IsString()
  @IsNotEmpty()
  @Length(3, 50)
  @Matches(/^[a-zA-Z][a-zA-Z0-9]*$/, {
    message: '用户名须以字母开头，只能包含字母和数字',
  })
  username: string;

  @ApiProperty({ description: '手机号' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^1\d{10}$/, { message: '请输入正确的手机号' })
  phone: string;

  @ApiProperty({ description: '密码' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ description: '确认密码' })
  @IsString()
  @IsNotEmpty()
  confirmPassword: string;
}
