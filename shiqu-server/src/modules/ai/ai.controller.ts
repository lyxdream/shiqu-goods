import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AiService } from './ai.service';

@ApiTags('AI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  @ApiOperation({ summary: 'AI 智能对话' })
  chat(@Body() body: Record<string, unknown>) {
    return this.aiService.chat(body);
  }

  @Post('document')
  @ApiOperation({ summary: '文档解析/内容生成' })
  parseDocument(@Body() body: Record<string, unknown>) {
    return this.aiService.parseDocument(body);
  }
}
