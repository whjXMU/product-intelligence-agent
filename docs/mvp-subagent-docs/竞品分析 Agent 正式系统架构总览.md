# 竞品分析 Agent 正式系统架构总览

> 主窗口校准：本文档来自 Agent MVP 子窗口，是 spike 后的参考材料。正式阶段、实现顺序和工程边界以 `docs/roadmap.md`、`docs/architecture.md` 和 `docs/adr/0002-agent-mvp-spike-boundary.md` 为准。

## 文档定位

本文档只回答一个问题：这个项目最终应该演进成什么样的 Agent 系统。

具体施工步骤放在：

- [Agent 系统行动路线规划](./竞品分析 Agent 路线todo.md)

当前 `packages/agent-mvp` 是实验包，用来验证“竞品首页内容 → 结构化分析 → 报告输出”的最小闭环。正式系统不应把所有能力继续堆进 MVP，而应逐步沉淀到 `packages/agent-core`、`apps/api` 和 `apps/web`。

## 核心目标

构建一个面向产品经理的竞品分析 Agent：

- 能通过多轮对话澄清分析目标；
- 能收集、管理和引用竞品证据；
- 能基于证据生成竞品分析报告；
- 能支持对某个维度或建议继续追问；
- 能把高价值建议细化为需求卡片或 PRD；
- 能保留 trace、artifact、eval 和用户反馈，支持持续改进。

## 总体架构判断

当前 MVP 更像一个 LLM workflow：

```text
读取输入
→ 抽取首页信息
→ 构建 prompt
→ 调用模型
→ 校验和修复 JSON
→ 质量检查
→ 输出报告
```

正式系统应该是：

```text
Agent Router / Planner
→ 选择合适的 Workflow Tool
→ Workflow 稳定执行
→ 必要时使用 Primitive / MCP Tools 局部探索
→ Evaluator 检查质量
→ Artifact / Trace Store 归档
```

一句话：

```text
用 Agent 提供自主性，用 Workflow 保证可控性。
```

## 核心原则

### 1. Workflow 是骨架

竞品分析不是闲聊生成任务，而是需要证据、结构、质量检查和可复盘的业务流程。

核心流程应该由代码控制：

```text
input validation
→ evidence retrieval / collection
→ context build
→ model call
→ schema validation
→ evidence validation
→ quality evaluation
→ artifact save
→ trace
```

模型可以参与判断和生成，但不能自由拼接底层工程步骤。

### 2. Agentic 能力来自两层 Tooling

系统需要两层工具能力。

第一层是粗粒度业务工具，也就是 `Business Workflow Tools`：

```text
run_competitive_analysis
collect_competitor_evidence
deep_dive_dimension
refine_requirement
write_prd
revise_report
```

LLM 可以根据用户意图选择这些工具。工具内部仍然是受控 workflow。

第二层是细粒度工具，也就是 `Primitive / MCP Tools`：

```text
web_search
fetch_url
browser_snapshot
read_file
query_evidence
query_artifact
extract_text
summarize_document
```

这些工具适合局部探索、补证据、查询文件、读取网页，可以使用 ReAct-style：

```text
Thought → Action → Observation → Final
```

边界：

```text
核心完整任务：调用粗粒度 workflow tool
局部开放问题：使用 primitive / MCP tools
底层工程步骤：不直接暴露给 LLM 自由组合
```

### 3. Prompt 不是系统中心

正式系统不能靠一个大 prompt 承载所有逻辑。

每次模型调用的输入应由 `Context Builder` 动态组装：

```text
Instruction
+ User Intent
+ Conversation Context
+ Project Memory
+ Product Memory
+ Evidence Packet
+ Existing Artifacts
+ Output Contract
+ Token Budget Policy
```

Prompt 模板只负责稳定指令和输出契约。

### 4. Evidence 是一等公民

竞品分析的可信度来自证据，而不是模型语气。

必须区分：

```text
Evidence：网页、截图、DOM、文档、用户输入中的事实片段
Fact：从 evidence 中抽取的结构化事实
Insight：基于事实形成的分析判断
Recommendation：面向产品行动的建议
Artifact：报告、PRD、需求卡片等产物
```

关键结论必须能追溯到 `evidenceId`。

### 5. Memory 要晚一点做

Memory 不是聊天记录堆叠。

在 evidence 和 artifact 体系稳定前，不要急着做复杂长期 memory。推荐顺序：

```text
Evidence Store
→ Artifact Store
→ Project Memory
→ Product Memory
→ User Memory
```

用户确认的信息可以进入 memory；模型推断的信息必须标记来源和置信度；用户否定的信息必须失效。

### 6. Eval 是架构能力

没有 eval，就不要频繁调 prompt 或换模型。

正式系统至少需要：

- schema validation；
- evidence validation；
- report quality evaluation；
- requirement actionability evaluation；
- prompt/model 版本记录；
- token、cost、latency 记录；
- 固定 eval case；
- 人工抽检和反馈闭环。

## 推荐系统分层

```text
User Interface
  ↓
Conversation Layer
  ↓
Agent Router / Task Orchestrator
  ↓
Agent Tooling Layer
  ↓
Workflow Runner
  ↓
Context Builder
  ↓
Evidence Layer
  ↓
Memory Layer
  ↓
Model Gateway
  ↓
Evaluator Suite
  ↓
Artifact / Trace Store
```

## 各层职责

### User Interface

负责任务创建、对话、报告查看、证据查看、trace 查看和用户反馈。

早期可以简单，但要预留：

- 对话区；
- artifact 查看区；
- evidence 查看区；
- 调试区。

### Conversation Layer

负责把自然语言转成结构化意图。

典型 intent：

```text
create_analysis
run_analysis
ask_report_question
deep_dive_dimension
refine_requirement
write_prd
revise_report
```

### Agent Router / Task Orchestrator

负责判断当前应该调用哪个 workflow tool。

它不直接拼 prompt，不直接调用 provider，不直接读写底层文件。

### Agent Tooling Layer

负责把系统能力暴露给 LLM：

- 粗粒度 workflow tools；
- 细粒度 primitive / MCP tools；
- 权限、成本、输入输出 schema；
- tool 调用 trace。

### Workflow Runner

负责稳定执行业务流程。

每个 step 都应该有：

- step id；
- typed input；
- typed output；
- trace；
- artifact 引用；
- error category；
- retry / fallback policy。

### Context Builder

负责决定每次模型调用看见什么。

输出应记录：

- selectedEvidenceIds；
- selectedMemoryIds；
- selectedArtifactIds；
- promptVersion；
- contextPolicyVersion；
- truncationLog。

### Evidence Layer

负责收集和管理证据。

早期从 HTML 和用户输入开始，后续扩展到 Playwright、截图、OCR、文档解析。

推荐 evidence 最小字段：

```text
id
taskId
sourceType
productRole
sourceUrl/sourceFile
section
text
capturedAt
confidence
metadata
```

### Memory Layer

负责长期信息管理。

早期只做 Project Memory 和 Conversation Summary，暂缓复杂长期用户记忆。

### Model Gateway

统一模型调用。

负责：

- provider adapter；
- timeout；
- retry；
- structured output；
- JSON repair；
- usage；
- cost；
- raw response；
- request id。

### Evaluator Suite

负责质量门。

至少包含：

- Schema Evaluator；
- Evidence Evaluator；
- Coverage Evaluator；
- Faithfulness Evaluator；
- Actionability Evaluator；
- Cost / Latency Evaluator。

### Artifact / Trace Store

保存任务产物和过程记录。

典型 artifact：

```text
evidence_packet
analysis_report
dimension_deep_dive
requirement_card
prd
quality_check
model_response
```

## 当前 MVP 到正式架构的映射

```text
packages/agent-mvp/src/index.ts
→ 临时 CLI 入口

packages/agent-mvp/src/workflows/competitive-analysis.ts
→ Competitive Analysis Workflow 雏形

packages/agent-mvp/src/extractors/html-to-homepage.ts
→ Evidence Extraction 雏形

packages/agent-mvp/src/prompts/competitive-analysis.prompt.ts
→ Instruction + Output Contract 雏形

packages/agent-mvp/src/llm/deepseek-client.ts
→ Provider Adapter 雏形

packages/agent-mvp/src/evaluators/report-quality.ts
→ Quality Evaluator 雏形

packages/agent-mvp/src/trace/trace-recorder.ts
→ Trace Layer 雏形

packages/agent-mvp/src/schemas/*
→ Typed Contract 雏形
```

MVP 最大的问题不是代码少，而是边界混合：

```text
prompt 混合 instruction、context、output contract
homepage profile 混合 evidence、fact、feature extraction
workflow 混合 orchestration、IO、model call、artifact write
quality check 只检查结构数量，不检查证据真实性
trace 只记录摘要，不足以完整复盘
```

后续要逐步拆边界，不要直接重写一切。

## 关键决策

### 早期不做完全自主多 Agent

先做：

```text
单 Agent Router
+ 多个 workflow tools
+ 局部 primitive / MCP tools
+ 可控 workflow runner
```

### 早期不做泛化 RAG

先做 evidence retrieval：

```text
taskId / product / evidence type / section / keyword
```

再考虑 embedding 检索。

### 早期不做复杂长期 Memory

先让 evidence、artifact、run、eval 稳定。

### 网页抓取属于 Evidence Collection

分析 workflow 只消费 evidence，不关心 evidence 来自手动 HTML、Playwright、文档解析还是用户输入。

## 最小正式版验收标准

一个正式版雏形至少要回答：

- 每个关键结论来自哪些 evidence？
- evidence 来自哪个 URL、文件、截图或用户输入？
- 如果模型输出错了，错误发生在哪一步？
- 如果 prompt 改了，能否比较新旧质量？
- 如果用户追问某个维度，是否能只取相关上下文？
- 如果网页内容更新，是否能区分新旧证据？
- 如果用户否定某条结论，系统是否停止复用它？
- 如果生成 PRD，能否追溯回原始竞品证据？
- 如果模型 provider 更换，workflow 是否不需要大改？
- 如果输出质量下降，是否有 eval 和 trace 能定位原因？
- 如果成本异常升高，是否能定位到具体 workflow、step、prompt 或模型？

## 最终路线

```text
先把 workflow 做稳
再把 evidence 做实
再把 context builder 做清楚
再引入 workflow tool 和 Agent Router
再接入 primitive / MCP tools 做局部探索
再做 eval 和网页抓取
最后再考虑长期 memory、多 Agent 和复杂 RAG
```
