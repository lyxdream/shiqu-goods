# Redis 模块

本模块封装 Redis 连接与常用操作，供全项目注入使用。当前 Redis 承担三类职责：**接口限流**、**C 端 JWT 白名单**、**忘记密码验证码**。

---

## 一、文件说明

| 文件 | 作用 |
|------|------|
| `redis.module.ts` | 注册 ioredis 客户端（`REDIS_CLIENT`）与 `RedisService`，`@Global()` 全局可用 |
| `redis.service.ts` | 封装 `get/set/del/incr`、Sorted Set 等常用方法 |
| `redis.constants.ts` | 注入令牌 `REDIS_CLIENT` |
| `src/config/redis.config.ts` | 读取 `.env` 中的 `REDIS_*` 配置 |

---

## 二、环境变量

| `.env` | 默认值 | 说明 |
|--------|--------|------|
| `REDIS_HOST` | `localhost` | Redis 地址 |
| `REDIS_PORT` | `6379` | 端口 |
| `REDIS_PASSWORD` | 空 | 生产建议设置，须与 Redis 服务端 `requirepass` 一致 |

生产部署与密码配置详见项目根目录 [`DEPLOYMENT.md`](../../../../DEPLOYMENT.md) 第三节。

应用启动时会立即连接 Redis（`lazyConnect: false`），连不上会导致服务无法启动；`npm run seed` 同样依赖 Redis。

---

## 三、已实现用途

### 3.1 接口限流

- **位置**：`app.module.ts` → `ThrottlerModule` + `ThrottlerStorageRedisService`
- **存储**：复用同一 `REDIS_CLIENT` 实例，键由 `@nest-lab/throttler-storage-redis` 管理
- **规则**：`default` / `strict` / `ai` 三条命名限流，阈值见 `THROTTLE_*` 环境变量
- **多实例**：多台 server 共享 Redis 计数，限流全局生效

按 IP 限流时依赖 `TRUST_PROXY` 正确解析客户端 IP（见 `DEPLOYMENT.md`）。

### 3.2 C 端 JWT 白名单（Sorted Set）

- **位置**：`auth.service.ts`（写入/吊销）、`jwt.strategy.ts`（校验）
- **键名**：`token:user:{userId}`
- **结构**：Sorted Set，member 为 JWT 的 `jti`，score 为 Token 过期时间戳（秒）

| 操作 | 行为 |
|------|------|
| 登录 | 清理过期 jti → `ZADD` 新 jti → 刷新键 TTL |
| 请求鉴权 | `ZSCORE` 检查 jti 是否在白名单 |
| 退出登录 | `ZREM` 移除当前 jti |
| 改密 / 重置密码 | `DEL` 整个键，所有设备下线 |

**说明：** B 端管理员 JWT 不走 Redis 白名单，仅 C 端用户 Token 使用此机制。

### 3.3 忘记密码验证码

- **位置**：`auth.service.ts` → `sendOtp` / `resetPassword`

| 键名 | 类型 | TTL | 说明 |
|------|------|-----|------|
| `otp:phone:{phone}` | String | 300s | 6 位短信验证码 |
| `otp:fail:{phone}` | String | 300s | 验证码错误次数，达 5 次锁定 |

验证成功后立即删除验证码键，防止重放。

---

## 四、键名汇总

```text
# 限流（库内部管理，勿手动删）
throttler:*

# C 端 Token 白名单
token:user:{userId}          → Sorted Set (jti → expiry)

# 忘记密码 OTP
otp:phone:{phone}            → String
otp:fail:{phone}             → String
```

---

## 五、在业务代码中使用

`RedisModule` 为全局模块，直接注入 `RedisService`：

```typescript
import { RedisService } from 'src/shared/redis/redis.service';

constructor(private readonly redisService: RedisService) {}

await this.redisService.set('key', 'value', 60);  // 60 秒过期
const val = await this.redisService.get('key');
await this.redisService.del('key');
```

需要原始 ioredis 客户端时（如自定义存储适配器）：

```typescript
import { REDIS_CLIENT } from 'src/shared/redis/redis.module';

constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}
// 或
this.redisService.getClient();
```

---

## 六、尚未实现

以下能力在架构上预留扩展点，**当前版本未做**：

- 热点商品缓存
- 管理员 Token 白名单
- 通用缓存层抽象

新增用途时请在本 README 补充键名约定，避免与现有键冲突。
