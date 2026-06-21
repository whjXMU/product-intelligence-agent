# Agent 系统行动路线规划

> 主窗口校准：本文档来自 Agent MVP 子窗口，是 spike 后的行动建议草案，不是当前正式路线。正式路线以 `docs/roadmap.md` 为准。

## 文档定位

本文档是接下来工程实施的参考路线草案。它只回答：

```text
先做什么
后做什么
每一步产出什么
做到什么程度算完成
```

架构原则见：

- [竞品分析 Agent 正式系统架构总览](./agent-system-final-architecture.md)

## 总路线

当前不要直接做“大而全 Agent”。推荐路线是：

```text
MVP 定位冻结
→ agent-core 核心 contract
→ Model Gateway
→ Evidence Packet
→ Report 引用 evidenceId
→ Run / Artifact Store
→ Workflow Tools
→ Agent Router
→ Primitive / MCP Tools
→ Eval
→ 真实网页抓取
→ Project Memory
```

最近最重要的是前 6 步。完成前 6 步后，项目才从 demo workflow 进入可复盘、可追踪、可扩展的正式系统雏形。

## 阶段总览

| 阶段 | 名称 | 目标 | 关键产物 |
| --- | --- | --- | --- |
| 0 | 冻结 MVP 定位 | 防止继续把复杂度堆进 `agent-mvp` | 文档边界、MVP 保留为样例 |
| 1 | agent-core contract | 定义正式系统骨架类型 | Task、Run、Evidence、Artifact、Tool 等 schema |
| 2 | Model Gateway | 解耦模型供应商 | ModelClient、DeepSeekProvider |
| 3 | Evidence Packet | 建立可追溯证据模型 | evidence-packet.json |
| 4 | Report 引用 evidenceId | 让结论可追溯 | 新 report schema、evidence 校验 |
| 5 | Run / Artifact Store | 每次运行可复盘 | runs/run_xxx 目录 |
| 6 | Workflow Tools | 把业务流程封装成工具 | run_competitive_analysis 等 |
| 7 | Agent Router | 让 LLM 选择粗粒度能力 | intent 分类、tool routing |
| 8 | Primitive / MCP Tools | 局部探索和开放问答 | browser、fetch、read_file、query_evidence |
| 9 | Eval | 改动可回归 | 3-5 组固定样例 |
| 10 | 真实网页抓取 | 从 HTML 输入升级到 URL | Playwright/MCP browser evidence |
| 11 | Project Memory | 复用用户确认信息 | project memory、conversation summary |

## 当前优先级

### P0：必须先做

1. 冻结 MVP 定位。
2. 在 `packages/agent-core` 定义核心 contract。
3. 抽象 `ModelGateway`。
4. 引入 `Evidence` / `evidenceId`。
5. 改造报告，让报告引用 evidenceId。
6. 建立 run-based artifact 输出。

### P1：P0 完成后做

1. 把完整业务能力封装为 workflow tools。
2. 实现 Agent Router / Planner 初版。
3. 建立最小 eval 样例集。
4. 接入少量 primitive / MCP tools。

### P2：系统稳定后做

1. Playwright / browser MCP 真实网页抓取。
2. Project Memory。
3. 更完整的质量评估体系。
4. 多竞品并行、RAG、多 Agent。

## Phase 0：冻结 MVP 定位

目标：`agent-mvp` 只保留为实验包和回归样例。

要做：

- 不再向 `agent-mvp` 加 memory、MCP、多 Agent。
- 新正式能力进入 `packages/agent-core`。
- 当前 MVP 保持可运行。

完成标准：

- 文档中能清楚说明 MVP 与正式系统的区别。
- 新功能默认不继续堆进 `agent-mvp`。

## Phase 1：agent-core 核心 Contract

目标：先定义系统骨架，而不是急着写流程。

要定义：

```text
Task
Run
WorkflowStep
Evidence
Artifact
Trace
ModelClient
ToolDefinition
ToolCall
EvaluatorResult
```

要求：

- 使用 `zod` 做运行时 schema。
- 使用 `z.infer` 推导 TypeScript 类型。
- 不绑定具体模型、不绑定 UI、不绑定数据库。

完成标准：

- 能用类型表达一次任务、一次运行、一个证据、一个产物、一次工具调用。
- `apps/api` 后续可以引用这些 contract。

## Phase 2：Model Gateway

目标：业务 workflow 不再直接依赖 DeepSeek。

要做：

- 定义 `ModelClient` / `ModelGateway`。
- 实现 `DeepSeekProvider`。
- 支持 `generateJson`、`generateText`。
- 保留 timeout、retry、JSON repair、usage 记录。

完成标准：

- 更换 provider 不需要改 workflow 主体。
- 每次模型调用都有 model、usage、attempts、latency。
- JSON 输出仍然经过 schema validation。

## Phase 3：Evidence Packet

目标：把 homepage profile 升级为可追溯证据。

Evidence 最小字段：

```text
id
taskId
sourceType
productRole
sourceFile/sourceUrl
section
text
capturedAt
confidence
metadata
```

要做：

- 从当前 HTML 抽取结果生成 evidenceId。
- 区分 self / competitor。
- 区分 hero、nav、pricing、docs、customers 等 section。
- 输出 `evidence-packet.json`。

完成标准：

- 每条关键页面信息都有 evidenceId。
- 后续报告可以引用 evidenceId。

## Phase 4：Report 引用 evidenceId

目标：让报告结论能追溯回证据。

要做：

- 修改 report schema。
- `selfEvidence` / `competitorEvidence` 改为 evidenceId 引用。
- Markdown 渲染时显示 evidenceId 对应文本。
- Quality check 校验 evidenceId 是否存在。
- Prompt 要求模型引用 evidenceId。

完成标准：

- 每个关键维度都有 evidenceId。
- evidenceId 不存在时报告不通过。
- 用户追问某个维度时能找回相关 evidence。

## Phase 5：Run / Artifact Store

目标：每次运行都可复盘。

早期先用文件目录：

```text
runs/
  run_xxx/
    input/
    evidence/
    context/
    model/
    eval/
    artifacts/
    trace.json
```

每次运行保存：

- input manifest；
- evidence packet；
- LLM messages；
- raw model response；
- parsed output；
- quality check；
- usage；
- final artifact；
- trace。

完成标准：

- 任意一次分析都能复盘输入、证据、上下文、模型、输出和质量结果。
- 新旧 run 可以对比。

## Phase 6：Business Workflow Tools

目标：把稳定业务流程封装成 Agent 可调用的粗粒度工具。

先做 4 个：

```text
run_competitive_analysis
deep_dive_dimension
refine_requirement
write_prd
```

每个 tool 必须有：

- name；
- description；
- input schema；
- output schema；
- trace；
- artifact 输出；
- quality status。

完成标准：

- API 或 Agent Router 可以按名称调用这些能力。
- 用户追问维度时不需要重跑完整分析。
- 需求建议可以继续细化为需求卡片或 PRD 草稿。

## Phase 7：Agent Router 初版

目标：让系统从固定 workflow 变成受控 Agent。

要支持的 intent：

```text
run_analysis
ask_report_question
deep_dive_dimension
refine_requirement
write_prd
revise_report
```

Router 职责：

- 判断用户意图；
- 信息不足时提出澄清问题；
- 选择合适 workflow tool；
- 不直接拼底层步骤。

完成标准：

- 用户自然语言可以触发不同 workflow tool。
- LLM 不直接调用 `callModel`、`parseJson`、`writeMarkdown` 等底层函数。

## Phase 8：Primitive / MCP Tools

目标：给局部探索和开放问答提供工具能力。

优先工具：

```text
browser / Playwright
fetch_url
read_file
query_evidence
query_artifact
```

原则：

- 可以用 MCP 降低通用工具开发成本。
- Primitive tools 适合 ReAct-style 局部探索。
- 不让 ReAct 接管完整竞品分析主流程。
- 所有 tool call 必须写 trace。

完成标准：

- 用户问开放问题时，Agent 可以查询网页、文件或已有证据。
- 细粒度工具不会破坏核心 workflow 的可控性。

## Phase 9：最小 Eval

目标：prompt、模型和 workflow 的改动可回归。

要做：

- 准备 3-5 组固定样例。
- 保存输入、期望质量标准、人工评价。
- 记录 schema、evidence、quality、cost、latency。

完成标准：

- 能判断一次改动让质量变好还是变坏。
- Prompt 调参不再只靠感觉。

## Phase 10：真实网页抓取

目标：从手动 HTML 走向 URL 输入。

要做：

- 用 Playwright 或 browser MCP 渲染页面。
- 抽取可见文本。
- 保存 DOM selector。
- 保存截图引用。
- 记录 capturedAt。
- 统一转成 Evidence Packet。

完成标准：

- 输入 URL 可以生成 evidence。
- Evidence 能回到 URL、selector、截图。
- 分析 workflow 仍然只消费 evidence。

## Phase 11：Project Memory

目标：只在 evidence 和 artifact 稳定后引入低风险 memory。

先做：

```text
Project Memory
Conversation Summary
用户确认/否定记录
```

规则：

- 用户确认的信息可以复用。
- 用户否定的信息标记 rejected。
- Memory 记录 source、confidence、status。
- Memory 由 Context Builder 按需选择。

完成标准：

- 用户确认的信息能被后续任务复用。
- 用户否定的信息不会继续污染上下文。

## 近期最短可交付路径

如果现在开始工程，只做这 6 件事：

```text
1. 冻结 MVP 定位
2. 定义 agent-core contract
3. 抽象 Model Gateway
4. 引入 Evidence Packet
5. Report 引用 evidenceId
6. 建立 Run / Artifact Store
```

做到这里就先停下来做一次复盘，再进入 Agent Router 和 MCP tools。

## 暂时不要做

近期不要做：

- 完全自主多 Agent；
- 泛化 RAG 平台；
- 复杂长期 memory；
- 大规模网页抓取；
- 大而全前端；
- 无 evidence 的市场结论；
- 无 trace 的黑盒模型调用；
- 无 eval 的 prompt 反复调参。

## 每次开发前的判断问题

新增任何能力前，先问：

- 它属于 workflow tool，还是 primitive / MCP tool？
- 它是否需要 evidence？
- 它是否会产出 artifact？
- 它是否需要 trace？
- 它是否需要 evaluator？
- 它是否应该进入 memory？
- 它是否会让模型越过系统边界？

答不上来，就先不要实现。
