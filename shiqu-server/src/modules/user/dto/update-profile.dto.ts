import { IsOptional, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({ required: false, description: '昵称' })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  nickname?: string;

  @ApiProperty({ required: false, description: '头像 URL' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ required: false, description: '手机号' })
  @IsOptional()
  @IsString()
  @Length(1, 20)
  phone?: string;
}
