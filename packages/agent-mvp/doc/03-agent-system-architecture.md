# 正式版竞品分析 Agent 系统架构指南

## 目标

本文档用于指导后续从 `agent-mvp` 演进到一个可真实使用的竞品分析 Agent 系统。

核心目标不是做一个“看起来很智能”的自动化脚本，而是构建一个可控、可追溯、可评估、可持续演进的产品级 Agent 系统。

正式系统应支持：

- 分析前与用户多轮澄清需求；
- 自动或半自动收集竞品证据；
- 基于证据生成竞品分析报告；
- 对报告中的维度、评分、需求建议继续追问和细化；
- 将高价值建议进一步生成 PRD、需求卡片或路线图草案；
- 保留 trace、memory、evidence 和 eval，支持后续复盘和质量提升。

## 架构总原则

### 1. Workflow 是骨架，Agentic 能力是局部增强

竞品分析任务要求稳定、可审计和可复用，因此不建议一开始做完全自主的多 Agent 系统。

推荐架构：

```text
确定性 Workflow
+ 局部 Agentic 决策
+ 严格 Schema
+ Evidence 引用
+ 可观测 Trace
+ 人工复核入口
```

也就是说，主流程应由系统控制，模型只在明确边界内完成判断、生成、改写、批判、澄清等任务。

不推荐：

```text
用户输入
→ 一个大 prompt
→ 模型自由决定所有步骤
→ 直接输出最终报告
```

这种方式短期演示很快，长期会遇到不可控、不可评估、难复现、难调试的问题。

### 2. Prompt 不是系统中心，Context Engineering 才是核心

正式系统中，输入给模型的内容不应由单个 prompt 模板硬编码决定。

每次模型调用的输入应由以下内容动态组装：

```text
Instruction
+ User Intent
+ Conversation Context
+ Project Memory
+ Product Memory
+ Evidence Packet
+ Output Contract
+ Token Budget Policy
```

Prompt 模板只是 Instruction 和 Output Contract 的一部分。

### 3. 证据和观点必须分离

竞品分析 Agent 最重要的可信度来自证据链。

系统必须区分：

```text
Evidence：网页、截图、DOM、文档、用户补充资料中的事实片段
Fact：从 evidence 中抽取的结构化事实
Insight：模型基于事实做出的分析判断
Recommendation：面向产品行动的建议
Artifact：报告、PRD、需求卡片等最终产物
```

任何重要 insight 和 recommendation 都应该能追溯到 evidence。

### 4. Memory 不是聊天记录堆叠

Memory 应该是结构化、可检索、可过期、可更新的系统资产。

不要把完整聊天历史无差别塞进模型上下文。

正确做法是：

```text
长期信息结构化存储
当前任务按需检索
过时信息可失效
用户确认信息优先级更高
模型推断信息必须标记置信度
```

### 5. 质量保障要前置到架构中

正式系统不能等用户指出报告不靠谱后再修补。

质量保障应覆盖：

- 输入质量检查；
- 证据覆盖率检查；
- 模型输出 schema 校验；
- 事实一致性检查；
- 报告质量 eval；
- 人工复核流程；
- prompt 和模型版本追踪；
- trace 和成本记录。

## 总体架构

推荐系统分为 9 个核心层：

```text
User Interface
  ↓
Conversation Layer
  ↓
Task Orchestrator
  ↓
Context Builder
  ↓
Tool / Evidence Layer
  ↓
Memory Layer
  ↓
LLM Layer
  ↓
Evaluation Layer
  ↓
Artifact Layer
```

各层职责如下。

## 1. User Interface

负责用户入口。

可以先从简单 CLI 或内部 Web 页面开始，后续再升级成完整产品界面。

需要支持：

- 创建竞品分析任务；
- 输入己方产品和竞品；
- 上传或抓取网页、文档、截图；
- 与 Agent 进行多轮交流；
- 查看报告、证据和 trace；
- 对结论进行确认、反驳或补充；
- 将建议转为 PRD 或需求卡片。

早期不必追求复杂 UI，但必须预留对话和 artifact 查看能力。

## 2. Conversation Layer

负责管理用户对话，不直接承担复杂业务分析。

主要职责：

- 识别用户当前意图；
- 判断是否需要澄清；
- 将自然语言请求转为结构化 task intent；
- 维护当前会话状态；
- 将用户反馈写入 project memory；
- 将用户追问路由到合适 workflow。

典型用户意图：

```text
create_analysis：创建竞品分析
clarify_goal：澄清分析目标
run_analysis：执行分析
ask_report_question：追问报告内容
deep_dive_dimension：深挖某个评分维度
refine_requirement：细化某条需求建议
write_prd：生成 PRD
revise_report：根据反馈修订报告
```

这层不要简单等同于聊天记录保存。它的重点是把对话转成可执行的任务状态。

## 3. Task Orchestrator

负责任务编排，是系统的控制中心。

正式系统应至少支持以下 workflow：

```text
Clarification Workflow
Evidence Collection Workflow
Homepage Analysis Workflow
Competitive Analysis Workflow
Report Critique Workflow
Deep Dive Workflow
Requirement Refinement Workflow
PRD Generation Workflow
Memory Summarization Workflow
```

推荐主流程：

```text
用户创建任务
→ 判断需求是否充分
→ 不充分则进入澄清
→ 收集网页和补充资料
→ 抽取 evidence
→ 生成分析计划
→ 执行竞品分析
→ 质量检查
→ 输出报告
→ 用户追问或细化
→ 生成 PRD / 需求卡片
→ 归档 memory 和 trace
```

Orchestrator 的关键设计原则：

- 主流程确定性；
- 每一步输入输出都有 schema；
- 每一步都写 trace；
- LLM 失败可重试或降级；
- 质量不达标时进入修复或人工复核；
- 用户追问时只触发局部 workflow，不默认重跑全流程。

## 4. Context Builder

这是正式 Agent 系统最核心的工程模块之一。

它负责决定每一次 LLM 调用到底看见什么。

输入来源：

```text
当前用户请求
当前 workflow step
任务结构化信息
当前会话摘要
项目 memory
产品 memory
用户 memory
已收集 evidence
历史报告或需求文档
输出 schema
token budget
```

输出：

```text
LLM messages
context metadata
被选中的 evidence ids
被选中的 memory ids
裁剪和压缩记录
```

推荐接口形态：

```ts
interface ContextBuildRequest {
  taskId: string;
  conversationId: string;
  step: WorkflowStep;
  userIntent: UserIntent;
  outputContract: OutputContract;
  tokenBudget: TokenBudget;
}

interface ContextBuildResult {
  messages: ModelMessage[];
  selectedEvidenceIds: string[];
  selectedMemoryIds: string[];
  promptVersion: string;
  estimatedTokens: number;
}
```

正式系统不要继续使用一个单一的 `buildCompetitiveAnalysisPrompt()` 承担所有上下文组装。

推荐拆分：

```text
/prompts       稳定任务指令和输出契约
/context       上下文选择、裁剪、压缩、排序
/memory        长短期记忆读写
/evidence      证据存储和检索
```

## 5. Tool / Evidence Layer

负责收集、抽取、存储、检索可引用证据。

早期证据来源：

- 用户手动上传 HTML；
- 用户输入产品背景；
- 用户提供竞品 URL；
- 静态 HTML 解析；
- 手动文档或 Markdown。

正式阶段证据来源：

- Playwright 渲染网页；
- 可见文本抽取；
- DOM 结构抽取；
- 截图；
- 视觉模型分析；
- OCR；
- PDF / 文档解析；
- 历史报告；
- 用户确认过的事实。

推荐 evidence 数据结构：

```ts
interface Evidence {
  id: string;
  taskId: string;
  sourceType: 'html' | 'rendered_page' | 'screenshot' | 'document' | 'user_input';
  productRole: 'self' | 'competitor' | 'market' | 'unknown';
  productName?: string;
  url?: string;
  title?: string;
  text?: string;
  selector?: string;
  section?: 'hero' | 'nav' | 'pricing' | 'docs' | 'customers' | 'footer' | 'unknown';
  capturedAt: string;
  confidence: number;
  metadata: Record<string, unknown>;
}
```

推荐原则：

- evidence 是一等公民，不是 prompt 里的临时字符串；
- 每条 evidence 有稳定 id；
- 模型输出应引用 evidence id；
- evidence 可以被检索、复用、复核；
- 证据不足时，系统应主动提示或继续收集。

## 6. Memory Layer

Memory 负责保存跨任务和跨会话的长期信息。

建议分为 5 类：

```text
User Memory
用户偏好、常用语言、报告风格、默认角色视角

Product Memory
己方产品定位、目标用户、核心功能、价格、商业模式

Project Memory
当前竞品分析项目目标、范围、竞品列表、已确认结论

Conversation Memory
当前会话摘要、用户刚刚补充的信息、未解决问题

Evidence Memory
历史收集过且仍有效的网页、文档、截图和事实片段
```

Memory 写入原则：

- 用户明确确认的信息优先写入；
- 模型推断的信息要标记为 inferred；
- 被用户否定的信息要失效，不要继续污染上下文；
- memory 要有更新时间和适用范围；
- 不是所有信息都值得长期保存。

推荐 memory 数据结构：

```ts
interface MemoryItem {
  id: string;
  scope: 'user' | 'product' | 'project' | 'conversation' | 'evidence';
  content: string;
  structuredValue?: Record<string, unknown>;
  source: 'user_confirmed' | 'model_inferred' | 'system_generated';
  confidence: number;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  relatedEvidenceIds?: string[];
}
```

## 7. LLM Layer

负责统一模型调用。

不要让业务 workflow 直接依赖某一个 provider。

推荐抽象：

```ts
interface ModelClient {
  generateJson<T>(request: GenerateJsonRequest<T>): Promise<GenerateJsonResult<T>>;
  generateText(request: GenerateTextRequest): Promise<GenerateTextResult>;
}
```

LLM Layer 应统一处理：

- provider 配置；
- model id；
- timeout；
- retry；
- structured output；
- token usage；
- cost estimation；
- response metadata；
- safety and refusal handling；
- raw response 归档；
- JSON repair 或重试策略。

早期可以只有 DeepSeek，正式系统建议保留 provider abstraction，避免系统被单一模型绑定。

## 8. Evaluation Layer

Evaluation Layer 是产品级 Agent 的质量保障系统。

它不只是检查 JSON 格式，而是检查输出是否可信、可用、可行动。

至少包含三类 eval：

```text
Schema Eval
结构是否合法，字段是否完整，枚举值是否正确

Evidence Eval
关键结论是否引用证据，引用是否真实存在，证据是否支持结论

Quality Eval
分析是否具体，评分是否合理，需求建议是否可执行，指标是否可衡量
```

建议报告质量检查项：

- 是否覆盖核心分析维度；
- 每个评分是否有双方证据；
- 高严重性 gap 是否有对应需求建议；
- 需求建议是否包含目标用户、场景、方案、指标；
- 是否存在无法由 evidence 支撑的断言；
- 是否存在过度泛化的空话；
- 是否记录风险和假设；
- 是否需要人工复核。

正式项目必须建立固定 eval case：

```text
固定输入样例
期望输出标准
prompt 版本
model 版本
历史得分
回归对比
```

没有 eval，prompt 和模型优化就只能靠感觉。

## 9. Artifact Layer

负责生成和管理最终产物。

典型 artifact：

```text
analysis_report
competitor_matrix
dimension_deep_dive
requirement_card
prd
roadmap_suggestion
executive_summary
```

artifact 不应只是 Markdown 字符串。建议同时保存：

- 结构化 JSON；
- 面向人阅读的 Markdown；
- 引用的 evidence ids；
- 生成它的 prompt/model 版本；
- 质量检查结果；
- 用户反馈和修订记录。

推荐 artifact 数据结构：

```ts
interface Artifact {
  id: string;
  taskId: string;
  type: ArtifactType;
  version: number;
  status: 'draft' | 'reviewed' | 'approved' | 'archived';
  structuredContent: Record<string, unknown>;
  markdownContent?: string;
  relatedEvidenceIds: string[];
  traceId: string;
  createdAt: string;
  updatedAt: string;
}
```

## 核心数据流

### 初次竞品分析

```text
User Request
→ Conversation Layer 识别意图
→ Orchestrator 创建 Analysis Task
→ Clarification 判断信息是否足够
→ Evidence Collection 收集网页和材料
→ Evidence Extraction 生成 evidence
→ Context Builder 选择 task + memory + evidence
→ LLM 生成结构化分析
→ Schema Validation
→ Evidence Validation
→ Quality Evaluation
→ Artifact Layer 输出 report
→ Memory Layer 归档用户确认信息
```

### 用户追问某个维度

```text
User Question
→ 识别为 deep_dive_dimension
→ 检索原报告相关 dimension
→ 检索该 dimension 引用的 evidence
→ 检索用户补充背景
→ Context Builder 组装局部上下文
→ LLM 生成深挖解释或改进建议
→ 输出新的 artifact 或对话回答
```

### 将建议细化为 PRD

```text
User selects requirement
→ 检索 requirement 原始内容
→ 检索相关 gap、dimension、evidence
→ 补充产品 memory 和用户约束
→ 必要时向用户澄清范围
→ LLM 生成 PRD draft
→ Quality Eval 检查完整性
→ Artifact Layer 保存 PRD
```

## 推荐目录结构

正式项目可以从当前 `agent-mvp` 演进为：

```text
src/
  app/
    cli/
    api/
    web/
  workflows/
    clarification.workflow.ts
    evidence-collection.workflow.ts
    competitive-analysis.workflow.ts
    report-critique.workflow.ts
    deep-dive.workflow.ts
    requirement-refinement.workflow.ts
    prd-generation.workflow.ts
  orchestrator/
    task-router.ts
    workflow-runner.ts
    step-registry.ts
  context/
    context-builder.ts
    token-budget.ts
    evidence-selector.ts
    memory-selector.ts
    context-compressor.ts
  memory/
    memory-store.ts
    memory-writer.ts
    memory-summarizer.ts
  evidence/
    evidence-store.ts
    html-extractor.ts
    rendered-page-extractor.ts
    screenshot-analyzer.ts
    evidence-validator.ts
  llm/
    model-client.ts
    deepseek-provider.ts
    openai-provider.ts
    structured-output.ts
  prompts/
    instructions/
    output-contracts/
    examples/
  evaluators/
    schema-evaluator.ts
    evidence-evaluator.ts
    report-quality-evaluator.ts
    requirement-quality-evaluator.ts
  artifacts/
    artifact-store.ts
    markdown-renderer.ts
    prd-renderer.ts
  schemas/
    task.schema.ts
    evidence.schema.ts
    memory.schema.ts
    report.schema.ts
    artifact.schema.ts
    trace.schema.ts
  trace/
    trace-recorder.ts
    run-store.ts
```

早期不需要一次性实现全部目录，但架构边界应按这个方向设计。

## 模块优先级

### Phase 1：可靠单任务闭环

目标：把当前 MVP 打磨到可重复运行、可调试、可回归。

必做：

- 抽象通用 `ModelClient`；
- 增加 evidence id；
- 报告输出引用 evidence id；
- 增加基础 eval case；
- 增加 prompt token 统计和裁剪策略；
- 完善 trace 元数据。

暂不做：

- 多 Agent；
- 复杂 UI；
- 长期 memory；
- 自动规划。

### Phase 2：多轮交互和局部深挖

目标：支持用户在分析前澄清，在分析后追问和细化。

必做：

- Conversation Layer；
- Task Intent 分类；
- Deep Dive Workflow；
- Requirement Refinement Workflow；
- Project Memory；
- Artifact versioning。

### Phase 3：证据系统升级

目标：从手动 HTML 走向真实网页和多模态证据。

必做：

- Playwright 渲染抓取；
- 可见文本抽取；
- DOM selector 记录；
- screenshot 归档；
- evidence store；
- evidence validation。

### Phase 4：产品化质量体系

目标：让系统能稳定服务真实用户。

必做：

- eval 数据集；
- prompt/model 回归测试；
- 成本和延迟监控；
- 人工复核队列；
- 用户反馈闭环；
- memory 生命周期管理。

## 当前 MVP 到正式系统的映射

当前模块与正式架构的对应关系：

```text
src/index.ts
→ 临时 CLI 入口

src/workflows/competitive-analysis.ts
→ Competitive Analysis Workflow 雏形

src/extractors/html-to-homepage.ts
→ Evidence Extraction 雏形

src/prompts/competitive-analysis.prompt.ts
→ Prompt Instruction + Output Contract 雏形

src/llm/deepseek-client.ts
→ LLM Provider 雏形

src/evaluators/report-quality.ts
→ Quality Eval 雏形

src/trace/trace-recorder.ts
→ Trace Layer 雏形

src/schemas/*
→ Typed Contract 雏形
```

当前 MVP 最大的问题不是“代码少”，而是多个正式系统概念混在一起：

```text
prompt 混合了 instruction、context 和 output contract
homepage profile 混合了 evidence 和 feature extraction
workflow 混合了 orchestration、IO、model call 和 artifact write
quality check 只检查结构数量，不检查证据真实性
trace 只记录摘要，不足以完整复盘
```

后续演进的重点不是马上重写，而是逐步拆清边界。

## 关键设计决策

### 是否要多 Agent

不建议早期做多 Agent。

推荐先做多 workflow、多 step、单 orchestrator。

只有当以下条件出现时，再考虑多 Agent：

- 不同角色确实需要独立上下文和独立评估；
- 单个 workflow 已经难以维护；
- 需要并行处理多个证据源或多个竞品；
- 有明确的成本和质量监控。

可能的 Agent 角色：

```text
Research Agent：收集和整理证据
Analysis Agent：生成竞品分析
Critic Agent：检查证据和推理质量
PM Agent：将建议转为需求和 PRD
```

即使引入多 Agent，也应由 Orchestrator 统一调度，不让 Agent 自由互相调用。

### 是否要 RAG

需要，但不要一开始就泛化成“什么都向量化”。

推荐先做 evidence retrieval：

```text
按 taskId / product / evidence type / section / keyword 检索
再根据需要加入 embedding 检索
```

RAG 的目标不是炫技，而是让模型拿到最相关、最可信、最少噪声的上下文。

### 是否要长期 Memory

需要，但应晚于 evidence 和 artifact 系统。

如果没有 evidence id 和 artifact version，memory 很容易变成污染源。

推荐顺序：

```text
Evidence Store
→ Artifact Store
→ Project Memory
→ Product Memory
→ User Memory
```

### 是否要自动网页抓取

需要，但不应和分析逻辑耦合。

网页抓取应该属于 Evidence Collection Workflow。分析 workflow 只消费 evidence，不关心 evidence 是用户上传、Playwright 抓取还是文档解析得到的。

## 最小正式版架构

如果要从 MVP 开始建设第一个正式版本，建议最小可行架构是：

```text
Task
Evidence
Context Builder
Model Client
Workflow Runner
Evaluator
Artifact
Trace
```

对应最小流程：

```text
创建 task
→ 收集 evidence
→ 构建 context
→ 调用 model
→ 校验 output
→ 评估 quality
→ 保存 artifact
→ 写入 trace
```

这 8 个概念必须先稳定，之后再加入多轮对话、memory、PRD 生成、多 agent。

## 架构验收标准

一个可靠的正式版架构，至少要能回答以下问题：

- 每个结论来自哪些 evidence？
- 如果模型输出错了，错误发生在哪一步？
- 如果 prompt 改了，能否比较新旧质量？
- 如果用户追问某个维度，是否能只取相关上下文？
- 如果网页内容更新，是否能区分新旧证据？
- 如果用户否定某条结论，系统是否会停止复用它？
- 如果生成 PRD，能否追溯回原始竞品证据？
- 如果模型 provider 更换，workflow 是否不需要大改？
- 如果输出质量下降，是否有 eval 和 trace 能定位原因？

如果这些问题答不上来，说明系统还停留在 demo 阶段。

## 最终建议

后续开发时，应坚持以下路线：

```text
先把 workflow 做稳
再把 evidence 做实
再把 context builder 做清楚
再引入多轮交互
再沉淀 project memory
再扩展 PRD 和需求管理
最后再考虑多 Agent 和复杂自动规划
```

这条路线比“一开始做全自动 Agent”慢一点，但更可靠，也更适合真正落地。

当前 MVP 的正确定位：

```text
它不是最终架构。
它是验证竞品分析链路成立的实验包。
它最有价值的遗产是 workflow、schema、trace、model client、quality check 的雏形。
```

正式系统要保留这些好习惯，但必须把 prompt、context、memory、evidence、artifact 和 eval 的边界拆清楚。
