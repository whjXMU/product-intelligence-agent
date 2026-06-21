# 项目状态总览

## 项目名称

product-intelligence-agent

## 当前阶段

阶段 02：竞品分析任务业务骨架准备中。

## 当前目标

准备建立正式产品主线的第一个业务闭环：竞品分析任务。

- 后端新增 `analysis_tasks` 表和任务 API；
- 前端新增任务工作台；
- 分析结果先使用 mock；
- 为未来正式 Agent Workflow 预留 `result`、`trace`、`status` 等边界；
- 继续保持 `packages/agent-mvp` 的实验包定位。

## 当前立即实现

- 创建 `analysis_tasks` 数据模型；
- 创建任务 API；
- 创建前端任务创建、列表、详情视图；
- 创建 mock 分析报告；
- 维护 shared DTO。

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
- 正式 Agent Workflow。

## 最近执行记录

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

1. 开启后端子窗口，按 `agent_share_doc/stage-reports/02-analysis-task.md` 实现任务 API 和数据库模型；
2. 后端契约稳定后，开启前端子窗口实现任务工作台；
3. 回到主窗口做验收、修正和文档收尾。
