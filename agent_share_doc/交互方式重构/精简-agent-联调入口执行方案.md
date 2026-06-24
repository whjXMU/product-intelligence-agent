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

## 第 2 步：新增 Agent Console 中间输入区

### 本步目标

在当前工作台中提供一个自然语言 Agent 联调入口。

本步只解决：

```text
用户输入一段自然语言 prompt
前端创建 AnalysisSession
前端调用 run 接口
展示当前 session 状态、resultText、错误和基础调试信息
```

暂不解决：

```text
多轮聊天完整 UI
Brief 编辑确认
报告模板编辑
三栏工作台完整重排
历史 session 列表联动
```

### 前端组织方案

新增 composable：

```text
apps/web/src/views/analysis-tasks/composables/useAgentConsole.ts
```

职责：

```text
管理 prompt、activeSession、loading、running、error
调用 createAnalysisSession / runAnalysisSession
向组件暴露 submitPrompt 和 reset
```

新增组件：

```text
apps/web/src/views/analysis-tasks/components/AgentConsole.vue
```

职责：

```text
渲染自然语言输入区
触发 submitPrompt
展示 session 状态
展示 resultText
展示 trace / raw 调试摘要
```

接入位置：

```text
WorkspaceView.vue 当前左侧主区域
```

旧的 `CreateForm` 暂时不删除，后续可作为 dev-only 或迁移到次级入口。

### 质量要求

```text
组件只关心展示和用户动作
composable 负责状态编排
API client 负责请求协议
不在组件中拼后端 payload
不把 AnalysisTask 旧字段混入 AnalysisSession 入口
```

### 第 2 步完成记录

已完成内容：

```text
新增 useAgentConsole composable
新增 AgentConsole 组件
新增 AnalysisSession 状态文案映射
将工作台左侧主入口切换为 Agent Console
旧 CreateForm 暂未删除，后续可迁移为 dev-only 或次级入口
```

当前行为：

```text
用户输入自然语言 prompt
前端创建 AnalysisSession
前端立即调用 runAnalysisSession
展示 session 状态、resultText、消息数和调试摘要
```

已验证：

```text
pnpm typecheck
pnpm --filter @product-intelligence-agent/web build
```

构建备注：

```text
web build 通过。
Vite/Rolldown 输出第三方包 pure annotation 和 chunk size 警告，未阻断构建。
```

下一步建议：

```text
第 3 步：调整 Workspace 三栏布局，让左侧承载项目 / session / task 导航，中间承载 Agent Console 和当前工作区，右侧承载 Debug / Trace。
```

## 第 3 步：三栏布局与状态上提

### 方案选择

采用方案 B：把当前 Session 状态上提到 `WorkspaceView.vue`。

结构：

```text
WorkspaceView
  -> useAgentConsole
  -> WorkspaceShell
      -> sidebar: TaskList
      -> main: AgentConsole
      -> aside: DebugPanel
```

### 命名约定

新增和调整文件名尽量精简：

```text
WorkspaceShell.vue
AgentConsole.vue
DebugPanel.vue
useAgentConsole.ts
```

### 本步目标

```text
建立 feature 内部三栏布局组件
让中间 Console 和右侧 Debug 共享 activeSession
避免 Console 内部私有状态导致后续返工
保留旧 TaskList 作为左侧导航的临时内容
```

### 质量要求

```text
Shell 只负责布局，不依赖业务 API
Console 变为受控组件，只负责输入、展示和 emit 用户动作
DebugPanel 只读 activeSession 和 error
WorkspaceView 负责组合状态和布局
```

### 第 3 步完成记录

已完成内容：

```text
新增 WorkspaceShell 三栏布局组件
新增 DebugPanel 右侧调试面板
使用 AgentConsole 作为中间输入组件
使用 useAgentConsole 管理 Session 联调状态
将 Session 状态上提到 WorkspaceView
中间 Console 和右侧 DebugPanel 共享同一个 session
```

当前三栏内容：

```text
左侧：TaskList
中间：AgentConsole
右侧：DebugPanel
```

已验证：

```text
pnpm typecheck
pnpm --filter @product-intelligence-agent/web build
```

构建备注：

```text
web build 通过。
仍有 Vite/Rolldown 第三方 pure annotation 和 chunk size 警告，未阻断构建。
```

下一步建议：

```text
第 4 步：接任务 / Session 列表选择和刷新，让左侧从旧任务列表逐步升级为工作台导航。
```

## 工程化整理：命名收敛和状态映射抽取

### 本次目标

在继续做 Session 列表和导航之前，先清理 feature 内命名和重复逻辑。

本次只做：

```text
精简 route view 与基础组件命名
清理旧 Console 文件残留
抽取 Session 状态 tag 类型映射
保持现有产品行为不变
```

### 命名调整

```text
AnalysisTaskWorkspaceView.vue -> WorkspaceView.vue
AnalysisTaskDetailView.vue -> DetailView.vue
AnalysisTaskList.vue -> TaskList.vue
AnalysisTaskCreateForm.vue -> CreateForm.vue
```

暂不调整：

```text
AnalysisTaskDetailPanel.vue
AnalysisTaskResultPanel.vue
AnalysisTaskTracePanel.vue
useAnalysisTaskList.ts
useAnalysisTaskDetail.ts
```

原因：

```text
这些文件仍明确绑定旧 AnalysisTask 详情模型，等旧任务详情页继续重构时再统一收敛。
```

### 质量要求

```text
命名精简但不损失目录上下文
不做纯视觉改版
不改变 API 行为
移除重复 status tag type 映射
```

### 完成记录

已完成内容：

```text
WorkspaceView / DetailView 路由视图命名收敛
TaskList / CreateForm 基础组件命名收敛
路由懒加载路径已更新
WorkspaceView 内部引用已更新
Session status tag type 映射抽到 analysisTaskDisplay
AgentConsole 和 DebugPanel 复用同一套状态映射
```

已验证：

```text
pnpm typecheck
pnpm --filter @product-intelligence-agent/web build
```

构建备注：

```text
web build 通过。
Vite/Rolldown 仍提示第三方 @vueuse/core pure annotation 和大 chunk 警告，未阻断构建。
```

## 第 4 步：左侧工作台导航接入 Session

### 本步目标

让左侧从旧 Task 列表逐步升级为工作台导航。

本步实现：

```text
Session 列表加载
点击 Session 后加载详情并设为当前 activeSession
Agent Console 创建 / 运行后刷新 Session 列表
左侧保留旧 Task 分区，作为历史任务入口
```

暂不实现：

```text
Project 列表
Session 搜索和筛选
Session 删除 / 重命名
多轮消息列表
```

### 文件组织

新增：

```text
composables/useSessionList.ts
components/WorkspaceNav.vue
```

职责：

```text
useSessionList：封装 list / get / selectedSessionId / loading / error
WorkspaceNav：只负责展示 Session 分区和历史 Task 分区
WorkspaceView：组合 useAgentConsole、useSessionList、useAnalysisTaskList
```

### 交互规则

```text
页面加载时同时加载 Session 列表和旧 Task 列表
用户点击 Session，右侧 Debug 和中间 Console 使用该 Session
创建并运行新 Session 后刷新 Session 列表
旧 Task 点击仍跳转旧详情页
```

### 第 4 步完成记录

已完成内容：

```text
新增 useSessionList composable
新增 WorkspaceNav 左侧导航组件
左侧导航接入 AnalysisSession 列表
左侧保留旧 Task 历史任务分区
点击 Session 后加载详情并设置为当前 session
Agent Console 创建并运行后刷新 Session 列表
Task / Session 状态 tag 映射统一放入 analysisTaskDisplay
```

当前左侧导航：

```text
Sessions：新 Agent 会话列表
历史任务：旧 AnalysisTask 列表
```

已验证：

```text
pnpm typecheck
pnpm --filter @product-intelligence-agent/web build
```

构建备注：

```text
web build 通过。
仍有第三方 @vueuse/core pure annotation 和大 chunk 警告，未阻断构建。
```

## 第 4 步补充：Session 新建与删除

### 问题

当前新增 Session 只发生在用户提交中间输入框之后，缺少明确的“新会话”入口。

同时前后端都还没有删除 Session 的能力，左侧列表无法清理联调数据。

本地联调还暴露了 CORS 易踩坑：后端默认只允许 `http://localhost:5173`，如果前端用 `http://127.0.0.1:5173` 打开，会出现预检失败。

### 本次补齐

```text
后端新增 DELETE /analysis-sessions/:id
前端 API client 新增 deleteAnalysisSession
useSessionList 新增 removeSession / clearSelection
WorkspaceNav 增加“新会话”按钮
WorkspaceNav 的 Session 项增加删除按钮
删除当前 Session 后清空中间区和右侧 Debug
后端 CORS 默认允许 localhost 和 127.0.0.1 两种本地 origin
```

### 完成记录

已完成内容：

```text
后端 AnalysisSessionsController 增加 DELETE /analysis-sessions/:id
后端 AnalysisSessionsService 增加 remove
后端 CORS 支持 WEB_ORIGINS 逗号列表，并默认允许 localhost / 127.0.0.1
前端 analysisTasks.api 增加 deleteAnalysisSession
useSessionList 增加 removeSession / clearSelection
useAgentConsole 增加 clearSession
WorkspaceNav 增加“新会话”和删除按钮
WorkspaceView 接入新会话、删除当前会话后的清空逻辑
```

已验证：

```text
pnpm typecheck
pnpm --filter @product-intelligence-agent/api test
pnpm --filter @product-intelligence-agent/api test:e2e
pnpm --filter @product-intelligence-agent/web build
```

联调备注：

```text
CORS 配置变更需要重启 pnpm dev:api 后生效。
如果前端使用 http://127.0.0.1:5173 打开，现在默认也会被允许。
```

### API 错误判断与操作反馈修正

修正点：

```text
前端 requestJson 先识别基本 API envelope，再按 code === core.ok 判断成功。
错误响应不再因为缺少 data 被误判为 core.invalid_response。
成功响应缺少 data 时按 null 处理，后端也会把 undefined 统一包装为 null。
删除 Session 失败不再挂到左侧列表 Alert。
删除失败使用 console.error 记录排障信息，并用 ElMessage 做轻提示。
```

验证：

```text
pnpm typecheck
pnpm --filter @product-intelligence-agent/web build
```
