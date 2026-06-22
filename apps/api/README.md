# API 应用

这是项目的 NestJS 后端应用，负责 HTTP API、业务服务和未来 Agent 编排入口。

## 当前职责

- 提供 `/health` 健康检查接口；
- 通过 TypeORM 连接 PostgreSQL；
- 暴露未来业务模块和 Agent 编排模块的入口。

## 当前不做

- 不直接实现复杂 Agent 推理；
- 不在 Controller 中堆业务流程；
- 不接入真实 LLM；
- 不引入队列、多 Agent 或 RAG。

## 启动步骤

1. 开启本机docker
2. 执行以下命令

```bash
pnpm db:up
pnpm db:migrate
pnpm dev:api
```

健康检查：

```text
http://localhost:3000/health
```
