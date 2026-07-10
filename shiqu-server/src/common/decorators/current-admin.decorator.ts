import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { JwtAdminPayload } from 'src/common/types/jwt-payload';

export type { JwtAdminPayload };

export const CurrentAdmin = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtAdminPayload => {
    const request = ctx.switchToHttp().getRequest<{ user: JwtAdminPayload }>();
    return request.user;
  },
);
