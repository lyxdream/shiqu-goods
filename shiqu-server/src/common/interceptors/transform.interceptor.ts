import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable, map } from 'rxjs';
import { ResponseCode } from 'src/common/constants/response-code';
import type { ApiResponse } from 'src/common/interfaces/api-response.interface';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    const res = context.switchToHttp().getResponse<Response>();
    res.setHeader('Cache-Control', 'no-store');

    return next.handle().pipe(
      map((data) => ({
        code: ResponseCode.SUCCESS,
        message: 'success',
        success: true,
        data,
      })),
    );
  }
}
