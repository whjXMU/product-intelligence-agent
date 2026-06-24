# 精简 Agent 联调入口执行方案

## 执行原则

当前阶段先建设 Agent 联调入口，不一次性实现完整产品流程。

优先保证：

```text
联调链路真实
类型边界清晰
组件职责单一
后续 Brief / Report / Insight 能自然扩展
```

暂不做：

```text
完整 Brief 编辑器
报告模板编辑
模块级讨论
知识库入档
复杂图表
多轮对话状态
```

## 完成顺序

```text
1. 定义最小 task 类型和 API client
2. 新建 Agent Console 中间输入区
3. 调整 Workspace 三栏布局
4. 接任务列表选择和刷新
5. 加右侧 Debug 面板
```

## 第 1 步：定义最小 task 类型和 API client

### 当前观察

现有创建任务接口 `CreateAnalysisTaskRequest` 要求固定字段：

```text
title
productName
competitorName
analysisGoal
sourceType
input
```

这适合表单任务，但不适合作为 Agent 联调入口的主输入。

共享类型里已经存在更结构化的 `AnalysisTaskInputV1`，但当前创建接口还没有使用它作为主协议。

### 本步目标

先建立一个面向 Agent Console 的前端输入模型和 API adapter，让 UI 使用自由文本输入，但不急着推翻后端接口。

本步只解决：

```text
用户输入一段自然语言
前端把它转换为当前后端可接受的任务创建请求
API 层暴露稳定的方法给后续 Agent Console 使用
后续后端支持原生 Agent 请求时，只需要替换 adapter
```

### 拟采用方案

新增前端内部类型：

```ts
export interface CreateAgentAnalysisTaskInput {
  prompt: string
}
```

在 `analysisTasks.api.ts` 中新增一个方法：

```ts
export function createAgentAnalysisTask(input: CreateAgentAnalysisTaskInput)
```

当前实现先把 `prompt` 适配为现有 `CreateAnalysisTaskRequest`：

```text
title: 从 prompt 前 40 个字符生成
productName: 待识别
competitorName: 待识别
analysisGoal: prompt
sourceType: manual
input.notes: prompt
input.agentConsole: true
```

这是一层过渡 adapter。后续后端提供更合适的接口时，UI 组件不需要大改。

### 拟改文件

```text
apps/web/src/views/analysis-tasks/api/analysisTasks.api.ts
apps/web/src/views/analysis-tasks/composables/useAnalysisTaskList.ts
```

暂不修改：

```text
packages/shared
apps/api
Workspace UI
CreateForm UI
```

### 质量要求

```text
不把 prompt 适配逻辑散落到组件里
API 层负责协议转换
composable 只暴露语义清晰的 submitAgentTask
后续替换真实 Agent API 时，组件不用关心后端字段细节
```

### 待确认

是否接受本阶段先用前端 adapter 把自由文本转换成现有创建任务接口，而不是马上改后端 shared DTO？

推荐先接受该方案，因为它能快速打通联调入口，同时避免在 Agent 后端未定型前重构共享协议。

## 第 1 步补充讨论：是否直接调整后端接口

如果后端也处于早期阶段，直接设计一版更兼容 Agent 工作流的接口是合理选择。

当前接口的问题不是实现成本，而是领域前提：

```text
当前接口假设用户已经提供结构化任务字段
Agent 工作流需要先接收自然语言，再逐步澄清和结构化
```

因此可以考虑不再用前端 adapter 迁就旧接口，而是新增一版轻量 Agent-first 后端接口。

建议先不要一次性建完整 Project / Brief / Report / Insight 全链路，而是设计一个可扩展的 v0 协议：

```text
创建 Agent 会话或草稿任务
发送用户输入
返回任务状态、消息、结构化草稿和调试信息
```

这比旧的表单任务接口更贴近未来方向，也不会过度复杂。

需要确认的信息：

```text
1. 当前入口是按 Task 建模，还是按 Conversation 建模？
2. 第一版 Agent 是否需要多轮对话？
3. 是否需要先生成 Brief 并让用户确认后再执行？
4. 任务执行是同步返回，还是异步状态轮询？
5. 是否需要保存每轮消息？
6. Trace 面向开发调试保存到哪里？
7. 第一版结果只返回文本，还是预留结构化 report / brief 字段？
8. 是否需要项目 Project 维度，还是先只有任务维度？
```

推荐方向：

```text
如果要改后端，优先做轻量 Agent Session / Agent Task Draft 接口。
不要继续强化旧的固定表单接口。
不要一次性实现完整知识库和报告审阅流程。
```

## 第 1 步最终执行方案

已确认采用轻量 `AnalysisSession` 方案，而不是前端 adapter 方案。

### 设计取舍

```text
保留旧 analysis-tasks 接口，避免破坏已有 Demo 和测试
新增 analysis-sessions 接口，作为 Agent-first 联调入口
第一版只做会话、消息、状态、调试字段，不做完整 Brief / Report 业务流
```

### 后端 v0 接口

```text
POST /analysis-sessions
GET /analysis-sessions
GET /analysis-sessions/:id
POST /analysis-sessions/:id/messages
POST /analysis-sessions/:id/run
```

### 最小状态

```text
drafting
brief_ready
ready_to_run
running
completed
failed
```

第一版联调主要使用：

```text
drafting -> running -> completed / failed
```

### 最小数据结构

```text
AnalysisSession {
  id
  title
  status
  messages
  briefDraft
  resultText
  reportDraft
  trace
  errorMessage
  createdAt
  updatedAt
}
```

### 拟改文件

```text
packages/shared/src/analysis-task/session.dto.ts
packages/shared/src/analysis-task/common.ts
packages/shared/src/analysis-task/index.ts
apps/api/src/modules/analysis-tasks/entities/analysis-session.entity.ts
apps/api/src/modules/analysis-tasks/mappers/analysis-session.mapper.ts
apps/api/src/modules/analysis-tasks/services/analysis-sessions.service.ts
apps/api/src/modules/analysis-tasks/controllers/analysis-sessions.controller.ts
apps/api/src/modules/analysis-tasks/analysis-tasks.module.ts
apps/api/src/database/typeorm-options.ts
apps/web/src/views/analysis-tasks/api/analysisTasks.api.ts
```

### 第一版 run 行为

Agent 还未接入时，`POST /analysis-sessions/:id/run` 先生成确定性的占位结果：

```text
记录 assistant message
写入 resultText
写入 trace
状态置为 completed
```

这不是最终 Agent 能力，只是为了前后端联调完整链路。

### 质量要求

```text
旧 Task 接口和新 Session 接口边界清楚
shared DTO 作为前后端唯一契约
实体字段预留 briefDraft / reportDraft / trace，但 UI 暂不复杂使用
第一版 run 是可替换实现，后续替换为真实 Agent runner
```

### 第 1 步完成记录

已完成内容：

```text
新增 shared AnalysisSession DTO / schema
新增后端 analysis-sessions controller / service / entity / mapper
新增 analysis_sessions 建表 migration
注册 AnalysisSessionEntity 到 TypeORM 和 Nest module
新增前端 analysis-sessions API client
补充 API service unit test 和 e2e 覆盖
```

当前可用接口：

```text
POST /analysis-sessions
GET /analysis-sessions
GET /analysis-sessions/:id
POST /analysis-sessions/:id/messages
POST /analysis-sessions/:id/run
```

当前 `run` 行为：

```text
先置为 running
生成 placeholder assistant message
写入 resultText 和 trace
置为 completed
```

已验证：

```text
pnpm typecheck
pnpm --filter @product-intelligence-agent/api test
pnpm --filter @product-intelligence-agent/api test:e2e
```

下一步建议：

```text
第 2 步：新增 Agent Console 中间输入区，使用 analysis-sessions API 创建和运行联调 Session。
```
