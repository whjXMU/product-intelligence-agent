# 项目状态总览

## 项目名称

AI 产品文档竞品分析 Agent

## 当前阶段

阶段 02：Agent MVP 核心能力验证。

## 当前目标

在 `packages/agent-mvp` 中优先验证 Agent 核心链路：

- 手动提供己方和竞品 HTML；
- 清洗并结构化页面内容；
- 使用 DeepSeek 进行竞品首页比较；
- 输出评分、差距分析和产品优化需求；
- 生成 JSON、Markdown 和 trace。

## 当前立即实现

- `packages/agent-mvp` workspace package；
- Agent MVP 输入输出目录；
- Agent MVP 设计文档；
- 后续 HTML 解析、DeepSeek client、workflow 的工程边界。

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

## 当前不实现

- 复杂 Agent 推理；
- 多 Agent；
- RAG；
- 向量数据库；
- 队列系统；
- 真实 LLM 调用；
- 文档解析和网页抓取。
- 前端页面；
- 后端 API；
- 数据库存储。

## 最近执行记录

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

为 Agent MVP 增加输入输出 schema、HTML 清洗器、DeepSeek model client 和 competitive-analysis workflow。
