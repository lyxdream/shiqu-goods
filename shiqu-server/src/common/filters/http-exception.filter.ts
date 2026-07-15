import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ResponseCode } from 'src/common/constants/response-code';
import { BusinessException } from 'src/common/exceptions/business.exception';
import { LoggerService } from 'src/shared/logger';

function mapHttpStatusToCode(status: number): number {
  const map: Record<number, number> = {
    [HttpStatus.UNAUTHORIZED]: ResponseCode.UNAUTHORIZED,
    [HttpStatus.BAD_REQUEST]: ResponseCode.VALIDATION_ERROR,
    [HttpStatus.CONFLICT]: ResponseCode.ALREADY_EXISTS,
    [HttpStatus.NOT_FOUND]: ResponseCode.NOT_FOUND,
    [HttpStatus.FORBIDDEN]: ResponseCode.FORBIDDEN,
  };
  return map[status] ?? ResponseCode.INTERNAL_ERROR;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let code: number = ResponseCode.INTERNAL_ERROR;
    let message = '服务器内部错误';

    if (exception instanceof BusinessException) {
      const res = exception.getResponse() as { code: number; message: string };
      code = res.code;
      message = res.message;
    } else if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'object' && res !== null && 'code' in res) {
        const body = res as { code?: number; message?: string | string[] };
        code = body.code ?? mapHttpStatusToCode(status);
        message =
          typeof body.message === 'string'
            ? body.message
            : Array.isArray(body.message)
              ? body.message.join('; ')
              : message;
      } else {
        code = mapHttpStatusToCode(status);
        message =
          typeof res === 'string'
            ? res
            : ((res as { message?: string | string[] }).message as string) ||
              message;
        if (Array.isArray(message)) {
          message = message.join('; ');
        }
      }
    } else {
      const err = exception as Error;
      this.logger.error(
        err?.message || 'Unknown error',
        err?.stack,
        'HttpExceptionFilter',
      );
    }

    response
      .status(HttpStatus.OK)
      .setHeader('Cache-Control', 'no-store')
      .json({
        code,
        message,
        success: false,
        data: null,
      });
  }
}
