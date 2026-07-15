# 生产环境部署说明

本文档汇总 **shiqu-goods**  monorepo 上线前需要修改的配置、发布顺序与 Nginx 示例。各子项目细节可参考对应目录下的 `.env.example` 与 README。

---

## 一、架构概览

```text
用户浏览器
  ├── C 端 (shiqu-customer 静态)  ──→  api.example.com      ──→  shiqu-server:3000
  ├── 管理端 (shiqu-admin 静态)   ──→  admin-api.example.com ──→  shiqu-server:3000
  └── （内网）shiqu-server ──→ shiqu-ai:8000

依赖：MySQL、Redis（限流 + Token 白名单）
```

**shiqu-server** 是唯一对外提供业务 API 的后端；**shiqu-ai** 仅内网访问，由 server 转发调用。

---

## 二、部署前检查清单

| # | 项 | 说明 |
|---|-----|------|
| 1 | MySQL | 创建数据库 `shiqu_goods`，账号最小权限 |
| 2 | Redis | 生产建议设密码；详见 [第三节 Redis 部署与密码](#三redis-部署与密码) |
| 3 | Migration | `DB_SYNC=false`，发布前执行 `npm run migration:run`（仅一次） |
| 4 | 密钥 | JWT / Admin JWT / AI 内部密钥使用强随机值，勿用示例默认值 |
| 5 | 反代 | Node 不直接暴露公网；配置 Nginx + `TRUST_PROXY=1` |
| 6 | 静态资源 | C 端 / 管理端 `npm run build` 后由 Nginx 托管 |
| 7 | 上传目录 | `UPLOAD_DIR` 需持久化卷，多实例共享或统一对象存储 |
| 8 | 初始管理员 | 首次部署执行 `npm run seed`（仅一次） |

---

## 三、Redis 部署与密码

shiqu-server 依赖 Redis 做**接口限流**与 **Token 白名单**（登出、改密码后失效）。生产环境建议为 Redis 设置访问密码，且需在**两个地方**配置一致。

### 3.1 在哪里设置

| 位置 | 配置项 | 说明 |
|------|--------|------|
| **Redis 服务端** | `requirepass` | 让 Redis 本身要求密码才能连接 |
| **shiqu-server/.env** | `REDIS_PASSWORD` | 应用连接 Redis 时使用，须与服务端密码相同 |

应用读取方式见 `shiqu-server/src/config/redis.config.ts` 中的 `REDIS_PASSWORD`。开发环境本地 Redis 通常无密码，`.env` 中 `REDIS_PASSWORD` 留空即可。

### 3.2 什么时候设置

| 阶段 | 操作 |
|------|------|
| **部署 Redis 时** | 在 Redis 服务端设置 `requirepass`（生产建议必设） |
| **编写 shiqu-server/.env 时** | 填写相同的 `REDIS_PASSWORD` |
| **启动 shiqu-server / 执行 seed 前** | 两边密码必须一致且 Redis 已可连接 |

Redis 需在 `migration:run`、`seed`、`start:prod` **之前**就绪（seed 会启动完整 AppModule，也会连 Redis）。

### 3.3 Redis 服务端示例

**redis.conf（自建）：**

```conf
requirepass 替换为生产Redis密码
```

修改后重启 Redis，或使用 `redis-cli CONFIG SET requirepass '密码'`（重启后可能丢失，正式环境请写进配置文件）。

**Docker Compose：**

```yaml
redis:
  image: redis:7
  command: redis-server --requirepass 替换为生产Redis密码
  ports:
    - "127.0.0.1:6379:6379"
```

**云 Redis（阿里云 / 腾讯云等）：** 在控制台创建实例时设置访问密码。

### 3.4 shiqu-server 侧配置

在 `shiqu-server/.env` 中填写与 Redis 服务端相同的密码：

```env
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=替换为生产Redis密码
```

### 3.5 验证

```bash
# 1. 确认 Redis 可用（将密码换成实际值）
redis-cli -a '替换为生产Redis密码' ping
# 期望返回 PONG

# 2. 再启动后端，日志中不应出现 Redis 连接错误
cd shiqu-server && npm run start:prod
```

---

## 四、推荐发布顺序

```bash
# 0. 前置：MySQL / Redis 已部署，shiqu-server/.env 已按第四节配好（含 REDIS_PASSWORD）

# 1. 数据库迁移（在 shiqu-server 目录）
cd shiqu-server
npm run migration:run

# 2. 首次部署：初始化管理员（仅需一次；需 MySQL + Redis + 完整 .env 已就绪）
NODE_ENV=production SEED_ADMIN_PASSWORD='你的强密码' npm run seed

# 3. 构建并启动后端
npm run build
npm run start:prod          # 或使用 pm2 / systemd

# 4. 启动 AI 服务（内网，不对外）
cd ../shiqu-ai
# 配置 .env 后
uvicorn app.main:app --host 127.0.0.1 --port 8000

# 5. 构建前端
cd ../shiqu-customer && npm run build
cd ../shiqu-admin && npm run build
```

之后每次发版：**migration（如有新迁移）→ 构建 → 滚动重启**，不要在多实例启动时依赖应用自动跑 migration。

---

## 五、各服务环境变量（生产必改项）

### 5.1 shiqu-server

复制 `shiqu-server/.env.example` 为 `.env`，按生产环境修改。下表列出**必须调整**的项，完整示例见后文。

| 变量 | 生产建议 | 说明 |
|------|----------|------|
| `NODE_ENV` | `production` | 开启生产校验（JWT 密钥、DB_SYNC、AI 密钥等） |
| `TRUST_PROXY` | `1` | 单层 Nginx 反代；CDN+Nginx 等多层时改为实际 hop 数 |
| `PORT` | `3000` | 仅内网监听，由 Nginx 转发 |
| `API_HOST` | `api.example.com` | C 端 API 域名，用于域名隔离中间件 |
| `ADMIN_API_HOST` | `admin-api.example.com` | 管理端 API 域名 |
| `CORS_ORIGINS` | 前端正式域名 | 逗号分隔，如 `https://shop.example.com,https://admin.example.com` |
| `DB_*` | 生产库连接 | **`DB_SYNC=false`（强制）** |
| `JWT_SECRET` | 强随机字符串 | 未配置时生产启动失败 |
| `ADMIN_JWT_SECRET` | 强随机字符串 | 与用户 JWT 分开 |
| `REDIS_HOST` / `REDIS_PASSWORD` | 生产 Redis | 须与 Redis 服务端密码一致，见 [第三节](#三redis-部署与密码) |
| `AI_SERVICE_URL` | `http://127.0.0.1:8000` | AI 内网地址 |
| `AI_INTERNAL_SECRET` | 强随机字符串 | 与 shiqu-ai 的 `INTERNAL_SECRET` 一致 |
| `SWAGGER_ENABLED` | `false` | 生产默认关闭 API 文档 |
| `SEED_ADMIN_PASSWORD` | 仅 seed 时用 | 生产 seed 必须传入，禁止弱口令 |

#### 生产环境完整 `.env` 示例

文件路径：`shiqu-server/.env`。请将 `example.com`、密码、密钥等替换为实际值。

```env
# ── App ──────────────────────────────────────────────
PORT=3000
NODE_ENV=production
# 反向代理层数：单层 Nginx 用 1；CDN + Nginx 等多层时按实际 hop 数调整
TRUST_PROXY=1

# API 域名（生产环境 ApiHostMiddleware 按 Host 隔离 C 端 / 管理端接口）
API_HOST=api.example.com
ADMIN_API_HOST=admin-api.example.com

# CORS：填写前端页面域名（非 API 域名），多个用英文逗号分隔
CORS_ORIGINS=https://shop.example.com,https://admin.example.com

# ── Database ─────────────────────────────────────────
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=shiqu
DB_PASSWORD=替换为生产数据库密码
DB_NAME=shiqu_goods
# 生产必须为 false；表结构变更通过 migration 管理，部署前执行 npm run migration:run
DB_SYNC=false

# ── JWT - C 端用户 ───────────────────────────────────
JWT_SECRET=替换为至少32位强随机字符串
# 用户 Token 有效期（天），对应 jwt.config.ts 中的 JWT_EXPIRES_IN_DAYS
JWT_EXPIRES_IN_DAYS=7

# ── JWT - B 端管理员 ─────────────────────────────────
ADMIN_JWT_SECRET=替换为与用户JWT不同的强随机字符串
ADMIN_JWT_EXPIRES_IN=7d

# ── Upload ───────────────────────────────────────────
UPLOAD_DIR=uploads
# 单文件上限（字节），5242880 = 5MB
UPLOAD_MAX_SIZE=5242880

# ── Seed 管理员（仅首次部署、手动执行 npm run seed 时使用）──
SEED_ADMIN_USERNAME=admin
# 生产常驻 .env：下面两项保持留空，不要把初始管理员密码写进 .env 文件
SEED_ADMIN_PASSWORD=
SEED_ADMIN_PASSWORD_DEFAULT=
# 首次部署时在命令行临时传入强密码（仅 seed 脚本读取，非常驻配置）：
#   cd shiqu-server
#   NODE_ENV=production SEED_ADMIN_PASSWORD='你的强密码' npm run seed
# 说明：
#   - SEED_ADMIN_PASSWORD：生产 seed 必填，但建议只在命令行传，不要写入 .env
#   - SEED_ADMIN_PASSWORD_DEFAULT：仅开发环境生效，生产可留空
#   - 若管理员已存在，seed 会跳过，不会改密码

# ── Order ────────────────────────────────────────────
# 待付款订单超时自动取消（分钟）
ORDER_PENDING_TIMEOUT_MINUTES=30

# ── Redis（密码须与 Redis 服务端 requirepass 一致，见第三节）──
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=替换为生产Redis密码

# ── 限流（次 / THROTTLE_TTL_MS 毫秒窗口，默认 60 秒）──
# 命名规则：default（普通接口）/ strict（登录注册验证码）/ ai（AI 接口）
THROTTLE_TTL_MS=60000
THROTTLE_DEFAULT_LIMIT=120
THROTTLE_AUTH_LIMIT=5
THROTTLE_OTP_LIMIT=3
THROTTLE_AI_CHAT_LIMIT=20
THROTTLE_AI_DOCUMENT_LIMIT=5

# ── AI Service ───────────────────────────────────────
# shiqu-ai 内网地址，禁止暴露到公网
AI_SERVICE_URL=http://127.0.0.1:8000
# 与 shiqu-ai/.env 的 INTERNAL_SECRET 保持一致；生产必填
AI_INTERNAL_SECRET=替换为与shiqu-ai一致的强随机字符串

# ── Swagger ──────────────────────────────────────────
# 生产默认关闭；除非内网调试，否则保持 false
SWAGGER_ENABLED=false
```

### 5.2 shiqu-ai

本地开发：`cp shiqu-ai/.env.example .env`。  
生产部署：填写 `shiqu-ai/.env.production` 后执行 `cp .env.production .env`。

该服务**仅内网**供 shiqu-server 调用，不应对公网开放。

| 变量 | 生产建议 | 说明 |
|------|----------|------|
| `APP_ENV` | `production` | 强制校验 `INTERNAL_SECRET`，关闭 `/docs` |
| `APP_HOST` | `127.0.0.1` | 只监听本机或内网 |
| `APP_PORT` | `8000` | 与 server 的 `AI_SERVICE_URL` 端口一致 |
| `INTERNAL_SECRET` | 与 server 一致 | 未配置时拒绝启动 |
| `LLM_ENABLED` | 按需 | `true` 启用大模型，`false` 走规则引擎 |
| `LLM_API_KEY` | 按需 | 启用 LLM 时必填 |
| `LLM_BASE_URL` | 服务商地址 | 默认 DeepSeek |
| `LLM_MODEL` | 模型名 | 如 `deepseek-chat` |

#### 生产环境完整 `.env` 示例

也可直接使用仓库内 `shiqu-ai/.env.production` 模板。`INTERNAL_SECRET` 必须与 `shiqu-server` 的 `AI_INTERNAL_SECRET` 完全相同（`openssl rand -hex 32` 生成一次，两边填同一串）。

**方案 A：启用大模型（推荐有 AI 能力时）**

```env
APP_NAME=shiqu-ai
APP_HOST=127.0.0.1
APP_PORT=8000
APP_ENV=production

# 内部调用鉴权（与 shiqu-server 的 AI_INTERNAL_SECRET 保持一致）
INTERNAL_SECRET=替换为与shiqu-server一致的强随机字符串

# ── LLM 配置 ──────────────────────────────────────────
LLM_ENABLED=true
LLM_API_KEY=替换为你的DeepSeek_API_Key
LLM_BASE_URL=https://api.deepseek.com
# deepseek-chat（效果较好）或 deepseek-v3-0324（更快更省）
LLM_MODEL=deepseek-chat
```

**方案 B：不启用大模型（规则引擎兜底）**

```env
APP_NAME=shiqu-ai
APP_HOST=127.0.0.1
APP_PORT=8000
APP_ENV=production

INTERNAL_SECRET=替换为与shiqu-server一致的强随机字符串

LLM_ENABLED=false
LLM_API_KEY=
LLM_BASE_URL=https://api.deepseek.com
LLM_MODEL=deepseek-chat
```

启动示例（生产）：

```bash
cd shiqu-ai
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### 5.3 shiqu-customer / shiqu-admin

构建时注入（Vite 环境变量）：

| 变量 | 生产示例 |
|------|----------|
| `VITE_API_BASE_URL` | `https://api.example.com`（C 端） |
| `VITE_API_BASE_URL` | `https://admin-api.example.com`（管理端） |

```bash
# 示例：构建 C 端
VITE_API_BASE_URL=https://api.example.com 
npm run build
```

产物在各自 `dist/` 目录，由 Nginx 托管静态文件。

---

## 六、Nginx 配置要点

### 6.1 反向代理头（必配）

让 Express 正确解析客户端 IP 与 Host（配合 `TRUST_PROXY=1`）：

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

**注意：** 由 Nginx 覆盖写入 `X-Forwarded-For`，不要信任客户端直连 Node 时伪造的头。

### 6.2 域名隔离（与 API_HOST 对应）

生产环境 `ApiHostMiddleware` 会校验 Host：

- `api.example.com` → 仅允许 C 端 API（`/api/admin/*` 拒绝）
- `admin-api.example.com` → 仅允许管理 API（普通用户 API 拒绝，`/api/upload` 除外）

请为 C 端与管理端分别配置 server 块，或使用不同 `server_name` 指向同一 upstream，但 Host 头保持各自域名。

### 6.3 静态站点示例

```nginx
# C 端
server {
    listen 443 ssl;
    server_name shop.example.com;
    root /var/www/shiqu-customer/dist;
    location / { try_files $uri $uri/ /index.html; }
}

# 管理端
server {
    listen 443 ssl;
    server_name admin.example.com;
    root /var/www/shiqu-admin/dist;
    location / { try_files $uri $uri/ /index.html; }
}
```

### 6.4 上传文件

server 将 `UPLOAD_DIR`（默认 `uploads/`）作为静态目录对外提供。多实例部署时需：

- 使用共享存储（NFS / 对象存储），或
- 仅单实例提供上传，或
- 改为 OSS 等（若后续改造）

---

## 七、API 响应约定

`shiqu-server` 统一响应体格式：

```json
{ "code": 0, "message": "...", "success": true, "data": { ... } }
```

### HTTP 状态码与 body.code

| 场景 | HTTP | body.code | 说明 |
|------|------|-----------|------|
| 请求成功 | 200 | `0` 或 `1000` | `success: true` |
| 已进入业务链路（Guard、校验、限流、业务规则失败等） | **200** | `401` 未登录、`403` 无权限、`400` 参数错误、`1005` 资源不存在、`1008` 限流等 | 由 `body.code` 区分具体原因 |
| 路由 / 地址不存在 | **404** | `1005` | Nest 路由层 `NotFoundException` |
| HTTP 方法不允许 | **405** | `405` | 如对接口发错 GET/POST |
| 未捕获异常 / 服务故障 | **5xx** | `1099` | 客户端可统一提示「服务器繁忙」 |

### 前端处理建议

- **HTTP 404 / 405 / 5xx**：axios 默认视为失败，走响应拦截器的 `(error)` 分支（提示 + reject）。
- **HTTP 200 且 `success: false`**：走成功回调，按 `body.code` 分支（如 `401` 清 token 跳转登录）。
- 限流返回 **HTTP 200 + code 1008**，不是 HTTP 429。

---

## 八、安全要点

1. **Node 端口不对公网开放**，仅 Nginx / 内网 LB 可访问。
2. **`TRUST_PROXY` 仅在反代后开启**；应用若可被公网直连，客户端可伪造 IP 绕过限流。
3. **生产禁止 `DB_SYNC=true`**，代码已强制校验。
4. **AI 服务不对公网暴露**，通过 `INTERNAL_SECRET` 与 server 通信。
5. **Redis、MySQL** 使用独立账号与强密码，限制来源 IP。
6. **HTTPS** 在 Nginx 层终止，证书定期轮换。

---

## 九、多实例部署

| 场景 | 做法 |
|------|------|
| Migration | 发布脚本中**只执行一次** `migration:run`，不要在每个实例启动时跑 |
| 限流 | 已使用 Redis 存储，多实例共享计数 |
| 上传 | 见 6.4，需共享存储 |
| Session / Token | JWT + Redis 白名单，无粘性会话要求 |

---

## 十、健康检查

```bash
curl http://127.0.0.1:3000/health
```

该路径不走 `/api` 前缀，可用于负载均衡探活。

---

## 十一、常见问题

**Q：限流误伤所有用户？**  
A：检查是否已设 `TRUST_PROXY=1` 且 Nginx 正确转发 `X-Forwarded-For`。

**Q：启动或 seed 报 Redis 连接失败？**  
A：确认 Redis 已启动；服务端 `requirepass` 与 `.env` 中 `REDIS_PASSWORD` 一致。用 `redis-cli -a '密码' ping` 验证。

**Q：管理端调 API 返回「禁止访问用户接口」？**  
A：确认 `VITE_API_BASE_URL` 指向 `ADMIN_API_HOST`，且 Nginx 转发时 Host 为管理 API 域名。

**Q：发版后报列不存在？**  
A：漏跑 migration，在发版流程中补执行 `npm run migration:run`。

**Q：生产启动报 JWT / AI 密钥错误？**  
A：按第五节补全 `JWT_SECRET`、`ADMIN_JWT_SECRET`、`AI_INTERNAL_SECRET`（及 ai 侧 `INTERNAL_SECRET`）。

---

## 十二、相关文档

- 数据库与 migration：`shiqu-server/DATABASE.md`
- Redis 说明：`shiqu-server/src/shared/redis/README.md`
- 各子项目：对应目录 `README.md`、`.env.example`
