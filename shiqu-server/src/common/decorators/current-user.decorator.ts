import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { JwtUserPayload } from 'src/common/types/jwt-payload';

export type { JwtUserPayload };

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtUserPayload => {
    const request = ctx.switchToHttp().getRequest<{ user: JwtUserPayload }>();
    return request.user;
  },
);
