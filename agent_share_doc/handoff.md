# Codex 子窗口交接说明

你正在参与一个长期 Agent 应用项目：AI 产品文档竞品分析 Agent。

## 必读文件

开始任何实现前，请按顺序阅读：

1. `agent_share_doc/project-status.md`
2. `agent_share_doc/collaboration.md`
3. `docs/architecture.md`
4. `docs/roadmap.md`
5. `README.md`

## 协作原则

- 当前窗口是主窗口，负责架构把控、阶段拆分和验收。
- 子窗口只执行被明确分配的阶段任务。
- 子窗口不要擅自改变总体架构方向。
- 所有重要阶段结果必须写入 Markdown。
- 修改代码前先说明目标、目录变化和关键设计原因。
- 文档必须使用中文。

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
