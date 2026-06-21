# Codex 子窗口交接说明

你正在参与一个长期 Agent 应用项目：product-intelligence-agent。

## 必读文件

开始任何实现前，请按顺序阅读：

1. `agent_share_doc/project-status.md`
2. `agent_share_doc/collaboration.md`
3. `docs/architecture.md`
4. `docs/roadmap.md`
5. `README.md`
6. 当前阶段任务说明：`agent_share_doc/stage-reports/02-analysis-task.md`

如果任务涉及 Agent MVP 实验结果，再额外阅读：

7. `agent_share_doc/stage-reports/02-agent-mvp.md`
8. `docs/adr/0002-agent-mvp-spike-boundary.md`

## 协作原则

- 当前窗口是主窗口，负责架构把控、阶段拆分和验收。
- 子窗口只执行被明确分配的阶段任务。
- 子窗口不要擅自改变总体架构方向。
- 子窗口不要把 `packages/agent-mvp` 的实验实现直接升级为正式架构。
- 所有重要阶段结果必须写入 Markdown。
- 修改代码前先说明目标、目录变化和关键设计原因。
- 文档必须使用中文。

## 当前主线说明

`packages/agent-mvp` 是一次 Agent 能力验证 spike，已经证明“手动 HTML 输入 + DeepSeek 分析 + JSON/Markdown/trace 输出”的链路可行。

但正式产品主线仍然按以下顺序推进：

1. 先建设业务任务骨架；
2. 再建设正式 Agent Core 与 Workflow；
3. 最后把模型调用、工具、评估和可观测性接入到稳定边界中。

任何子窗口如果被分配到正式 Agent 实现任务，必须先确认是否已经进入对应正式阶段，不得直接沿用 spike 的目录和边界。

## Agent 工程心智模型

设计和实现时始终区分以下边界：

- Model：模型调用、结构化输出、流式输出；
- Prompt/Instruction：角色、边界、任务策略；
- Tools：函数调用、API 调用、数据库查询、文件操作；
- Memory：短期上下文、长期偏好、任务状态；
- Planning/Workflow：什么时候思考、什么时候执行、什么时候停止；
- Guardrails：权限、敏感操作确认、输入输出校验；
- Evaluation：它做得对不对，如何回归测试；
- Observability：每一步为什么这么做、花了多少钱、哪里失败了。

## 完成任务后必须更新

- `agent_share_doc/project-status.md`
- `agent_share_doc/stage-reports/` 下对应阶段报告
- 如涉及架构变化，更新 `docs/architecture.md` 或新增 `docs/adr/`
