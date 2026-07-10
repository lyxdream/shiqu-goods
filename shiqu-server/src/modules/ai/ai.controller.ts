import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AiService } from './ai.service';
import { AiChatDto } from './dto/ai-chat.dto';
import { AiParseDocumentDto } from './dto/ai-parse-document.dto';

@ApiTags('AI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  @ApiOperation({ summary: 'AI 智能对话' })
  chat(@Body() body: AiChatDto) {
    return this.aiService.chat(body);
  }

  @Post('document')
  @ApiOperation({ summary: '文档解析/内容生成' })
  parseDocument(@Body() body: AiParseDocumentDto) {
    return this.aiService.parseDocument(body);
  }
}
