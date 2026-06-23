# 阶段 03 架构说明：正式 Agent Workflow 接入 analysis_tasks

## 阶段定位

阶段 03 的目标不是马上接真实 LLM，而是把正式 Agent Workflow 接入 `analysis_tasks` 的工程边界设计清楚，并固化 `input`、`result`、`trace`、`status` 的正式 schema。

阶段 02 已经完成业务任务闭环：

```text
创建任务
→ 保存 analysis_tasks
→ mock run
→ 写入 result / trace
→ 前端展示
```

阶段 03 要把这个闭环升级为：

```text
analysis_tasks 作为业务聚合根
→ workflow runner 读取版本化 input
→ 执行可观测步骤
→ 写入版本化 result
→ 写入版本化 trace
→ 通过 status 表达用户可理解的任务状态
```

## 总控结论

正式 Agent Workflow 不直接继承 `packages/agent-mvp`，但吸收其中已经验证过的经验：

- prompt 版本管理；
- JSON schema 校验和修复；
- trace、usage、quality check 输出；
- 报告维度结构；
- HTML 提取和噪声过滤经验。

正式系统必须重新建立边界：

- `packages/shared`：API DTO、持久化 JSON shape、zod schema；
- `packages/agent-core`：纯 Agent workflow contract，不依赖 Nest、TypeORM、Vue；
- `apps/api`：业务编排入口，负责读取任务、调用 workflow、保存结果；
- `apps/web`：展示任务、报告和 trace，不参与 Agent 执行；
- `packages/evals`：未来评估 result 和 trace 的质量。

## 设计原则

1. `analysis_tasks` 是业务聚合根，不是 Agent 内部日志表。
2. `input`、`result`、`trace` 必须版本化，允许后续迁移。
3. `status` 是用户可理解状态，不承载过细的内部 step 状态。
4. `trace` 记录 workflow 为什么这么做、哪里失败、用了什么模型和工具。
5. `result` 只放面向产品经理的稳定报告结构，不混入 debug 细节。
6. 阶段 03 仍可使用 deterministic/mock workflow，不急着接真实 LLM。
7. 正式 workflow runner 可以参考 spike，但不能直接调用 `packages/agent-mvp`。

## 用户补充交互构想
有多种交流方案。 
1. 触发全流程：用户询问比较deepseek和openai的首页，比较它们并生成需求建议。
2. 局部深入探讨： 也可以深入多轮对话优化背景信息，根据生成的需求建议提出反馈和补充信息进一步优化比较结果和需求建议，也可以继续探讨格努生成的需求建议的某一点完善成最终的需求文档方案。
`input` 表示用户提交的任务输入。 可以包含对话、或上传html或markdown文件。
`result` 表示面向用户展示的分析产物。可以包含评分比较、建议报告。 
同时如果考虑后续提供结构化的对象数据，供系统拓展为可视化的图表展示。
生成的过程支持用户的确认和二次编辑，最终用户满意的方案支持保存管理、并作为后续讨论的本地知识库。


## 字段职责

### input

`input` 表示用户提交的任务输入和约束，是 workflow 的主要输入源。

职责：

- 描述分析对象；
- 描述输入来源；
- 描述分析目标；
- 描述输出偏好；
- 为未来网页抓取、文档上传、手工 HTML 输入预留位置。

不放：

- 模型 prompt；
- 中间推理；
- 执行日志；
- 最终报告。

### result

`result` 表示面向用户展示的分析产物。

职责：

- 总结结论；
- 结构化对比维度；
- 差距分析；
- 产品机会；
- 需求建议；
- 质量信息。

不放：

- 原始 LLM 响应；
- 详细 step trace；
- token usage；
- 内部错误堆栈。

### trace

`trace` 表示 workflow 的执行过程和可观测信息。

职责：

- workflow run id；
- workflow 版本；
- step 开始、结束、状态；
- 模型调用 metadata；
- 工具调用 metadata；
- guardrail 检查；
- artifact 引用；
- 错误摘要。

不放：

- 大段原始 HTML；
- 完整 prompt；
- API key；
- 用户敏感信息。

### status

`status` 表示任务对用户可见的生命周期。

当前仍保留阶段 02 的四态：

```ts
type AnalysisTaskStatus = 'created' | 'running' | 'completed' | 'failed';
```

阶段 03 不建议急着扩展 `queued`、`cancelled`、`paused`。

原因：

- 当前没有队列系统；
- 当前没有取消 API；
- 当前没有异步 worker；
- 过早增加状态会让前后端和测试复杂化。

未来触发条件：

- 引入队列后增加 `queued`；
- 支持用户取消后增加 `cancelled`；
- 支持人工确认或长流程暂停后增加 `paused`。

## 正式 Schema 建议

### AnalysisTaskInputV1

```ts
interface AnalysisTaskInputV1 {
  schemaVersion: 'analysis_task_input.v1';
  subject: {
    productName: string;
    competitorNames: string[];
  };
  goal: {
    primaryQuestion: string;
    focusAreas: string[];
    audience: 'pm' | 'founder' | 'designer' | 'engineer' | 'other';
  };
  sources: Array<
    | {
        type: 'manual_url';
        role: 'self' | 'competitor';
        name: string;
        url: string;
        notes?: string;
      }
    | {
        type: 'manual_html';
        role: 'self' | 'competitor';
        name: string;
        htmlRef: string;
        notes?: string;
      }
    | {
        type: 'manual_text';
        role: 'self' | 'competitor';
        name: string;
        content: string;
        notes?: string;
      }
  >;
  outputPreferences: {
    language: 'zh-CN' | 'en-US';
    detailLevel: 'brief' | 'standard' | 'deep';
    includePrdSuggestions: boolean;
  };
}
```

阶段 03 可以先把阶段 02 的宽松 input 映射为 `analysis_task_input.v1`，但不要求一次性支持所有 source 类型。

### AnalysisTaskResultV1

```ts
interface AnalysisTaskResultV1 {
  schemaVersion: 'analysis_task_result.v1';
  generatedAt: string;
  workflow: {
    workflowId: 'competitive_analysis.v1';
    workflowVersion: string;
    runId: string;
  };
  executiveSummary: {
    oneLine: string;
    keyFindings: string[];
    confidence: 'low' | 'medium' | 'high';
  };
  comparisonDimensions: Array<{
    id: string;
    name: string;
    selfAssessment: string;
    competitorAssessment: string;
    gap: string;
    evidenceRefs: string[];
  }>;
  opportunities: Array<{
    id: string;
    title: string;
    rationale: string;
    impact: 'low' | 'medium' | 'high';
    effort: 'low' | 'medium' | 'high';
    evidenceRefs: string[];
  }>;
  recommendations: Array<{
    id: string;
    title: string;
    description: string;
    priority: 'p0' | 'p1' | 'p2';
    successMetric?: string;
    evidenceRefs: string[];
  }>;
  quality: {
    passed: boolean;
    score: number;
    checks: Array<{
      name: string;
      passed: boolean;
      message: string;
    }>;
  };
}
```

设计重点：

- `result` 可以直接被前端展示；
- `evidenceRefs` 先预留，阶段 03 可以为空数组；
- `quality` 吸收 spike 的 quality-check 经验；
- `workflow.runId` 与 trace 对齐。

### AgentTraceV1

```ts
interface AgentTraceV1 {
  schemaVersion: 'agent_trace.v1';
  runId: string;
  taskId: string;
  workflowId: 'competitive_analysis.v1';
  workflowVersion: string;
  mode: 'mock' | 'deterministic' | 'llm';
  status: 'running' | 'completed' | 'failed';
  startedAt: string;
  endedAt?: string;
  steps: AgentTraceStepV1[];
  modelCalls: AgentModelCallTraceV1[];
  toolCalls: AgentToolCallTraceV1[];
  guardrails: AgentGuardrailTraceV1[];
  artifacts: AgentArtifactRefV1[];
  error?: {
    code: string;
    message: string;
    stepId?: string;
  };
}
```

```ts
interface AgentTraceStepV1 {
  stepId: string;
  name: string;
  kind: 'input_normalization' | 'analysis' | 'report_generation' | 'quality_check' | 'persistence';
  status: 'running' | 'completed' | 'failed' | 'skipped';
  startedAt: string;
  endedAt?: string;
  summary: string;
  inputRefs?: string[];
  outputRefs?: string[];
}
```

```ts
interface AgentModelCallTraceV1 {
  id: string;
  stepId: string;
  provider: string;
  model: string;
  promptVersion?: string;
  startedAt: string;
  endedAt?: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
  status: 'completed' | 'failed';
  errorMessage?: string;
}
```

阶段 03 可以先让 `modelCalls`、`toolCalls`、`guardrails` 为空数组。重要的是先把 shape 定下来。

## Workflow Contract 建议

`packages/agent-core` 应提供纯 contract，不依赖 API、数据库或前端。

```ts
interface AgentWorkflow<Input, Result, Trace> {
  id: string;
  version: string;
  run(input: AgentWorkflowRunInput<Input>): Promise<AgentWorkflowRunOutput<Result, Trace>>;
}

interface AgentWorkflowRunInput<Input> {
  taskId: string;
  input: Input;
  startedAt: string;
  mode: 'mock' | 'deterministic' | 'llm';
}

interface AgentWorkflowRunOutput<Result, Trace> {
  result: Result;
  trace: Trace;
}
```

阶段 03 推荐先实现一个 `competitive_analysis.v1` 的 deterministic runner：

- 不接真实 LLM；
- 不调用 `packages/agent-mvp`；
- 输出 `AnalysisTaskResultV1`；
- 输出 `AgentTraceV1`；
- 替代阶段 02 的 mock result/trace shape。

## API 接入建议

阶段 03 可以保留阶段 02 的 `POST /analysis-tasks/:id/run-mock`，同时新增正式入口：

```text
POST /analysis-tasks/:id/run-workflow
```

推荐行为：

1. 读取任务；
2. 校验任务状态是否允许执行；
3. 将 status 更新为 `running`；
4. 把 task 转成 `AnalysisTaskInputV1`；
5. 调用 `competitive_analysis.v1` runner；
6. 写入 `result` 和 `trace`；
7. 将 status 更新为 `completed`；
8. 失败时写入 failed trace 和 `errorMessage`。

阶段 03 不需要队列，使用同步 API 即可。

未来引入队列时，`run-workflow` 可以变成提交 job，状态先变为 `queued`。

## 状态流转

阶段 03 推荐状态机：

```text
created
  └── run-workflow → running

running
  ├── success → completed
  └── error   → failed

completed
  └── rerun → running

failed
  └── rerun → running
```

约束：

- 同一个任务在 `running` 时不能重复执行；
- `completed` 和 `failed` 可以重新执行；
- 重新执行会覆盖 `result` 和 `trace`，但 trace 中应生成新的 `runId`；
- 未来需要历史记录时，再新增 `analysis_task_runs` 表。

## 是否需要新增 analysis_task_runs 表

阶段 03 暂不建议新增。

原因：

- 当前系统还没有异步 worker；
- 当前用户只需要看到最新一次报告；
- 先把 `result` 和 `trace` 的正式 shape 固化更重要；
- 过早引入 run history 会增加 API、前端和 migration 复杂度。

未来触发条件：

- 需要比较多次运行结果；
- 需要审计每次模型调用；
- 需要保存完整 artifact；
- 需要支持异步队列和重试。

到那时再引入：

```text
analysis_task_runs
analysis_task_artifacts
```

## 阶段 03 不做什么

- 不接真实 DeepSeek/OpenAI；
- 不做网页抓取；
- 不做 RAG；
- 不做多 Agent；
- 不引入队列；
- 不引入 MCP；
- 不把 `packages/agent-mvp` 作为正式依赖；
- 不存储完整 prompt 和原始 HTML 到 trace。

## 阶段 03 完成标准

- `packages/shared` 有版本化 input/result/trace schema；
- `packages/agent-core` 有正式 workflow contract；
- `apps/api` 有 `run-workflow` 接入口；
- workflow 输出正式 `AnalysisTaskResultV1` 和 `AgentTraceV1`；
- 前端能展示新版 result 和 trace 的关键字段；
- 旧 `run-mock` 可以保留，但文档标记为阶段 02 兼容入口；
- 所有测试和构建通过；
- `packages/agent-mvp` 没有被正式代码依赖。

## 子窗口拆分建议

### 子窗口 A：shared 与 agent-core contract

负责：

- `packages/shared/src/analysis-task.ts` 中新增版本化 schema；
- 必要时拆分 `packages/shared/src/analysis-task-*` 文件；
- `packages/agent-core/src/**` 中新增 workflow contract；
- 不改 API controller；
- 不改前端页面。

### 子窗口 B：API workflow 接入

启动条件：

- 子窗口 A 的 schema 和 contract 稳定。

负责：

- 新增 deterministic competitive analysis runner；
- 新增 `POST /analysis-tasks/:id/run-workflow`；
- 写入正式 result/trace；
- 补充 service 测试。

### 子窗口 C：前端展示适配

启动条件：

- API workflow 输出稳定。

负责：

- 展示 `AnalysisTaskResultV1`；
- 展示 trace 概览；
- 保留阶段 02 mock 展示兼容。

## 当前建议

先只开启子窗口 A。

原因：

- schema 是阶段 03 的地基；
- API 和前端都依赖它；
- 一旦 schema 设计不好，后面会产生大量返工。

## 子窗口 A 完成记录

执行日期：2026-06-23

执行范围：

- 在 `packages/shared/src/analysis-task.ts` 新增正式版本化 schema：
  - `AnalysisTaskInputV1`
  - `AnalysisTaskResultV1`
  - `AgentTraceV1`
- 在 `packages/agent-core/src/contracts.ts` 新增正式 workflow contract：
  - `AgentWorkflowMode`
  - `AgentWorkflowRunInput`
  - `AgentWorkflowRunOutput`
  - `AgentWorkflow`

阶段 02 兼容方式：

- 保留原有 `analysisTaskInputSchema` 的宽松 passthrough 行为；
- 保留原有 `AnalysisTaskMockResult` 和 `AnalysisTaskTrace`；
- `AnalysisTaskDto.result` 同时兼容旧 mock result、新 `AnalysisTaskResultV1` 和宽松 `Record<string, unknown>`；
- `AnalysisTaskDto.trace` 同时兼容旧 mock trace、新 `AgentTraceV1` 和宽松 `Record<string, unknown>`；
- 未修改阶段 02 API controller、service 或前端页面。

边界确认：

- 未实现 API controller；
- 未实现 deterministic runner；
- 未接入真实 LLM；
- 未改前端页面；
- 未调用或修改 `packages/agent-mvp`；
- `packages/agent-core` 仍保持为空壳 contract 层，只定义正式 workflow 的调用约定。

已执行验证：

```bash
pnpm --filter @product-intelligence-agent/shared typecheck
pnpm --filter @product-intelligence-agent/agent-core typecheck
pnpm typecheck
```

验证结果：全部通过。

后续建议：

- 子窗口 B 可以在此基础上实现 deterministic competitive analysis runner；
- API 接入时应使用 `AnalysisTaskInputV1` 校验 workflow 输入，并将输出写入 `AnalysisTaskResultV1` 和 `AgentTraceV1`；
- 前端适配应在 API 输出稳定后再启动。

## 总控复查记录：子窗口 A

复查日期：2026-06-23

总控结论：

- 子窗口 A 的实现符合阶段 03 架构目标；
- `packages/shared` 已提供版本化 schema，并保留阶段 02 mock result/trace 兼容；
- `packages/agent-core` 已提供纯 workflow contract，没有依赖 Nest、TypeORM、Vue；
- 未发现 `packages/agent-mvp` 被正式代码依赖；
- 当前可以进入子窗口 B：API workflow 接入。

总控验证命令：

```bash
pnpm --filter @product-intelligence-agent/shared typecheck
pnpm --filter @product-intelligence-agent/agent-core typecheck
pnpm typecheck
pnpm lint
pnpm build
```

验证结果：全部通过。

进入子窗口 B 前的要求：

- 不修改 schema，除非发现必须修正的阻塞问题；
- 不接真实 LLM；
- 不新增队列；
- 不新增 `analysis_task_runs` 表；
- 新增的 runner 必须输出 `AnalysisTaskResultV1` 和 `AgentTraceV1`；
- 保留阶段 02 的 `run-mock` 兼容入口。

## 子窗口 B 完成记录

执行日期：2026-06-23

执行范围：

- 在 API 层新增 deterministic competitive analysis workflow runner；
- 新增 `POST /analysis-tasks/:id/run-workflow`；
- `run-workflow` 读取现有 `analysis_tasks` 聚合根，不新增运行历史表；
- 将阶段 02 的宽松任务 input 映射并校验为 `AnalysisTaskInputV1`；
- 调用 deterministic runner，输出并持久化 `AnalysisTaskResultV1` 和 `AgentTraceV1`；
- 保留 `POST /analysis-tasks/:id/run-mock` 作为阶段 02 兼容入口；
- 补充 service、controller 和 runner 单元测试；
- 为 API Jest 单测增加 workspace shared TS 源码映射，避免 ESM `dist` 在 CommonJS Jest 环境中解析失败。

实现文件：

- `apps/api/src/modules/analysis-tasks/workflow/runner.service.ts`
- `apps/api/src/modules/analysis-tasks/workflow/runner.service.spec.ts`
- `apps/api/src/modules/analysis-tasks/workflow/trace.factory.ts`
- `apps/api/src/modules/analysis-tasks/workflow/trace.factory.spec.ts`
- `apps/api/src/modules/analysis-tasks/domain/task-status.ts`
- `apps/api/src/modules/analysis-tasks/domain/task-status.spec.ts`
- `apps/api/src/modules/analysis-tasks/mappers/workflow-input.mapper.ts`
- `apps/api/src/modules/analysis-tasks/mappers/workflow-input.mapper.spec.ts`
- `apps/api/src/modules/analysis-tasks/services/analysis-tasks.service.ts`
- `apps/api/src/modules/analysis-tasks/services/analysis-tasks.service.spec.ts`
- `apps/api/src/modules/analysis-tasks/controllers/analysis-tasks.controller.ts`
- `apps/api/src/modules/analysis-tasks/controllers/analysis-tasks.controller.spec.ts`
- `apps/api/src/modules/analysis-tasks/entities/analysis-task.entity.ts`
- `apps/api/src/modules/analysis-tasks/analysis-tasks.module.ts`
- `apps/api/src/test/shared.ts`
- `apps/api/package.json`
- `pnpm-lock.yaml`

状态流转：

```text
created / completed / failed
  └── run-workflow → running

running
  ├── success → completed
  └── error   → failed
```

约束：

- `running` 状态下重复调用 `run-workflow` 会返回冲突错误；
- 重新运行会先清空旧 `result`、`trace` 和 `errorMessage`，成功后写入最新 V1 result/trace；
- workflow input 映射或 runner 执行失败时，任务会落到 `failed`，并写入 `AgentTraceV1` failed trace；
- 当前仍是同步 API，不引入队列。

V1 schema 对齐：

- runner 输出的 `result.schemaVersion` 为 `analysis_task_result.v1`；
- runner 输出的 `trace.schemaVersion` 为 `agent_trace.v1`；
- `result.workflow.workflowId` 与 `trace.workflowId` 均为 `competitive_analysis.v1`；
- `result.workflow.runId` 与 `trace.runId` 保持一致；
- deterministic runner 不产生真实模型调用，`modelCalls`、`toolCalls`、`guardrails`、`artifacts` 当前为空数组；
- 单元测试直接使用 `analysisTaskResultV1Schema` 和 `agentTraceV1Schema` 校验 runner 输出。

边界确认：

- 未接真实 LLM；
- 未调用或修改 `packages/agent-mvp`；
- 未新增队列；
- 未新增 `analysis_task_runs` 表；
- 未修改前端页面；
- 未修改 shared schema；
- 仅为 API 包新增 `@product-intelligence-agent/agent-core` workspace 依赖，用于引用正式 workflow contract。

已执行验证：

```bash
pnpm --filter @product-intelligence-agent/api test -- analysis-tasks
pnpm --filter @product-intelligence-agent/api typecheck
pnpm --filter @product-intelligence-agent/api lint
pnpm --filter @product-intelligence-agent/api build
```

验证结果：全部通过。

后续建议：

- 可以开启子窗口 C，在前端展示 `AnalysisTaskResultV1` 和 `AgentTraceV1` 的关键字段；
- 后续真实 Agent 接入时，应替换 runner 内部实现，而不是改变 `run-workflow` 的业务入口和 V1 持久化边界。

## 子窗口 B 架构整理与收口说明

整理日期：2026-06-23

整理背景：

- 子窗口 B 初版已完成 API 接入，但 `AnalysisTasksService` 一度承担了过多职责；
- 为避免为了阶段验收留下架构债，后续按小步方式进行了结构整理；
- 每一步只处理一个耦合点，避免引入过度抽象。

已完成整理：

- 将 `AnalysisTaskEntity` 到 `AnalysisTaskInputV1` 的转换独立为 `mappers/workflow-input.mapper.ts`；
- 将 failed `AgentTraceV1` 构造独立为 `workflow/trace.factory.ts`；
- 将 `analysis_tasks.status` 的业务规则独立为 `domain/task-status.ts`；
- 将 service 内部的状态持久化写入收敛为 `markRunning`、`markCompleted`、`markFailed` 私有方法；
- 将 workflow 相关文件命名收敛为较短的 `workflow/runner.service.ts`、`workflow/trace.factory.ts`；
- 保持 controller 轻薄，只负责 HTTP 路由和参数；
- 保持 domain 纯净，不依赖 Nest，也不抛 HTTP 异常；
- service 仍负责 application 编排和 HTTP 异常翻译。

当前 API 模块分层：

```text
controllers/
  analysis-tasks.controller.ts

services/
  analysis-tasks.service.ts
  analysis-task-mock-runner.service.ts

domain/
  task-status.ts

mappers/
  analysis-task.mapper.ts
  workflow-input.mapper.ts

workflow/
  runner.service.ts
  trace.factory.ts
```

边界判断：

- `analysis_tasks.status` 是用户可见的业务任务生命周期，属于 analysis task domain，不放入 agent-core；
- `AgentTraceV1.status` 和 `steps[].status` 是 Agent workflow 执行可观测状态，后续应由 Agent workflow/orchestrator 负责；
- 当前 `workflow/runner.service.ts` 是 API 阶段的 deterministic adapter，负责验证 API 到 workflow 的接入边界；
- 后续真实 Agent 开发阶段应评估将 runner 的纯核心迁入 `packages/agent-core` 或正式 workflow package，API 仅保留 Nest adapter。

当前不继续在子窗口 B 内处理的事项：

- 不迁移 runner 到 `packages/agent-core`；
- 不引入 workflow registry；
- 不接真实 LLM；
- 不引入 model provider、tool registry、memory 或 guardrails；
- 不新增队列；
- 不新增 `analysis_task_runs`；
- 不修改前端页面。

原因：

- runner 归属涉及正式 Agent workflow/core 的组织方式，应该交给下一阶段 Agent 子窗口统一设计；
- API 子窗口继续提前迁移 runner，容易替 Agent 层过早定型；
- 当前 API 目标是稳定 `run-workflow` 业务入口、持久化 V1 result/trace、保留清晰边界。

整理后验证：

```bash
pnpm --filter @product-intelligence-agent/api test -- analysis-tasks
pnpm --filter @product-intelligence-agent/api typecheck
pnpm --filter @product-intelligence-agent/api lint
```

验证结果：全部通过。

## 给总控主窗口的文字版总结

阶段 03 子窗口 B 已完成 API workflow 接入，并完成必要架构整理，可以收口。

本窗口交付内容：

- 新增 `POST /analysis-tasks/:id/run-workflow`；
- `run-workflow` 读取 `analysis_tasks`，将任务输入映射并校验为 `AnalysisTaskInputV1`；
- 调用 API 内 deterministic workflow runner；
- 成功时持久化 `AnalysisTaskResultV1` 和 `AgentTraceV1`；
- 失败时持久化 failed `AgentTraceV1` 和 `errorMessage`；
- 保留 `POST /analysis-tasks/:id/run-mock` 兼容入口；
- 补充 controller、service、mapper、domain、trace factory、runner 测试。

整理后的架构边界：

- controller 保持 HTTP 入口职责；
- service 负责 application 编排、数据库读写和 HTTP 异常翻译；
- domain 只承载 analysis task 业务状态规则；
- mapper 负责 `AnalysisTaskEntity -> AnalysisTaskInputV1`；
- workflow 目录承载当前 API 阶段的 deterministic runner 和 trace factory；
- shared 提供 V1 schema；
- agent-core 当前仍只提供 workflow contract；
- 未调用或修改 `packages/agent-mvp`。

需要总控注意的后续事项：

- 当前 runner 仍在 API 模块内，定位是阶段 03 deterministic adapter；
- 下一阶段进入 Agent 开发时，应由 Agent 子窗口评估 runner 核心是否迁入 `packages/agent-core` 或正式 workflow package；
- 不建议在 API 子窗口继续推进 runner 迁移，以免提前替 Agent 层定型；
- `analysis_tasks.status` 和 Agent workflow 内部 step status 已明确分层：前者属于业务任务生命周期，后者属于 Agent workflow/orchestrator；
- API 入口和 V1 result/trace 持久化边界已经稳定，可作为后续 Agent runner 替换的接入点。

建议下一步：

- 总控进入 Agent 开发阶段，开启新的 Agent 子窗口；
- Agent 子窗口优先设计正式 workflow runner/core 的包内组织、model provider 边界、tool/trace/eval 接入方式；
- 前端展示适配可以在 API V1 输出稳定的基础上并行或随后推进，但不应阻塞 Agent core 设计。
