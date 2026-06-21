# ADR 0002：Agent MVP spike 不直接作为正式架构继承

## 状态

已接受。

## 背景

子窗口在 `packages/agent-mvp` 中完成了一次 Agent MVP 能力验证，证明以下链路可行：

- 手动提供己方和竞品 HTML；
- HTML 内容清洗和结构化提取；
- DeepSeek 分析；
- JSON schema 校验；
- Markdown 报告生成；
- trace、usage、质量检查输出。

这次实验对项目很有价值，因为它降低了后续正式 Agent 工程化的不确定性。

## 决策

`packages/agent-mvp` 被定义为技术 spike 和实验资产，不直接作为正式 Agent 架构继承。

正式产品路线继续遵循：

1. 先建立业务任务骨架；
2. 再设计正式 Agent Core、Workflow、Model Provider、Tools、Guardrails、Evaluation 和 Observability；
3. 最后从 spike 中迁移经过验证的经验，而不是照搬目录结构和实现。

## 原因

- spike 为了快速验证可行性，天然会牺牲边界清晰度；
- 当前实验包没有接入后端任务系统和数据库；
- 当前实验包没有完整权限控制、失败恢复、可观测性和评估回归；
- 如果直接升级 spike，后续容易形成难拆的临时结构；
- 业务任务模型尚未稳定，过早固化 Agent workflow 会增加返工。

## 可复用内容

- prompt 版本管理思路；
- JSON 解析、修复和 schema 校验流程；
- trace、usage、quality check 输出字段经验；
- HTML 提取中的噪声过滤经验；
- 分析报告的维度和产品优化需求结构。

## 不直接复用内容

- `packages/agent-mvp` 的包边界；
- 实验 CLI 作为正式任务入口；
- 实验 workflow 作为正式 orchestration；
- 本地 input/output 目录作为正式数据流；
- 实验 prompt 作为正式 prompt 管理体系。

## 后续触发条件

当以下条件满足时，可以开始正式迁移 spike 经验：

- `analysis_tasks` 任务模型稳定；
- 报告 schema 和 trace schema 稳定；
- 后端已经具备任务创建、执行、查询的基本 API；
- 前端已经具备任务列表和报告查看入口；
- `packages/agent-core` 的核心 contract 已重新设计。
