import { throwUnauthorized } from 'src/common/exceptions/biz-error.util';

export function assertAuthUser<T>(err: unknown, user: T): T {
  if (err || !user) {
    throwUnauthorized('登录已过期，请重新登录');
  }
  return user;
}
