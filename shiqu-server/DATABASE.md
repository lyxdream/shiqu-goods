# shiqu-server 数据库相关说明

本文档梳理本项目中所有与 MySQL / TypeORM 相关的配置、表结构与操作入口。

---

## 一、总览：数据库相关分 4 层

```text
1. 连接配置     → config + shared/db
2. 表结构定义   → entities
3. 模块注册仓库 → modules/*/xxx.module.ts 里的 TypeOrmModule.forFeature
4. 真正增删改查 → modules/*/xxx.service.ts（以及少量 strategy / seed）
```

**Controller 不直接操作数据库**，只调用 Service。

---

## 二、连接与基础设施

| 文件 | 作用 |
|------|------|
| `src/config/database.config.ts` | 读 `.env`，整理成 `database.xxx` |
| `src/shared/db/db.module.ts` | `TypeOrmModule.forRootAsync`，真正连 MySQL |
| `src/shared/db/db.service.ts` | 封装事务 `transaction()` |
| `src/migrations/` | 迁移目录；通过 `npm run migration:run` 执行 |
| `scripts/seed.ts` | 启动时往 `admins` 插初始管理员 |

### 配置取值链路

```text
.env
  ↓
ConfigModule.forRoot({ load: [databaseConfig, ...] })
  ↓
database.config.ts 把环境变量整理成对象
  ↓
ConfigService.get('database.xxx')
  ↓
TypeOrmModule.forRootAsync 拿到最终配置
```

### `.env` 与配置对应关系

| `.env` | `database.config.ts` | `db.module.ts` |
|--------|----------------------|----------------|
| `DB_HOST` | `host` | `configService.get('database.host')` |
| `DB_PORT` | `port` | `configService.get('database.port')` |
| `DB_USER` | `username` | `configService.get('database.username')` |
| `DB_PASSWORD` | `password` | `configService.get('database.password')` |
| `DB_NAME` | `database` | `configService.get('database.database')` |
| `DB_SYNC` | `synchronize` | `configService.get('database.synchronize')` |

### 开发环境自动建表

`.env` 中 `DB_SYNC=true` 时，启动服务后 TypeORM 会根据 Entity **自动同步表结构**（仅建议开发环境使用）。

生产环境应设为 `DB_SYNC=false`，部署前在 CI/发布脚本中执行 `npm run migration:run`（应用启动不会自动跑 migration，避免多实例竞争）。

---

## 三、表结构（Entity）

| 文件 | 对应表 |
|------|--------|
| `src/common/entities/base.entity.ts` | 公共字段：`id` / `created_at` / `updated_at` |
| `src/modules/user/entities/user.entity.ts` | `users` |
| `src/modules/admin-auth/entities/admin.entity.ts` | `admins` |
| `src/modules/address/entities/address.entity.ts` | `addresses` |
| `src/modules/product/entities/product.entity.ts` | `products` |
| `src/modules/order/entities/order.entity.ts` | `orders` |
| `src/modules/order/entities/order-item.entity.ts` | `order_items` |

这些文件**定义表结构**，本身不执行查询。业务 Entity 一般继承 `BaseEntity`。

### 数据库与表的关系

- **数据库** `shiqu_goods`：需手动创建（或 Docker 初始化）
- **表**：开发阶段由 TypeORM 根据 Entity 自动创建

```sql
CREATE DATABASE shiqu_goods DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## 四、真正操作数据库的地方（核心）

### 1. `src/modules/auth/auth.service.ts`

- `findOne`：查用户名是否存在
- `create` + `save`：注册用户
- `findOne`：登录查用户

### 2. `src/modules/admin-auth/admin-auth.service.ts`

- `findOne`：查管理员登录

### 3. `src/modules/user/user.service.ts`

- `findOne`：查个人资料
- `save`：改资料、改密码

### 4. `src/modules/user/user-admin.service.ts`

- `createQueryBuilder`：分页查用户列表
- `save`：编辑用户、改启用/禁用状态
- `findById`（复用 UserService）：查用户详情

### 5. `src/modules/address/address.service.ts`

- `find`：地址列表
- `create` + `save`：新增
- `save`：编辑
- `remove`：删除
- `findOne`：校验是否本人地址

### 6. `src/modules/product/product.service.ts`

- `find` / `findOne`：C 端商品列表、详情
- `createQueryBuilder`：B 端分页列表
- `create` + `save`：新增商品
- `save`：编辑、上下架
- `remove`：删除

### 7. `src/modules/order/order.service.ts`（最重）

- 用 `DbService.transaction` 做事务
- 事务里：查商品、扣库存、建订单、建订单明细
- `save`：模拟付款、改状态
- `find` / `findOne`：订单列表、详情
- `createQueryBuilder`：管理端订单分页

### 8. JWT Strategy（鉴权时查库）

| 文件 | 作用 |
|------|------|
| `src/modules/auth/strategies/jwt.strategy.ts` | 校验 token 时查 `users` |
| `src/modules/admin-auth/strategies/admin-jwt.strategy.ts` | 校验 token 时查 `admins` |

### 9. `scripts/seed.ts`

- 查 `admins` 是否已有 `admin`
- 没有就 `save` 一条管理员（默认 `admin` / `admin123`）

```bash
npm run seed
```

---

## 五、仓库注册（不是操作，但和数据库强相关）

各模块通过 `TypeOrmModule.forFeature([...])` 把 Entity 注册成可注入的 Repository：

| 模块 | 注册的实体 |
|------|------------|
| `auth.module.ts` | `User` |
| `admin-auth.module.ts` | `Admin` |
| `user.module.ts` | `User`（含 C 端 + B 端用户管理） |
| `address.module.ts` | `Address` |
| `product.module.ts` | `Product` |
| `order.module.ts` | `Order`、`OrderItem`、`Product` |

---

## 六、和数据库无关的模块

这些模块**不碰 MySQL**：

| 模块 | 说明 |
|------|------|
| `upload/` | 只写本地文件到 `uploads/` |
| `ai/` | HTTP 转发 Python AI 服务 |
| `common/guards`、`filters`、`interceptors` | 鉴权 / 响应包装，不直接查库 |

---

## 七、快速查找

| 你想找什么 | 去哪看 |
|------------|--------|
| 怎么连库 | `src/shared/db/db.module.ts` |
| 表结构 | `src/modules/*/entities/` |
| 增删改查业务逻辑 | `src/modules/*/xxx.service.ts` |
| 事务 | `src/shared/db/db.service.ts` + `order.service.ts` |
| 初始数据 | `scripts/seed.ts` |
| 环境变量 | `.env` / `.env.example` |

---

## 八、结论

所有数据库读写，几乎都集中在各业务模块的 `*.service.ts` 里：

- **Entity**：定义表
- **DbModule**：负责连接
- **Controller**：不直接碰数据库


总结：
.env 提供原始值 → database.config.ts 整理成 database.xxx → ConfigService.get('database.xxx') 在 db.module.ts 里取出来给 TypeORM 用。