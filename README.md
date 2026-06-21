# AI 产品文档竞品分析 Agent

这是一个面向产品经理的 AI 产品文档竞品分析 Agent 项目。当前处于 MVP V0 阶段，重点不是复杂 Agent 推理，而是建立一个可运行、可迭代、可长期扩展的工程骨架。

## 当前能力

- pnpm monorepo；
- Vue3 + Vite + TypeScript 前端；
- NestJS + TypeScript 后端；
- PostgreSQL + Docker Compose 本地数据库；
- TypeORM 数据库连接配置；
- `/health` 健康检查接口，包含 API、数据库和 Agent 预留状态；
- 前端首页调用后端 `/health`；
- `packages/shared` 前后端共享 DTO；
- `packages/agent-core` 预留 Agent 核心抽象；
- `packages/evals` 预留评估体系。

## 项目结构

```text
apps/
  web/                  # Vue3 前端
  api/                  # NestJS 后端

packages/
  shared/               # 前后端共享 DTO、类型、schema
  agent-core/           # Agent 核心抽象：tools、memory、workflow、guardrails、trace
  evals/                # 评估样例、回归测试、质量评估脚本

database/
  migrations/           # TypeORM migration 预留目录
  README.md             # 数据库说明

docs/
  architecture.md       # 中文架构说明
  roadmap.md            # 学习和开发路线
  getting-started.md    # 启动和验证说明
  adr/                  # 架构决策记录

agent_share_doc/
  project-status.md     # 跨窗口共享项目状态
  handoff.md            # 子窗口交接说明
  collaboration.md      # 协作规范
  stage-reports/        # 阶段执行报告
```

## 快速启动

安装依赖：

```bash
pnpm install
```

启动数据库：

```bash
pnpm db:up
```

启动后端：

```bash
pnpm dev:api
```

启动前端：

```bash
pnpm dev:web
```

默认访问：

- 前端：`http://localhost:5173`
- 后端 health check：`http://localhost:3000/health`

## 常用命令

```bash
pnpm typecheck
pnpm lint
pnpm build
pnpm --filter @ai-product-agent/api test
```

## 当前只预留但不实现的能力

- 真实 LLM 调用；
- 多 Agent；
- RAG；
- 向量数据库；
- 队列系统；
- 文档解析；
- 网页抓取；
- 长期记忆。

这些能力会在业务主线和评估标准建立之后逐步加入，避免 MVP 阶段过度设计。

## 下一步

建议进入阶段 02：竞品分析任务雏形。

目标是新增“分析任务”这个业务主线：

- 数据库新增 `analysis_tasks` 表；
- 后端提供创建任务、查询任务列表、查询任务详情接口；
- 前端提供任务创建和任务列表；
- 分析结果先使用 mock，不急着接入真实 LLM。
