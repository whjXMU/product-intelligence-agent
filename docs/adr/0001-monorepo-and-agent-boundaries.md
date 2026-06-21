# ADR 0001：采用 pnpm monorepo 与 Agent 工程边界

## 状态

已接受。

## 背景

项目需要同时包含前端、后端、共享类型、Agent 核心抽象和评估体系。虽然当前 MVP 很简单，但未来会逐步加入模型调用、工具系统、工作流、评估和可观测性。

## 决策

采用 pnpm monorepo：

- `apps/web` 存放 Vue 前端；
- `apps/api` 存放 NestJS 后端；
- `packages/shared` 存放共享 DTO 和类型；
- `packages/agent-core` 存放 Agent 核心抽象；
- `packages/evals` 存放评估体系。

## 原因

- 前后端可以共享类型，减少接口漂移；
- Agent 核心概念不会散落在业务 API 中；
- 评估体系从第一天有独立位置；
- 后续扩展多应用或多包时成本更低。

## 当前不做

- 不引入 Nx、Turborepo 等构建编排工具；
- 不引入多 Agent；
- 不引入向量数据库；
- 不引入队列系统。

## 未来触发条件

当 workspace 包数量增多、构建耗时明显上升、缓存和依赖拓扑管理成为痛点时，再考虑引入 Turborepo 或 Nx。
