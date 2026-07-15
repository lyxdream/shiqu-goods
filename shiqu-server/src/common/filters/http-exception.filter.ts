import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  MethodNotAllowedException,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { ResponseCode } from 'src/common/constants/response-code';
import { BusinessException } from 'src/common/exceptions/business.exception';
import {
  FILE_SIZE_LIMIT_MESSAGE,
  METHOD_NOT_ALLOWED_MESSAGE,
  RATE_LIMIT_MESSAGE,
  ROUTE_NOT_FOUND_MESSAGE,
  getNotFoundExceptionMessage,
  isFrameworkRouteNotFound,
  isMulterFileSizeError,
  mapHttpStatusToBusinessCode,
  resolveHttpStatus,
} from 'src/common/filters/http-exception.util';
import { LoggerService } from 'src/shared/logger';

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
    } else if (exception instanceof NotFoundException) {
      code = ResponseCode.NOT_FOUND;
      if (isFrameworkRouteNotFound(exception)) {
        message = ROUTE_NOT_FOUND_MESSAGE;
      } else {
        message = getNotFoundExceptionMessage(exception) || '资源不存在';
        this.logger.warn(
          `NotFoundException 应用于业务场景，请改用 throwNotFound()：${message}`,
          'HttpExceptionFilter',
        );
      }
    } else if (exception instanceof MethodNotAllowedException) {
      code = ResponseCode.METHOD_NOT_ALLOWED;
      message = METHOD_NOT_ALLOWED_MESSAGE;
    } else if (isMulterFileSizeError(exception)) {
      code = ResponseCode.VALIDATION_ERROR;
      message = FILE_SIZE_LIMIT_MESSAGE;
    } else if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'object' && res !== null && 'code' in res) {
        const body = res as { code?: number; message?: string | string[] };
        code = body.code ?? mapHttpStatusToBusinessCode(status);
        message =
          typeof body.message === 'string'
            ? body.message
            : Array.isArray(body.message)
              ? body.message.join('; ')
              : message;
      } else {
        code = mapHttpStatusToBusinessCode(status);
        if (status === 429) {
          message = RATE_LIMIT_MESSAGE;
        } else if (status >= 500) {
          message = '服务器内部错误';
        } else {
          message =
            typeof res === 'string'
              ? res
              : ((res as { message?: string | string[] }).message as string) ||
                message;
          if (Array.isArray(message)) {
            message = message.join('; ');
          }
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
      .status(resolveHttpStatus(exception))
      .setHeader('Cache-Control', 'no-store')
      .json({
        code,
        message,
        success: false,
        data: null,
      });
  }
}
