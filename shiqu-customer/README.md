# 拾趣好物 · C 端前台

Vite + Vue3 + TypeScript + Vant

## 启动

```bash
npm install
npm run dev
```

默认端口：`5173`  
开发代理：`/api`、`/uploads` → `http://localhost:3000`

开发时支持热更新（HMR）：

- 修改 `src/` 内 `.vue` / `.ts` / `.css` 自动热替换，无需手动刷新
- 修改 `index.html`、`public/flexible.js`、`postcss.config.cjs` 会自动整页刷新
- 局域网访问：`npm run dev` 后使用终端里 `Network` 地址（如 `http://192.168.x.x:5173`）在手机调试

## 移动端适配

采用 **flexible + postcss-pxtorem**：

| 部分 | 说明 |
|------|------|
| `public/flexible.js` | 在 `index.html` **同步**引入，设置 `html font-size = clientWidth / 10` |
| `postcss.config.cjs` | `px` → `rem`，`rootValue: 37.5` |

**注意：** `flexible.js` 必须早于 `main.ts` 执行；放在 `main.ts` 里 `import` 会太晚，rem 字号会偏小。

样式按 **375 逻辑像素** 写（写 `16px` 即手机显示约 16px），与 Vant 一致。

## 功能

- 注册 / 登录
- 商品列表、详情下单（无购物车）
- 收货地址管理
- 我的订单、模拟付款
- 个人中心（资料 / 改密）
- AI 对话助手（含种草文案、商品推荐）

## AI 功能入口

所有 AI 请求经 Nest 网关（`/api/ai/chat`）转发至 Python AI 服务，通过 `scene` 字段区分场景。

### 入口位置

**个人中心** `/profile`

| 按钮 | 跳转 | 说明 |
|------|------|------|
| 购物 AI 助手 | `/ai/chat?scene=assistant` | 通用对话，支持商品推荐、购物流程、订单问题 |

**商品详情** `/product/:id`

| 按钮 | 跳转 / 行为 | 说明 |
|------|------------|------|
| AI 咨询 | `/ai/chat?scene=product_qa&productId=xxx` | 针对当前商品发起答疑 |
| 种草文案 | `/ai/chat?scene=grass_copy&productId=xxx` | 自动生成小红书 / 朋友圈风格种草文案 |
| 种草海报 | 弹窗（无跳转） | 直接生成可保存的种草海报，含商品二维码 |

**订单详情** `/order/:id`

| 按钮 | 跳转 | 说明 |
|------|------|------|
| 订单问题咨询 | `/ai/chat?scene=order_help&orderId=xxx` | 针对当前订单发起问题咨询 |

### 对话场景（scene）

| scene | 触发方式 | 说明 |
|-------|----------|------|
| `assistant`（默认）| 无参数直接进入 | 通用购物助手，自动识别推荐 / 订单 / 流程意图 |
| `product_recommend` | AI 识别到推荐意图时自动切换 | 强制返回站内商品 ID 列表，前端可渲染商品卡片 |
| `grass_copy` | `?scene=grass_copy&productId=xxx` | 根据商品信息生成小红书 / 朋友圈风格种草文案 |

### 海报生成

入口：`GrassPoster.vue` 组件，由商品详情页或对话页按需挂载。

| 模板 | 尺寸 | 说明 |
|------|------|------|
| 小红书竖版 | 750 × 1100 | 全出血图片 + 白色悬浮卡片，含商品名 / 价格 / 摘要 |
| 朋友圈方图 | 750 × 750 | 全图背景 + 双层渐变遮罩，文字叠加在底部 |

海报渲染逻辑见 `src/utils/grass-poster.ts`，纯 Canvas 绘制，无外部依赖。

## 环境变量

见 `.env.example`：

```
VITE_API_BASE_URL=
```
