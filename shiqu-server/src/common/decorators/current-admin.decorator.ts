import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface JwtAdminPayload {
  sub: number;
  username: string;
  type: 'admin';
}

export const CurrentAdmin = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtAdminPayload => {
    const request = ctx.switchToHttp().getRequest<{ user: JwtAdminPayload }>();
    return request.user;
  },
);
