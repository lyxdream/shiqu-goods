import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { LoggerService } from 'src/shared/logger';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '服务器内部错误';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message =
        typeof res === 'string'
          ? res
          : ((res as { message?: string | string[] }).message as string) ||
            message;
      if (Array.isArray(message)) {
        message = message.join('; ');
      }
    } else {
      const err = exception as Error;
      this.logger.error(
        err?.message || 'Unknown error',
        err?.stack,
        'HttpExceptionFilter',
      );
    }

    response.status(status).json({
      code: status,
      message,
      data: null,
    });
  }
}
