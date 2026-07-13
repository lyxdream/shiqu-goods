import { ResponseCode } from 'src/common/constants/response-code';
import { BusinessException } from 'src/common/exceptions/business.exception';

export function assertAuthUser<T>(err: unknown, user: T): T {
  if (err || !user) {
    throw new BusinessException(
      ResponseCode.UNAUTHORIZED,
      '登录已过期，请重新登录',
    );
  }
  return user;
}
