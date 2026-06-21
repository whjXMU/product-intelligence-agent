# 阶段 01 报告：MVP V0 工程骨架

## 阶段目标

初始化一个可运行、可迭代、可扩展的 Agent 应用工程骨架。

## 设计边界

### 当前立即实现

- pnpm monorepo；
- apps/web；
- apps/api；
- PostgreSQL + Docker Compose；
- TypeORM 连接；
- health check 闭环；
- packages/shared；
- packages/agent-core；
- packages/evals；
- 中文文档。

### 当前只预留

- Agent 核心抽象；
- evals 评估体系；
- migration 机制说明；
- observability/guardrails/tools/memory/workflow 的位置。

### 当前不实现

- 真实 LLM 调用；
- RAG；
- 多 Agent；
- 队列；
- 向量数据库。

## 执行结果

- 已建立根目录 pnpm workspace；
- 已创建 `apps/web` Vue3 + Vite + TypeScript 应用；
- 已创建 `apps/api` NestJS + TypeScript 应用；
- 已创建 PostgreSQL Docker Compose 配置；
- 已配置 TypeORM 数据库连接；
- 已实现后端 `/health` 接口；
- 已实现前端首页调用 `/health`；
- 已创建 `packages/shared`，包含 `HealthCheckResponse` DTO；
- 已创建 `packages/agent-core`，包含 tool、memory、workflow、guardrail、trace 最小 contract；
- 已创建 `packages/evals`，包含评估体系占位；
- 已补充中文 README 和 docs 文档。

## 验证结果

- `pnpm typecheck`：通过；
- `pnpm lint`：通过；
- `pnpm build`：通过；
- `pnpm --filter @ai-product-agent/api test`：通过；
- `pnpm dev:web` + `curl -I http://localhost:5173/`：前端入口返回 200；
- `docker compose up -d postgres`：未完成，原因是本机 Docker daemon 未启动。

## 下一步

1. 启动 Docker Desktop；
2. 执行 `pnpm db:up`；
3. 分别执行 `pnpm dev:api` 和 `pnpm dev:web`；
4. 访问 `http://localhost:5173`，确认前端能展示数据库连接正常；
5. 进入阶段 02：竞品分析任务雏形。
