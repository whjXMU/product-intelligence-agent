# ADR 0004：使用版本化 schema 接入正式 Agent Workflow

## 状态

已接受。

## 背景

阶段 02 已经完成 `analysis_tasks` 业务闭环，并通过 `input`、`result`、`trace`、`status` 预留了 Agent 接入位置。

当前字段仍然是 mock shape：

- `input` 是宽松 passthrough；
- `result` 是 mock report；
- `trace` 是 mock steps；
- `status` 是用户可见的四态。

阶段 03 需要接入正式 Agent Workflow，但不应急着接真实 LLM。最重要的是先定义稳定、可迁移、可观测的 schema。

## 决策

阶段 03 使用版本化 schema：

- `AnalysisTaskInputV1`
- `AnalysisTaskResultV1`
- `AgentTraceV1`

这些 schema 先由 `packages/shared` 提供，供 API、Web 和测试共同使用。

`packages/agent-core` 提供纯 workflow contract，不依赖 Nest、TypeORM、Vue，也不直接读写数据库。

`apps/api` 负责把 `analysis_tasks` 转换成 workflow input，调用 workflow runner，并把 result/trace 写回数据库。

## 原因

- 版本化 schema 可以降低未来迁移成本；
- result 和 trace 分离，避免展示数据和调试数据混在一起；
- workflow contract 独立于 API 层，后续可替换为 LLM、工具或队列执行；
- 阶段 03 先用 deterministic runner，可以让初学者理解工程边界；
- 不直接继承 `packages/agent-mvp`，避免实验包污染正式主线。

## 不采用的方案

### 直接复用 agent-mvp 输出

拒绝。

原因：

- spike 输出是为快速验证设计；
- 没有绑定 `analysis_tasks` 生命周期；
- trace、usage、quality 虽有价值，但需要重新纳入正式 schema。

### 立即新增 analysis_task_runs 表

暂缓。

原因：

- 当前只需要最新一次报告；
- 没有队列和异步 worker；
- 过早引入 run history 会增加前后端复杂度；
- 可以先通过 `trace.runId` 保留单次运行标识。

### 立即接真实 LLM

暂缓。

原因：

- schema 和 workflow contract 尚未固化；
- 真实模型会放大错误处理、成本、重试和观测复杂度；
- deterministic runner 更适合验证工程边界。

## 后续触发条件

当以下条件满足时，再进入真实模型调用：

- `AnalysisTaskInputV1`、`AnalysisTaskResultV1`、`AgentTraceV1` 稳定；
- API 已能通过 `run-workflow` 写入正式 result/trace；
- 前端能展示正式 report 和 trace；
- `packages/agent-core` workflow contract 已有测试；
- evals 至少有 2-3 个固定样例。
