# 拾趣好物 · AI 服务（shiqu-ai）

Python + FastAPI 独立服务，由 `shiqu-server` 通过 `AI_SERVICE_URL` HTTP 中转调用。不包含前端页面。

## 目录结构

```text
shiqu-ai/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI 入口，挂载路由
│   ├── config.py               # 环境变量配置
│   ├── schemas.py              # 请求/响应模型
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── health.py           # GET  /health
│   │   ├── chat.py             # POST /chat（MVP）
│   │   └── document.py         # POST /document/parse（预留）
│   └── services/
│       ├── __init__.py
│       ├── chat_service.py     # 商品答疑 / 订单 FAQ 逻辑
│       ├── document_service.py # 文档解析占位
│       └── session_store.py    # 内存会话
│
├── .env.example
├── .gitignore
├── requirements.txt
└── README.md
```

## 能力对照

| 路径 | 文件 | 状态 |
|------|------|------|
| `GET /health` | `routers/health.py` | 可用 |
| `POST /chat` | `routers/chat.py` + `services/chat_service.py` | MVP + 推荐 / 种草 |
| `POST /document/parse` | `routers/document.py` + `services/document_service.py` | 预留，未实现 |

推荐相关服务：

| 文件 | 说明 |
|------|------|
| `services/recommend_service.py` | 站内商品推荐，**仅返回 context.products 中的 ID** |
| `services/grass_copy_service.py` | 基于单商品 context 生成种草文案 |

## 端口

默认 `8000`

## 启动

建议 Python **3.11 ~ 3.13**（系统若是 3.14，可用 conda/pyenv 指定版本）。

```bash
cd shiqu-ai
python3.13 -m venv .venv   # 或 python3.11 / python3.12
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 接口文档

服务启动后访问（FastAPI 自带）：

| 文档 | 地址 |
|------|------|
| Swagger UI | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |
| OpenAPI JSON | http://localhost:8000/openapi.json |

> C 端实际调用的是 Nest 中转接口，业务侧文档见：http://localhost:3000/api-docs

## 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查 |
| POST | `/chat` | MVP 对话（商品答疑 / 购物订单 FAQ） |
| POST | `/document/parse` | 文档解析（预留，暂未开放） |

## MVP 范围

1. **商品智能答疑**（`scene=product_qa`）：依赖 Nest 注入的商品上下文
2. **购物流程 & 订单答疑**（`scene=order_help` / `assistant`）
3. **站内商品推荐**（`scene=product_recommend` / `assistant` 内识别推荐意图）：依赖 Nest 注入 `context.products`，响应 `productIds` **仅允许站内 ID**
4. **种草文案**（`scene=grass_copy`）：依赖 Nest 注入 `context.product`，C 端从商品详情「AI 种草文案」进入

采购清单等能力未实现。

## 与业务数据

- 用户 / 商品 / 订单：仍在 MySQL，由 Nest 查询后写入 `context` 再转发
- 会话：当前进程内内存，重启丢失


备注：
浏览器/Nest
    → uvicorn（服务器）
        → FastAPI（路由框架）
            → pydantic（请求体校验）
            → pydantic-settings + python-dotenv（读配置）
FastAPI：写接口
uvicorn：把接口进程跑起来
pydantic：保证 JSON 字段类型对、格式对
pydantic-settings：config.py 的 Settings，读端口、应用名等
python-dotenv：给 pydantic-settings 读 .env 用（env_file=".env"）
 从 .env 读配置，不用把端口写死在代码里