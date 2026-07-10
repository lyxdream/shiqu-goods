import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AiParseDocumentDto {
  @ApiProperty({ description: '文档内容或 URL' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ required: false, description: '解析提示词' })
  @IsOptional()
  @IsString()
  prompt?: string;
}
