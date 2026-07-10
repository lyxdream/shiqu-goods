import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const emptyToUndefined = ({ value }: { value: unknown }) => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string' && value.trim() === '') return undefined;
  return typeof value === 'string' ? value.trim() : value;
};

export class UpdateProfileDto {
  @ApiProperty({ required: false, description: '昵称' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  @Length(1, 50)
  nickname?: string;

  @ApiProperty({ required: false, description: '头像 URL' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ required: false, description: '手机号' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  @Length(1, 20)
  phone?: string;
}
