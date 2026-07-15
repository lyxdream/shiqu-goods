import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsStrongPassword } from 'src/common/validators/password.validator';

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
  @Matches(/^1\d{10}$/, { message: '手机号格式不正确' })
  phone: string;

  @ApiProperty({
    description: '密码（8-12 位，须包含数字、大写、小写、下划线中至少三种）',
  })
  @IsString()
  @IsNotEmpty()
  @IsStrongPassword()
  password: string;

  @ApiProperty({ description: '确认密码' })
  @IsString()
  @IsNotEmpty()
  confirmPassword: string;
}
