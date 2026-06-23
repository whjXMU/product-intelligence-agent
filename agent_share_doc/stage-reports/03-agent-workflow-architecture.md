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
