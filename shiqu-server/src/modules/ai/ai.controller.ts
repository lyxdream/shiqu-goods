import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { UserThrottlerGuard } from 'src/common/guards/user-throttler.guard';
import type { JwtUserPayload } from 'src/common/types/jwt-payload';
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
  @UseGuards(UserThrottlerGuard)
  @Throttle({ ai: { ttl: 60_000, limit: 20 } })
  @ApiOperation({ summary: 'AI 智能对话（MVP：商品答疑 / 订单答疑）' })
  chat(@CurrentUser() user: JwtUserPayload, @Body() body: AiChatDto) {
    return this.aiService.chat(user.sub, body);
  }

  @Post('document')
  @UseGuards(UserThrottlerGuard)
  @Throttle({ ai: { ttl: 60_000, limit: 5 } })
  @ApiOperation({ summary: '文档解析/内容生成（预留）' })
  parseDocument(@Body() body: AiParseDocumentDto) {
    return this.aiService.parseDocument(body);
  }
}
