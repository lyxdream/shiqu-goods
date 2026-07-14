import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

@Injectable()
export class RedisService {
  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis) {}

  /** 设置键值，ttlSeconds 为可选过期秒数 */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  /** 递增计数器，返回递增后的值 */
  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  /** 设置过期时间（仅当键存在时） */
  async expire(key: string, ttlSeconds: number): Promise<void> {
    await this.client.expire(key, ttlSeconds);
  }

  /** Sorted Set：添加成员，score 为过期时间戳（秒） */
  async zadd(key: string, score: number, member: string): Promise<void> {
    await this.client.zadd(key, score, member);
  }

  /** Sorted Set：获取成员的 score，不存在返回 null */
  async zscore(key: string, member: string): Promise<number | null> {
    const val = await this.client.zscore(key, member);
    return val === null ? null : parseFloat(val);
  }

  /** Sorted Set：移除指定成员 */
  async zrem(key: string, member: string): Promise<void> {
    await this.client.zrem(key, member);
  }

  /** Sorted Set：移除 score 在 [min, max] 范围内的所有成员（用于清理过期 jti） */
  async zremrangebyscore(key: string, min: number, max: number): Promise<void> {
    await this.client.zremrangebyscore(key, min, max);
  }

  /** 获取原始 ioredis 实例（供 ThrottlerStorage 使用） */
  getClient(): Redis {
    return this.client;
  }
}
