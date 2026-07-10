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
- AI 对话、文档解析（经 Nest 转发）

## 环境变量

见 `.env.example`：

```
VITE_API_BASE_URL=
```
