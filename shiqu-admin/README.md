# shiqu-admin

拾趣好物 B 端管理后台（Vue3 + Vite + TypeScript + Element Plus）

## 功能

- 管理员登录
- 用户管理（列表、编辑、启用/禁用）
- 商品管理（增删改、上下架、图片上传）
- 订单管理（列表、详情、改状态）

## 技术栈

- Vue 3
- Vite
- TypeScript
- Pinia
- Vue Router
- Axios
- Element Plus

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务（端口 5174）
npm run dev

# 构建
npm run build
```

## 环境变量

```bash
cp .env.example .env
```

| 变量 | 说明 |
|------|------|
| `VITE_API_BASE_URL` | 后端地址。开发可留空，走 Vite 代理到 `localhost:3000` |

生产示例见 `.env.production.example`：

```env
VITE_API_BASE_URL=https://admin-api.shiqu.com
```

## 目录结构

```
src/
├── api/           # 接口封装
├── stores/        # Pinia（admin_token）
├── router/        # 路由与登录守卫
├── layouts/       # 后台布局
├── views/         # 页面
├── components/    # 通用组件（图片上传）
├── types/         # 类型
└── utils/         # 本地存储等
```

## 联调说明

1. 先启动 `shiqu-server`（默认 `http://localhost:3000`）
2. 执行 `npm run seed` 预置管理员：`admin / admin123`
3. 再启动本项目：`npm run dev`
4. 访问：`http://localhost:5174`
