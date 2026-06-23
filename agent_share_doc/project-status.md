# 项目状态总览

## 项目名称

product-intelligence-agent

## 当前阶段

阶段 03：正式 Agent Workflow 架构设计中。

## 当前目标

阶段 02 已建立正式产品主线的第一个业务闭环。当前进入阶段 03，先设计正式 Agent Workflow 如何接入 `analysis_tasks`。

- 明确 `input`、`result`、`trace`、`status` 的正式 schema；
- 明确 `packages/shared`、`packages/agent-core`、`apps/api`、`apps/web` 的边界；
- 阶段 03 先做 workflow contract 和 deterministic runner，不接真实 LLM；
- 继续保持 `packages/agent-mvp` 为实验资产，不作为正式依赖。

## 当前立即实现

- 固化版本化 `AnalysisTaskInputV1`；
- 固化版本化 `AnalysisTaskResultV1`；
- 固化版本化 `AgentTraceV1`；
- 设计 `AgentWorkflow` contract；
- 设计 `POST /analysis-tasks/:id/run-workflow` 接入方式。

## 当前只预留

- Agent model provider 抽象；
- tool registry；
- memory contract；
- workflow contract；
- guardrails contract；
- trace contract；
- evals 样例和脚本入口。
- DeepSeek model client；
- HTML parser；
- schema 校验；
- markdown renderer。

> 说明：上述 DeepSeek、HTML parser、schema 校验和 markdown renderer 已在 spike 中验证过一版，但正式工程化实现需要在后续阶段重新设计边界后再接入。

## 当前不实现

- 复杂 Agent 推理；
- 多 Agent；
- RAG；
- 向量数据库；
- 队列系统；
- 真实 LLM 调用；
- 文档解析和网页抓取。
- 把 `packages/agent-mvp` 直接升级为正式 Agent 实现。
- 队列化执行；
- 多次运行历史表。

## 最近执行记录

- 2026-06-22：完成阶段 02 前端任务工作台，并将前端实现拆分为 API、composables 和 feature components。
- 2026-06-23：总控线程完成阶段 02 验收，API、数据库、前端入口、mock 任务闭环和测试均通过。
- 2026-06-23：开始阶段 03 架构设计，新增正式 workflow schema 和接入方案说明。
- 2026-06-23：子窗口 A 完成 shared schema 与 agent-core workflow contract，总控复查和 build 验证通过。
- 2026-06-23：子窗口 B 完成 API workflow 接入，新增 deterministic runner 和 `POST /analysis-tasks/:id/run-workflow`，API 测试、typecheck、lint、build 均通过。
- 2026-06-23：子窗口 C 完成前端展示适配，任务详情页支持运行 workflow，并展示 `AnalysisTaskResultV1` 与 `AgentTraceV1`，保留阶段 02 mock 兼容。
- 2026-06-22：执行阶段 01.5，开始校准主线文档，把 Agent MVP 验证归档为 spike。
- 2026-06-22：完成阶段 01.5，补充 handoff、roadmap、architecture、ADR 和 spike 报告定性。
- 2026-06-22：创建阶段 02 任务说明，明确先做 `analysis_tasks` 业务骨架，再接正式 Agent Workflow。
- 2026-06-21：项目命名从 `ai-product-agent` 对齐为 `product-intelligence-agent`，workspace 包名对齐为 `@product-intelligence-agent/*`。
- 2026-06-17：确认协作方式，采用主窗口把控、子窗口执行、Markdown 共享记忆的模式。
- 2026-06-17：开始阶段 01，初始化共享记忆文档。
- 2026-06-17：完成 pnpm monorepo、apps/web、apps/api、packages/shared、packages/agent-core、packages/evals 基础结构。
- 2026-06-17：完成后端 `/health` 与前端状态页。
- 2026-06-17：`pnpm typecheck`、`pnpm lint`、`pnpm build`、后端单元测试均通过。
- 2026-06-17：数据库容器验证暂未完成，原因是 Docker daemon 未启动。
- 2026-06-21：确认 Agent MVP 先跳过网页抓取，改为手动 HTML 输入。
- 2026-06-21：确认 LLM provider 使用 DeepSeek，key 由本地 `packages/agent-mvp/.env` 维护。
- 2026-06-21：创建 `packages/agent-mvp` 最小 workspace package 和设计文档。

## 下一步

1. 总控复查子窗口 C，收口阶段 03；
2. 进入正式 Agent runner/model provider 设计；
3. 继续保持 `packages/agent-mvp` 为 spike 资产，不直接并入正式主线。
