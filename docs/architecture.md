# 架构设计

## 项目定位

本项目是一个辅助产品经理进行 AI 产品文档竞品分析的 Agent 应用。当前 MVP V0 的重点不是复杂智能，而是建立一个长期可演进的工程边界。

## 总体结构

```text
apps/
  web/                  # Vue3 前端，Agent UI、任务看板、调试面板
  api/                  # NestJS 后端 API，业务接口和 Agent 编排入口

packages/
  shared/               # 前后端共享 DTO、类型、schema
  agent-core/           # Agent 核心抽象
  evals/                # 评估样例、回归测试、质量评估脚本

database/
  migrations/           # TypeORM migration 预留目录
  README.md             # 数据库说明

docs/
  architecture.md       # 架构文档
  roadmap.md            # 学习和开发路线
  adr/                  # 架构决策记录
```

## 分层原则

### apps/web

负责用户界面，不直接包含 Agent 推理逻辑。当前只实现首页 health check，未来承载任务创建、任务看板、报告预览和调试面板。

### apps/api

负责 HTTP API、业务服务和 Agent 编排入口。Controller 只负责协议入口，复杂逻辑应逐步下沉到 service 或 packages。

### packages/shared

存放前后端共享的 DTO 和类型，避免接口结构在前端和后端重复定义。

### packages/agent-core

存放 Agent 应用的核心抽象。当前只定义最小 contract，不实现复杂逻辑。

### packages/evals

存放评估样例和评估入口。当前只占位，未来用于判断 Agent 输出质量是否稳定提升。

## Agent 工程边界

- Model：未来封装模型调用、结构化输出、流式输出；
- Prompt/Instruction：未来管理角色、边界、任务策略；
- Tools：未来管理函数调用、API 调用、数据库查询、文件操作；
- Memory：未来管理短期上下文、长期偏好、任务状态；
- Planning/Workflow：未来管理分析步骤和停止条件；
- Guardrails：未来管理权限、敏感操作确认、输入输出校验；
- Evaluation：未来管理样例、评分、回归测试；
- Observability：未来记录 trace、耗时、token、失败原因。

## 当前推荐约束

- 不在 Controller 中堆 Agent 逻辑；
- 不提前引入多 Agent、RAG、队列和向量数据库；
- 不复制 DTO，优先从 `packages/shared` 引用；
- 数据库变更通过 migration 演进；
- 每个阶段完成后更新共享记忆和阶段报告。
