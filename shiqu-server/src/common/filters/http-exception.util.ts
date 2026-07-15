import {
  HttpException,
  HttpStatus,
  MethodNotAllowedException,
  NotFoundException,
} from '@nestjs/common';
import { ResponseCode } from 'src/common/constants/response-code';
import { BusinessException } from 'src/common/exceptions/business.exception';

/** Nest HttpException 状态码 → 业务 code（HTTP 响应体仍可能为 200） */
export function mapHttpStatusToBusinessCode(status: number): number {
  const map: Record<number, number> = {
    [HttpStatus.UNAUTHORIZED]: ResponseCode.UNAUTHORIZED,
    [HttpStatus.BAD_REQUEST]: ResponseCode.VALIDATION_ERROR,
    [HttpStatus.CONFLICT]: ResponseCode.ALREADY_EXISTS,
    [HttpStatus.NOT_FOUND]: ResponseCode.NOT_FOUND,
    [HttpStatus.FORBIDDEN]: ResponseCode.FORBIDDEN,
    [HttpStatus.METHOD_NOT_ALLOWED]: ResponseCode.METHOD_NOT_ALLOWED,
    [HttpStatus.TOO_MANY_REQUESTS]: ResponseCode.RATE_LIMITED,
  };
  return map[status] ?? ResponseCode.INTERNAL_ERROR;
}

/** Nest 无匹配路由时的固定文案，如 "Cannot GET /api/xxx" */
export const ROUTE_NOT_FOUND_PATTERN =
  /^Cannot (GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS) /;

export function getNotFoundExceptionMessage(
  exception: NotFoundException,
): string {
  const res = exception.getResponse();
  if (typeof res === 'string') {
    return res;
  }
  const msg = (res as { message?: string | string[] }).message;
  if (typeof msg === 'string') {
    return msg;
  }
  if (Array.isArray(msg)) {
    return msg.join('; ');
  }
  return '';
}

/** 框架路由层 404（非业务误抛的 NotFoundException） */
export function isFrameworkRouteNotFound(
  exception: NotFoundException,
): boolean {
  return ROUTE_NOT_FOUND_PATTERN.test(getNotFoundExceptionMessage(exception));
}

/** Multer 单文件大小超限等错误 */
export function isMulterFileSizeError(exception: unknown): boolean {
  if (!exception || typeof exception !== 'object') {
    return false;
  }
  const err = exception as { code?: string };
  return err.code === 'LIMIT_FILE_SIZE';
}

/**
 * 解析应对客户端返回的 HTTP 状态码：
 * - 5xx：未捕获异常、显式 HttpException(5xx) 等服务端故障
 * - 404：框架路由 NotFoundException（Cannot GET/POST...）
 * - 200：业务误抛 NotFoundException 等（由 body.code 区分）
 * - 405：HTTP 方法不允许
 * - 200：业务错误、参数校验、限流等（由 body.code 区分）
 */
export function resolveHttpStatus(exception: unknown): number {
  if (exception instanceof BusinessException) {
    return HttpStatus.OK;
  }
  if (exception instanceof NotFoundException) {
    return isFrameworkRouteNotFound(exception)
      ? HttpStatus.NOT_FOUND
      : HttpStatus.OK;
  }
  if (exception instanceof MethodNotAllowedException) {
    return HttpStatus.METHOD_NOT_ALLOWED;
  }
  if (isMulterFileSizeError(exception)) {
    return HttpStatus.OK;
  }
  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    if (status >= 500) {
      return status;
    }
    return HttpStatus.OK;
  }
  return HttpStatus.INTERNAL_SERVER_ERROR;
}

export const RATE_LIMIT_MESSAGE = '请求过于频繁，请稍后再试';

export const ROUTE_NOT_FOUND_MESSAGE = '接口不存在';

export const METHOD_NOT_ALLOWED_MESSAGE = '请求方法不允许';

export const FILE_SIZE_LIMIT_MESSAGE = '文件大小超出限制';
