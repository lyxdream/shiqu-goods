import { ResponseCode } from 'src/common/constants/response-code';
import { BusinessException } from './business.exception';

export function throwNotFound(message: string): never {
  throw new BusinessException(ResponseCode.NOT_FOUND, message);
}

export function throwValidation(message: string): never {
  throw new BusinessException(ResponseCode.VALIDATION_ERROR, message);
}

export function throwBusiness(message: string): never {
  throw new BusinessException(ResponseCode.BUSINESS_ERROR, message);
}

export function throwForbidden(message: string): never {
  throw new BusinessException(ResponseCode.FORBIDDEN, message);
}

export function throwAlreadyExists(message: string): never {
  throw new BusinessException(ResponseCode.ALREADY_EXISTS, message);
}

export function throwInvalidCredentials(message: string): never {
  throw new BusinessException(ResponseCode.INVALID_CREDENTIALS, message);
}

export function throwUnauthorized(message: string): never {
  throw new BusinessException(ResponseCode.UNAUTHORIZED, message);
}

export function throwAccountDisabled(message: string): never {
  throw new BusinessException(ResponseCode.ACCOUNT_DISABLED, message);
}
