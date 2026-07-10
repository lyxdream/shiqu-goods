import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AiChatDto {
  @ApiProperty({ description: '用户消息' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ required: false, description: '会话 ID' })
  @IsOptional()
  @IsString()
  sessionId?: string;
}
