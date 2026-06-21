# ADR 0003：先建设分析任务业务骨架，再接正式 Agent Workflow

## 状态

已接受。

## 背景

项目已经通过 `packages/agent-mvp` 验证了 Agent MVP 的技术可行性，但该实现仍是 spike。正式产品需要先拥有稳定的业务对象，才能承载后续 Agent 执行、trace、报告、评估和用户反馈。

## 决策

阶段 02 先实现 `analysis_tasks` 业务骨架，不接真实 LLM，不调用 `packages/agent-mvp`。

本阶段只用 mock 结果验证：

- 任务创建；
- 任务状态流转；
- 结果持久化；
- 前端任务工作台；
- 后端 API；
- shared DTO。

## 原因

- Agent workflow 需要挂载到稳定的任务对象上；
- 数据库模型先稳定，可以减少后续 Agent 接入时的返工；
- 前端体验需要围绕任务和报告构建，而不是围绕脚本输出；
- mock 阶段可以把复杂度控制在初学者可理解范围内；
- 避免继续把正式业务复杂度堆进 `packages/agent-mvp`。

## 后续迁移条件

当以下内容稳定后，再进入正式 Agent Workflow：

- `analysis_tasks` 表结构；
- 任务创建、查询、详情 API；
- 前端任务工作台；
- 报告展示结构；
- `result` 和 `trace` 字段的最小 shape。
