# 学习与开发路线

## 阶段 00：架构理解

目标：理解 monorepo、apps/packages 分层和 Agent 工程心智模型。

产出：

- 协作规范；
- 架构路线；
- 共享记忆文档。

## 阶段 01：MVP V0 工程骨架

目标：建立可运行的前后端和数据库链路。

产出：

- Vue3 前端；
- NestJS 后端；
- PostgreSQL 本地环境；
- TypeORM 连接；
- health check；
- shared、agent-core、evals 占位。

## 阶段 02：竞品分析任务雏形

目标：建立业务主线，而不是一开始追求复杂智能。

可能产出：

- analysis_tasks 表；
- 创建任务 API；
- 任务列表和详情页；
- mock 分析结果。

## 阶段 03：Agent Workflow 雏形

目标：把竞品分析拆成可观察、可测试的步骤。

可能产出：

- workflow contract；
- mock workflow runner；
- 每一步输入输出 schema；
- trace 记录雏形。

## 阶段 04：接入 LLM

目标：从单模型调用开始，要求结构化输出。

可能产出：

- model provider 抽象；
- prompt 模板；
- JSON schema 输出校验；
- 错误重试策略。

## 阶段 05：Tools

目标：让 Agent 能调用受控工具。

可能产出：

- tool registry；
- 文档解析 tool；
- URL 内容读取 tool；
- 内部数据库查询 tool。

## 阶段 06：Evaluation 与 Observability

目标：判断 Agent 是否真的做得更好。

可能产出：

- evals 样例集；
- 自动评分脚本；
- trace 查看；
- token、耗时、错误统计。

## 阶段 07：简历级打磨

目标：形成可演示、可讲解、可复盘的成熟项目。

可能产出：

- 演示数据；
- 架构图；
- 部署说明；
- 技术亮点文档；
- 项目复盘。
