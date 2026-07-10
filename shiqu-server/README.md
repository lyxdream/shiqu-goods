# shiqu-server

拾趣好物业务后端（NestJS + TypeORM + MySQL）

## 技术栈

- NestJS 11
- TypeORM + MySQL 8.0
- JWT 鉴权（C 端 / B 端分离）
- Swagger API 文档
- 图片上传（本地存储）

## 目录结构

```
src/
├── common/          # 横切能力 + 公用 DTO/Entity/Enum
├── config/          # 环境配置
├── constants/       # 业务状态枚举
├── shared/          # db、logger 等基础设施 Module
├── migrations/      # 数据库迁移
└── modules/         # 业务模块
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env，配置数据库连接信息
```

### 3. 创建数据库

```sql
CREATE DATABASE shiqu_goods DEFAULT CHARACTER SET utf8mb4;
```

### 4. 预置管理员

```bash
npm run seed
```

预置账号：`admin` / `admin123`

### 5. 启动服务

```bash
# 开发模式
npm run start:dev

# 生产模式
npm run build
npm run start:prod
```

服务默认运行在 `http://localhost:3000`

## API 文档

开发环境启动后访问：`http://localhost:3000/api-docs`

## 主要接口

| 类型 | 前缀 | 说明 |
|------|------|------|
| C 端 | `/api/auth`、`/api/user`、`/api/products` 等 | 用户前台接口 |
| B 端 | `/api/admin/*` | 管理后台接口 |
| 上传 | `/api/upload/image` | 图片上传（C/B 端均可） |
| AI | `/api/ai/*` | 转发至 Python AI 服务 |
| 健康检查 | `/health` | 服务状态 |

## 生产部署

### 双 API 域名

- C 端：`api.shiqu.com` → 仅允许 `/api/*`（排除 `/api/admin`）
- B 端：`admin-api.shiqu.com` → 仅允许 `/api/admin/*`

Nginx 路径限制 + `api-host.middleware.ts` 双重校验。

### 静态资源

上传图片通过 `/uploads/` 访问，或由 Nginx 直接代理。

## 环境变量说明

见 `.env.example`


