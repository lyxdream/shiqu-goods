import { IsNotEmpty, IsString, Length, Matches, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FieldLength } from 'src/common/constants/field-length';

export class CreateAddressDto {
  @ApiProperty({
    description: '联系人',
    maxLength: FieldLength.ADDRESS_CONTACT_NAME,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, FieldLength.ADDRESS_CONTACT_NAME)
  contactName: string;

  @ApiProperty({
    description: '联系电话',
    maxLength: FieldLength.ADDRESS_PHONE,
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^1\d{10}$/, { message: '手机号格式不正确' })
  @MaxLength(FieldLength.ADDRESS_PHONE)
  phone: string;

  @ApiProperty({
    description: '收货地址',
    maxLength: FieldLength.ADDRESS_DETAIL,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, FieldLength.ADDRESS_DETAIL)
  address: string;
}
