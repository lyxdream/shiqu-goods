import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AiService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private get baseUrl() {
    return this.configService.get<string>('ai.serviceUrl');
  }

  async chat(body: Record<string, unknown>) {
    const { data } = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/chat`, body),
    );
    return data;
  }

  async parseDocument(body: Record<string, unknown>) {
    const { data } = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/document/parse`, body),
    );
    return data;
  }
}
