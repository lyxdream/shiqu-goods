import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { throwForbidden } from 'src/common/exceptions/biz-error.util';
import { NextFunction, Request, Response } from 'express';

/** 管理域名也允许访问的共享 API 前缀 */
const SHARED_API_PREFIXES = ['/api/upload'];

@Injectable()
export class ApiHostMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}

  use(req: Request, _res: Response, next: NextFunction) {
    const nodeEnv = this.configService.get<string>('app.nodeEnv');
    if (nodeEnv !== 'production') {
      return next();
    }

    const apiHost = this.configService.get<string>('app.apiHost');
    const adminApiHost = this.configService.get<string>('app.adminApiHost');
    const host = req.hostname;
    const isAdminPath = req.path.startsWith('/api/admin');
    const isSharedPath = SHARED_API_PREFIXES.some((prefix) =>
      req.path.startsWith(prefix),
    );

    if (host === apiHost && isAdminPath) {
      throwForbidden('C 端域名禁止访问管理接口');
    }

    if (
      host === adminApiHost &&
      req.path.startsWith('/api/') &&
      !isAdminPath &&
      !isSharedPath
    ) {
      throwForbidden('管理域名禁止访问用户接口');
    }

    next();
  }
}
