import { registerAs } from '@nestjs/config';

export interface ThrottleSettings {
  ttl: number;
  defaultLimit: number;
  strictLimit: number;
  otpLimit: number;
  aiChatLimit: number;
  aiDocumentLimit: number;
}

function loadThrottleSettings(): ThrottleSettings {
  const ttl = parseInt(process.env.THROTTLE_TTL_MS || '60000', 10);
  return {
    ttl,
    defaultLimit: parseInt(process.env.THROTTLE_DEFAULT_LIMIT || '120', 10),
    strictLimit: parseInt(process.env.THROTTLE_AUTH_LIMIT || '5', 10),
    otpLimit: parseInt(process.env.THROTTLE_OTP_LIMIT || '3', 10),
    aiChatLimit: parseInt(process.env.THROTTLE_AI_CHAT_LIMIT || '20', 10),
    aiDocumentLimit: parseInt(
      process.env.THROTTLE_AI_DOCUMENT_LIMIT || '5',
      10,
    ),
  };
}

const settings = loadThrottleSettings();

/** 供 @StrictAuth / @AiChat 等装饰器覆盖单接口 limit */
export const THROTTLE = {
  AUTH: { ttl: settings.ttl, limit: settings.strictLimit },
  OTP: { ttl: settings.ttl, limit: settings.otpLimit },
  AI_CHAT: { ttl: settings.ttl, limit: settings.aiChatLimit },
  AI_DOCUMENT: { ttl: settings.ttl, limit: settings.aiDocumentLimit },
} as const;

/** 注册到 ThrottlerModule 的三条命名规则 */
export function toThrottlerDefinitions(s: ThrottleSettings) {
  return [
    { name: 'default', ttl: s.ttl, limit: s.defaultLimit },
    { name: 'strict', ttl: s.ttl, limit: s.strictLimit },
    { name: 'ai', ttl: s.ttl, limit: s.aiChatLimit },
  ];
}

export default registerAs('throttle', () => settings);
