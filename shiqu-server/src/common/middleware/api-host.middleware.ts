import {
  ForbiddenException,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';

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

    if (host === apiHost && isAdminPath) {
      throw new ForbiddenException('C 端域名禁止访问管理接口');
    }

    if (host === adminApiHost && req.path.startsWith('/api/') && !isAdminPath) {
      throw new ForbiddenException('管理域名禁止访问用户接口');
    }

    next();
  }
}
