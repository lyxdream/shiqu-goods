import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { AiChatDto } from './dto/ai-chat.dto';
import { AiParseDocumentDto } from './dto/ai-parse-document.dto';

@Injectable()
export class AiService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private get baseUrl() {
    return this.configService.get<string>('ai.serviceUrl');
  }

  async chat(body: AiChatDto) {
    return this.forward(`${this.baseUrl}/chat`, body);
  }

  async parseDocument(body: AiParseDocumentDto) {
    return this.forward(`${this.baseUrl}/document/parse`, body);
  }

  private async forward(url: string, body: unknown) {
    try {
      const { data } = await firstValueFrom(this.httpService.post(url, body));
      return data;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ETIMEDOUT') {
        throw new ServiceUnavailableException('AI 服务暂不可用');
      }
      throw new BadGatewayException(
        (axiosError.response?.data as { message?: string })?.message ||
          'AI 服务调用失败',
      );
    }
  }
}
