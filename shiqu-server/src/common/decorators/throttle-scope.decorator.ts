import { applyDecorators } from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { THROTTLE } from 'src/config/throttle.config';

/** 普通接口：仅走 default 规则 */
export function DefaultThrottled() {
  return applyDecorators(SkipThrottle({ strict: true, ai: true }));
}

/** 认证类接口：仅走 strict 规则 */
export function StrictAuth() {
  return applyDecorators(
    SkipThrottle({ default: true, ai: true }),
    Throttle({ strict: THROTTLE.AUTH }),
  );
}

/** 发送验证码：strict 规则，更严 limit */
export function StrictOtp() {
  return applyDecorators(
    SkipThrottle({ default: true, ai: true }),
    Throttle({ strict: THROTTLE.OTP }),
  );
}

/** AI 对话：仅走 ai 规则 */
export function AiChat() {
  return applyDecorators(
    SkipThrottle({ default: true, strict: true }),
    Throttle({ ai: THROTTLE.AI_CHAT }),
  );
}

/** AI 文档解析：ai 规则，更严 limit */
export function AiDocument() {
  return applyDecorators(
    SkipThrottle({ default: true, strict: true }),
    Throttle({ ai: THROTTLE.AI_DOCUMENT }),
  );
}

/** 健康检查等：跳过全部限流 */
export function SkipAllThrottlers() {
  return applyDecorators(
    SkipThrottle({ default: true, strict: true, ai: true }),
  );
}
