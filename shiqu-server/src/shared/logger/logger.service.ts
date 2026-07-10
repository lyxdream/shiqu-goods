import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { existsSync, mkdirSync, appendFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly logDir = join(process.cwd(), 'logs');
  private readonly isProd = process.env.NODE_ENV === 'production';

  constructor() {
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }
  }

  log(message: string, context?: string) {
    this.write('LOG', message, context);
  }

  error(message: string, trace?: string, context?: string) {
    this.write('ERROR', `${message}${trace ? `\n${trace}` : ''}`, context);
  }

  warn(message: string, context?: string) {
    this.write('WARN', message, context);
  }

  debug(message: string, context?: string) {
    if (this.isProd) return;
    this.write('DEBUG', message, context);
  }

  private write(level: string, message: string, context?: string) {
    const line = `[${new Date().toISOString()}] [${level}]${context ? ` [${context}]` : ''} ${message}\n`;
    console.log(line.trim());
    try {
      appendFileSync(join(this.logDir, 'app.log'), line);
    } catch {
      // 写文件失败不影响主流程
    }
  }
}
