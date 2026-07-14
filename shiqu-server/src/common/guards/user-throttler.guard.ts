import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * 按登录用户 ID 计数的限流 Guard。
 * 用于已登录接口（如 AI 对话），防止单个用户刷接口。
 * 若未登录则退化为 IP 限流。
 */
@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    const user = req['user'] as { sub?: number } | undefined;
    return user?.sub ? `user:${user.sub}` : String(req['ip'] ?? 'unknown');
  }
}
