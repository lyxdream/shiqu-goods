import { IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAddressDto {
  @ApiProperty({ description: '联系人' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  contactName: string;

  @ApiProperty({ description: '联系电话' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 20)
  phone: string;

  @ApiProperty({ description: '收货地址' })
  @IsString()
  @IsNotEmpty()
  address: string;
}
