# 竞品分析 Agent 正式系统最终方案

> 主窗口校准：本文档来自 Agent MVP 子窗口，是 spike 后的参考材料，不是当前项目正式路线的最高优先级来源。正式路线以 `docs/roadmap.md`、`docs/architecture.md` 和 `docs/adr/0002-agent-mvp-spike-boundary.md` 为准。

## 文档定位

本文档是后续开发 `product-intelligence-agent` 的参考方案之一。

它综合了当前 `agent-mvp` 的最小闭环、已有 monorepo 架构、阶段路线，以及后续正式 Agent 系统可能需要具备的工程能力。后续具体实现可以渐进，但必须经过主窗口和 ADR 重新确认。

本文档不是一次性全量实现清单。它的作用是防止项目被 MVP 的简化形态误导，确保后续每一步都朝产品级 Agent 系统演进。

## 一句话目标

构建一个面向产品经理的竞品分析 Agent 系统：它能够通过多轮交流明确分析目标，收集和管理可追溯证据，基于证据生成竞品分析报告，并支持对报告维度、差距和需求建议继续深挖，最终沉淀为 PRD、需求卡片或路线图草案。

## 核心判断

当前 `packages/agent-mvp` 是有效的实验包，但它本质上是一个线性 LLM workflow：

```text
读取输入
→ 抽取首页信息
→ 构建 prompt
→ 调用模型
→ 校验和修复 JSON
→ 质量检查
→ 输出报告和 trace
```

这个 MVP 的价值在于验证了竞品分析链路成立，也形成了 schema、workflow、model client、trace、quality check、artifact 的雏形。

但正式系统不能简单把这个 workflow 越写越大。真正的产品级 Agent 应该是：

```text
稳定 workflow 骨架
+ 局部 Agentic 决策
+ Evidence-first 数据体系
+ Context Builder
+ Memory 治理
+ Model Gateway
+ Evaluator Suite
+ Artifact / Trace / Cost 可观测性
+ Human Review 入口
```

## 总体原则

### 1. Workflow 是骨架，Agentic 能力是局部增强

竞品分析需要稳定、可审计、可复盘。正式系统不应从“完全自主多 Agent”开始。

推荐：

```text
确定性主流程
→ 在澄清、证据不足、质量不达标、局部深挖时引入 LLM 决策
→ 所有关键步骤都有 schema、trace、artifact 和 evaluator
```

不推荐：

```text
用户输入
→ 一个超大 prompt
→ 模型自由规划和执行
→ 直接输出最终报告
```

### 2. Prompt 不是中心，Context Engineering 才是中心

MVP 的 `buildCompetitiveAnalysisPrompt()` 混合了 instruction、上下文、输出契约和部分 memory。正式系统必须拆开。

一次模型调用的输入应由 `Context Builder` 动态组装：

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

Prompt 模板只负责稳定任务指令和输出契约，不能承担上下文选择、记忆筛选、证据裁剪等职责。

### 3. Evidence 是一等公民

系统可信度来自证据链，而不是模型表达能力。

必须区分：

```text
Evidence：网页、截图、DOM、文档、用户输入中的可引用事实片段
Fact：从 evidence 中抽取出的结构化事实
Insight：模型基于事实形成的分析判断
Recommendation：面向产品行动的建议
Artifact：报告、PRD、需求卡片、路线图等产物
```

正式系统中的重要结论和需求建议都应能追溯到 `evidenceId`。

### 4. Memory 不是聊天记录堆叠

Memory 应该是结构化、可检索、可失效、可更新的长期资产。

不要把全部历史对话无差别塞进模型上下文。正确方式是：

```text
长期信息结构化保存
→ 当前任务按需检索
→ 过时或被否定的信息失效
→ 用户确认的信息优先级高于模型推断
→ 模型推断的信息标记 confidence 和 source
```

### 5. 质量保障是架构能力，不是事后补丁

正式系统至少要覆盖：

- 输入完整性检查；
- 证据覆盖率检查；
- 模型输出 schema 校验；
- evidence 引用真实性检查；
- 报告质量评估；
- 需求可执行性评估；
- prompt/model 版本追踪；
- trace、token、cost、latency 记录；
- 人工复核和用户反馈闭环。

### 6. Agent 扩展性来自两层 Tooling

正式系统要看起来和用起来都像 Agent，不能只是一条固定 workflow；但也不能把底层工程步骤全部交给模型自由拼装。

推荐采用两层 tool 体系：

```text
Business Workflow Tools
+ Primitive / MCP Tools
```

第一层是粗粒度业务 workflow tool，面向完整业务能力：

```text
run_competitive_analysis
collect_evidence_for_products
deep_dive_dimension
refine_requirement
write_prd
revise_report
```

LLM 可以根据用户意图选择这些能力，但 tool 内部仍然由代码控制流程：

```text
input schema
→ evidence retrieval / collection
→ context builder
→ model gateway
→ output schema validation
→ evaluator
→ artifact save
→ trace
```

第二层是细粒度 primitive tool，面向探索、查询和局部补充：

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

这些工具可以来自 MCP server，也可以是自定义 function tool。它们适合 ReAct-style 的局部探索：

```text
Thought
→ Action
→ Observation
→ Thought
→ Action
→ Final
```

边界原则：

```text
核心业务流程：Agent 选择粗粒度 workflow tool
局部开放探索：Agent 使用 primitive / MCP tool + ReAct
底层工程步骤：不直接暴露给 LLM 自由拼装
```

这样既保留了 Agent 的自主性，也保留了产品系统的可控性、可审计性和可测试性。

## 推荐系统分层

正式系统采用 11 层逻辑架构：

```text
User Interface
  ↓
Conversation Layer
  ↓
Task Orchestrator
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

这些层不一定一开始都独立成包，但代码边界必须按这个方向演进。

## 1. User Interface

职责：

- 创建竞品分析任务；
- 输入己方产品、竞品、URL、HTML、文档或截图；
- 与 Agent 多轮澄清分析目标；
- 查看报告、证据、trace 和质量检查；
- 对结论进行确认、反驳或补充；
- 将建议转为 PRD、需求卡片或 roadmap 草案。

早期可以只做简洁 Web 页面或 CLI，但必须预留：

- 对话区；
- artifact 查看区；
- evidence 查看区；
- quality / trace 调试区。

## 2. Conversation Layer

Conversation Layer 不直接做竞品分析，它负责把自然语言交互转为可执行任务状态。

核心职责：

- 识别用户当前意图；
- 判断是否需要澄清；
- 将用户输入转为结构化 `UserIntent`；
- 维护当前会话摘要；
- 将用户确认、否定、补充的信息写入 memory；
- 将追问路由到合适 workflow。

典型 intent：

```text
create_analysis
clarify_goal
run_analysis
ask_report_question
deep_dive_dimension
refine_requirement
write_prd
revise_report
compare_more_competitors
```

关键原则：

- 不把全部聊天记录直接丢给模型；
- 不让 Conversation Layer 承担所有业务逻辑；
- 用户明确确认的信息才进入长期 memory；
- 用户否定的信息必须让旧 memory 失效。

## 3. Task Orchestrator

Task Orchestrator 是任务控制中心，负责决定当前应该运行哪个 workflow。

它要维护：

- task 状态；
- workflow 状态；
- artifact 版本；
- 用户反馈；
- 失败和重试策略；
- 人工复核状态。

推荐任务状态：

```text
created
needs_clarification
ready_for_evidence
collecting_evidence
ready_for_analysis
analyzing
needs_revision
ready_for_review
completed
archived
failed
```

Orchestrator 不应该直接拼 prompt，也不应该直接调用具体模型 provider。它只负责调度。

## 4. Agent Tooling Layer

Agent Tooling Layer 负责把系统能力暴露成 LLM 可选择的工具，同时限制工具边界、权限、成本和返回结构。

这一层分为两类 tool。

第一类是 `Business Workflow Tool`，也就是粗粒度业务能力：

```text
clarify_analysis_goal
collect_competitor_evidence
run_competitive_analysis
deep_dive_dimension
refine_requirement
write_prd
revise_report
```

它们适合由 Agent Router / Planner 选择。每个 workflow tool 都应具备：

- 明确的 name 和 description；
- zod schema 或 JSON schema 输入；
- typed output；
- 权限和成本策略；
- trace；
- artifact 引用；
- evaluator；
- 失败时的 fallback 或用户澄清策略。

第二类是 `Primitive / MCP Tool`，也就是细粒度通用能力：

```text
search_web
fetch_url
browser_navigate
browser_snapshot
read_file
query_database
query_evidence
query_artifact
run_terminal_command
```

它们适合开放式问答、证据补充、文件查询、网页探索等非完整主流程场景。

正式系统可以接入 MCP 来减少通用工具开发成本，例如浏览器、文件、搜索、数据库、GitHub、文档解析等能力。但 MCP 只解决外部能力接入，不替代业务 workflow 设计。

推荐调用策略：

```text
用户要完整分析
→ Agent 调用 run_competitive_analysis workflow tool

用户追问某个维度
→ Agent 调用 query_artifact / query_evidence，再调用 deep_dive_dimension

用户问一个开放探索问题
→ Agent 使用 primitive / MCP tools 进行 ReAct-style 探索

用户要 PRD
→ Agent 调用 write_prd workflow tool
```

不推荐把以下底层步骤直接暴露给 LLM 自由组合：

```text
readHtml
extractHeading
buildPrompt
callModel
parseJson
writeMarkdown
```

这些步骤应留在 workflow 内部。LLM 选择业务能力，代码保证业务能力稳定执行。

## 5. Workflow Runner

Workflow Runner 执行具体流程，每一步都应具备：

- step id；
- typed input；
- typed output；
- trace；
- artifact 引用；
- error category；
- retry / fallback policy。

正式系统至少需要以下 workflow：

```text
Clarification Workflow
Evidence Collection Workflow
Evidence Extraction Workflow
Competitive Analysis Workflow
Report Critique Workflow
Deep Dive Workflow
Requirement Refinement Workflow
PRD Generation Workflow
Memory Summarization Workflow
```

主分析流程：

```text
用户创建任务
→ 判断需求是否充分
→ 不充分则澄清
→ 收集网页、HTML、文档、截图和用户补充背景
→ 抽取 evidence packet
→ 生成或更新 analysis plan
→ 构建上下文
→ 调用模型生成结构化分析
→ schema validation
→ evidence validation
→ quality evaluation
→ 输出 report artifact
→ 用户追问或细化
→ 归档 memory、artifact、trace
```

用户追问不应默认重跑完整分析，而应启动局部 workflow。

## 6. Context Builder

Context Builder 是正式 Agent 系统的关键模块。

它负责决定每次模型调用看见什么，而不是简单渲染 prompt 模板。

输入来源：

```text
当前用户请求
当前 workflow step
task 结构化信息
会话摘要
用户 memory
产品 memory
项目 memory
evidence packet
已有 report / PRD / requirement artifact
输出 contract
token budget
```

输出：

```text
LLM messages
selectedEvidenceIds
selectedMemoryIds
selectedArtifactIds
promptVersion
contextPolicyVersion
estimatedTokens
truncationLog
```

建议接口：

```ts
interface ContextBuildRequest {
  taskId: string;
  conversationId: string;
  workflowStep: string;
  userIntent: UserIntent;
  outputContract: OutputContract;
  tokenBudget: TokenBudget;
}

interface ContextBuildResult {
  messages: ModelMessage[];
  selectedEvidenceIds: string[];
  selectedMemoryIds: string[];
  selectedArtifactIds: string[];
  promptVersion: string;
  contextPolicyVersion: string;
  estimatedTokens: number;
  truncationLog: string[];
}
```

Context Builder 必须记录“为什么选这些上下文”，否则后续无法复盘模型输出。

## 7. Evidence Layer

Evidence Layer 负责收集、抽取、存储、检索和校验证据。

早期证据来源：

- 用户手动上传 HTML；
- 用户输入产品背景；
- 用户提供竞品 URL；
- 静态 HTML 解析；
- Markdown / PDF / 文档资料。

正式证据来源：

- Playwright 渲染页面；
- 可见文本抽取；
- DOM selector；
- 截图；
- OCR；
- 视觉模型分析；
- PDF / Word / Markdown 解析；
- 历史报告；
- 用户确认过的事实。

推荐 evidence 结构：

```ts
interface Evidence {
  id: string;
  taskId: string;
  sourceType:
    | 'html'
    | 'rendered_page'
    | 'screenshot'
    | 'document'
    | 'user_input'
    | 'previous_artifact';
  productRole: 'self' | 'competitor' | 'market' | 'unknown';
  productName?: string;
  sourceUrl?: string;
  sourceFile?: string;
  title?: string;
  text: string;
  selector?: string;
  section?:
    | 'hero'
    | 'nav'
    | 'pricing'
    | 'docs'
    | 'customers'
    | 'case_study'
    | 'footer'
    | 'unknown';
  screenshotRef?: string;
  capturedAt: string;
  confidence: number;
  metadata: Record<string, unknown>;
}
```

核心原则：

- evidence 有稳定 id；
- LLM 输出引用 evidence id，而不是随意写证据文本；
- evidence 可以被检索、复用、复核；
- evidence 过期或网页更新时要区分版本；
- 证据不足时系统应提示用户或重新收集。

## 8. Memory Layer

Memory 负责跨任务、跨会话的长期信息。

建议分为五类：

```text
User Memory：用户偏好、语言、报告风格、默认角色视角
Product Memory：己方产品定位、用户、功能、价格、商业模式
Project Memory：当前项目目标、范围、竞品列表、已确认结论
Conversation Memory：当前会话摘要、未解决问题、用户刚刚补充的信息
Evidence Memory：历史收集且仍有效的网页、文档、截图和事实片段
```

推荐结构：

```ts
interface MemoryItem {
  id: string;
  scope: 'user' | 'product' | 'project' | 'conversation' | 'evidence';
  content: string;
  structuredValue?: Record<string, unknown>;
  source: 'user_confirmed' | 'model_inferred' | 'system_generated';
  confidence: number;
  status: 'active' | 'superseded' | 'rejected' | 'expired';
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  relatedEvidenceIds?: string[];
  relatedArtifactIds?: string[];
}
```

写入原则：

- 用户确认的信息优先写入；
- 模型推断的信息必须标记 `model_inferred`；
- 用户否定的信息必须置为 `rejected` 或让旧 memory 失效；
- memory 要有适用范围和更新时间；
- 不值得长期保存的信息只留在 conversation summary。

演进顺序：

```text
Evidence Store
→ Artifact Store
→ Project Memory
→ Product Memory
→ User Memory
```

不要在 evidence 和 artifact 还不稳定时过早做复杂长期 memory。

## 9. Model Gateway

Model Gateway 统一模型调用，workflow 不直接依赖 DeepSeek、OpenAI 或其他 provider。

基础接口：

```ts
interface ModelClient {
  generateJson<T>(request: GenerateJsonRequest<T>): Promise<GenerateJsonResult<T>>;
  generateText(request: GenerateTextRequest): Promise<GenerateTextResult>;
}
```

Model Gateway 负责：

- provider 配置；
- model id；
- timeout；
- retry；
- structured output；
- JSON repair；
- token usage；
- cost estimation；
- response metadata；
- raw response 归档；
- provider fallback；
- request id 和 trace 关联。

不同任务应允许不同模型策略：

```text
JSON repair：temperature 0，小模型可用
证据抽取：temperature 0，低成本模型优先
竞品分析：temperature 0.2-0.4，中高能力模型
需求 brainstorm：temperature 0.4-0.6
PRD 写作：temperature 0.2-0.4
质量评估：稳定 judge model，固定 rubric
```

正式系统不应把 `DeepSeekClient` 作为业务核心依赖。它应该只是 provider adapter。

## 10. Evaluator Suite

Evaluator Suite 是产品级 Agent 的质量门。

至少包含：

```text
Schema Evaluator：结构是否合法，字段是否完整
Evidence Evaluator：引用的 evidence 是否存在，是否支持结论
Coverage Evaluator：核心维度是否覆盖
Faithfulness Evaluator：是否存在无法由证据支撑的断言
Actionability Evaluator：需求建议是否可执行、可验收、可衡量
Consistency Evaluator：summary、dimensions、requirements 是否互相矛盾
Cost / Latency Evaluator：成本和耗时是否超预算
```

Evaluator 可以由规则、LLM-as-judge 和人工复核共同组成。

LLM-as-judge 必须有：

- 固定 rubric；
- judge prompt 版本；
- judge model 版本；
- 样例集；
- 人工抽检；
- 历史得分对比。

没有 eval，就不要频繁改 prompt。否则优化只能靠感觉。

## 11. Artifact / Trace Store

Artifact 是任务运行产生的可复用产物，不只是最终报告。

典型 artifact：

```text
evidence_packet
analysis_report
competitor_matrix
dimension_deep_dive
requirement_card
prd
roadmap_suggestion
executive_summary
quality_check
model_response
```

推荐结构：

```ts
interface Artifact {
  id: string;
  taskId: string;
  type: ArtifactType;
  version: number;
  status: 'draft' | 'checked' | 'needs_revision' | 'reviewed' | 'approved' | 'archived';
  structuredContent: Record<string, unknown>;
  markdownContent?: string;
  relatedEvidenceIds: string[];
  relatedArtifactIds: string[];
  traceId: string;
  promptVersion?: string;
  modelId?: string;
  createdAt: string;
  updatedAt: string;
}
```

每次 run 应保存：

```text
input manifest
evidence packet
selected context
prompt/messages
raw model response
parsed output
schema check
quality check
final artifact
trace
usage/cost
```

Trace 记录过程，Artifact 记录产物。两者都必须保留。

## 核心数据流

### A. 初次竞品分析

```text
User Request
→ Conversation Layer 识别意图
→ Orchestrator 创建 Analysis Task
→ Clarification 判断信息是否足够
→ Evidence Collection 收集网页和材料
→ Evidence Extraction 生成 Evidence Packet
→ Context Builder 选择 task + memory + evidence
→ Model Gateway 生成结构化分析
→ Schema Validation
→ Evidence Validation
→ Quality Evaluation
→ Artifact Store 保存 report
→ Memory Layer 归档用户确认信息
```

### B. 用户追问某个评分维度

```text
User Question
→ 识别为 deep_dive_dimension
→ 检索原报告相关 dimension
→ 检索该 dimension 引用的 evidence
→ 检索用户补充背景和 project memory
→ Context Builder 组装局部上下文
→ Model Gateway 生成深挖解释或改进建议
→ Evaluator 检查证据和质量
→ 输出对话回答或新的 deep-dive artifact
```

### C. 将需求建议细化为 PRD

```text
User selects requirement
→ 检索 requirement 原始内容
→ 检索相关 gap、dimension、evidence
→ 补充产品 memory 和用户约束
→ 必要时向用户澄清范围
→ Model Gateway 生成 PRD draft
→ PRD Quality Eval
→ Artifact Store 保存 PRD
→ 用户反馈后生成新版本
```

### D. 用户否定某个结论

```text
User rejects insight
→ 定位相关 artifact section
→ 定位相关 evidence 和 memory
→ 记录 feedback
→ 将错误推断标记为 rejected 或 superseded
→ 必要时触发局部 revision workflow
→ 保存新 artifact version
```

## 推荐代码组织

当前 monorepo 结构保留：

```text
apps/
  web/
  api/
packages/
  shared/
  agent-core/
  evals/
  agent-mvp/
docs/
```

长期职责：

```text
apps/web
  Agent UI、任务看板、报告和证据查看、调试面板

apps/api
  HTTP API、用户会话、任务服务、workflow 调度入口

packages/shared
  前后端共享 DTO、schema、枚举和 API contract

packages/agent-core
  workflow、context、memory、evidence、llm、evaluator、artifact、trace 的核心抽象与实现

packages/evals
  固定样例、评估脚本、rubric、回归测试

packages/agent-mvp
  实验包和学习样例，不作为正式业务核心
```

`packages/agent-core/src` 推荐演进方向：

```text
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
evidence/
  evidence-store.ts
  html-extractor.ts
  rendered-page-extractor.ts
  screenshot-analyzer.ts
  evidence-validator.ts
memory/
  memory-store.ts
  memory-writer.ts
  memory-summarizer.ts
llm/
  model-client.ts
  model-gateway.ts
  deepseek-provider.ts
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

不要求一次性创建所有目录。实现顺序应由阶段目标驱动。

## 从 MVP 到正式系统的阶段路线

### Phase 0：保留 MVP，明确边界

目标：把 `agent-mvp` 定位为实验包，不让它成为未来所有业务逻辑的堆放处。

产出：

- 当前 MVP 文档归档；
- 根目录最终架构方案；
- 明确 `agent-core` 承接正式抽象。

验收：

- 能说明 MVP 中每个模块对应正式系统哪一层；
- 能说明哪些 MVP 设计不能直接照搬。

### Phase 1：可靠单任务闭环

目标：把当前竞品分析从 demo 提升为可复现、可调试、可回归的单任务能力。

必做：

- 抽象通用 `ModelClient`；
- 引入 `Evidence` 和 `evidenceId`；
- 报告输出引用 evidence id；
- 引入 `Run` 和 `Artifact` 概念；
- 增加基础 eval case；
- 记录 prompt/message、model usage、cost、trace；
- 增加 token budget 和上下文裁剪策略。

暂不做：

- 多 Agent；
- 长期 memory；
- 向量数据库；
- 自动复杂规划；
- 大规模 UI。

验收：

- 每份报告能追溯到输入、证据、prompt、模型、质量检查；
- 改 prompt 后能用固定 case 对比质量；
- 模型 provider 更换不影响 workflow 主体。

### Phase 2：多轮澄清和局部深挖

目标：支持分析前澄清、分析后追问和需求细化。

必做：

- Conversation Layer；
- Task Intent 分类；
- Conversation Summary；
- Deep Dive Workflow；
- Requirement Refinement Workflow；
- Artifact versioning；
- Project Memory 初版。

验收：

- 用户可以追问某个维度而不重跑全流程；
- 用户可以将某条需求建议展开为需求卡片；
- 用户反馈能沉淀到 project memory 或 artifact revision。

### Phase 3：真实网页证据系统

目标：从手动 HTML 走向真实网页和多模态证据。

必做：

- Playwright 渲染抓取；
- 可见文本抽取；
- DOM selector 记录；
- screenshot 归档；
- evidence store；
- evidence validation；
- 网页版本和 capturedAt 管理。

验收：

- 每条关键证据有来源、时间、selector 或截图引用；
- 网页更新后能区分旧证据和新证据；
- 报告中的重要判断能追溯到 evidence。

### Phase 4：产品化质量体系

目标：让系统能稳定服务真实用户，并能持续优化。

必做：

- eval 数据集；
- LLM judge rubric；
- prompt/model 回归测试；
- 成本、延迟、失败率监控；
- 人工复核队列；
- 用户反馈闭环；
- memory 生命周期管理。

验收：

- 新模型或新 prompt 上线前能跑回归；
- 系统能统计不同 workflow 的成本和失败率；
- 质量下降时能定位是输入、证据、prompt、模型还是 evaluator 问题。

### Phase 5：高级 Agent 能力

目标：在稳定系统之上引入更强的自动化。

可以考虑：

- 多竞品并行分析；
- Research Agent / Critic Agent / PM Agent 等角色拆分；
- embedding 检索；
- 市场资料和外部报告 RAG；
- 自动生成 roadmap；
- 与需求管理工具集成。

触发条件：

- 单 workflow 已稳定；
- evidence 和 eval 已稳定；
- 成本、延迟、质量可观测；
- 多 Agent 能带来明确收益，而不是架构炫技。

## 当前 MVP 到正式架构的映射

```text
packages/agent-mvp/src/index.ts
→ 临时 CLI / 入口层

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

MVP 最大的问题不是“不够智能”，而是多个正式系统概念混在一起：

```text
prompt 混合 instruction、context、output contract
homepage profile 混合 evidence、fact、feature extraction
workflow 混合 orchestration、IO、model call、artifact write
quality check 只检查结构数量，不检查证据真实性
trace 只记录摘要，不足以完整复盘
```

后续不要急于重写。正确做法是逐步拆清边界。

## 关键架构决策

### 是否早期做多 Agent

不做。

早期推荐：

```text
多 workflow
+ 多 step
+ 单 orchestrator
+ 可控 LLM 调用
```

只有当以下条件出现时再考虑多 Agent：

- 不同角色确实需要独立上下文和独立评估；
- 单个 workflow 已经难以维护；
- 需要并行处理多个证据源或多个竞品；
- 有明确的成本和质量监控。

### 是否早期做 RAG

不做泛化 RAG，先做 evidence retrieval。

推荐顺序：

```text
按 taskId / product / evidence type / section / keyword 检索
→ 加入简单相关性排序
→ 再考虑 embedding 检索
```

RAG 的目标不是把所有东西向量化，而是让模型拿到最相关、最可信、最少噪声的上下文。

### 是否早期做长期 Memory

不做复杂长期 memory。

推荐先完成：

```text
Evidence Store
Artifact Store
Project Memory
Product Memory
User Memory
```

没有 evidence id 和 artifact version 的 memory 很容易成为污染源。

### 是否自动网页抓取

需要，但不要和分析逻辑耦合。

网页抓取属于 Evidence Collection Workflow。分析 workflow 只消费 evidence，不关心 evidence 来自上传 HTML、Playwright、文档解析还是用户输入。

## 接下来工程实施顺序清单

下面是从当前状态开始最推荐的施工顺序。先按顺序做，不要一开始并行铺太多模块。

### Step 1：冻结 MVP 定位

目标：明确 `agent-mvp` 是实验包，不继续承载正式业务复杂度。

要做：

- 保留当前 `agent-mvp` 作为可运行样例；
- 不在 `agent-mvp` 中继续扩张 memory、MCP、多 Agent；
- 后续正式抽象进入 `packages/agent-core`；
- 根目录 docs 以本文档作为主参考。

验收：

- 能从文档说明 MVP 和正式系统的区别；
- 新功能默认不继续堆进 `agent-mvp`。

### Step 2：在 agent-core 定义最小核心 contract

目标：先把正式系统的骨架类型定下来。

优先定义：

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

要做：

- 使用 `zod` 定义运行时 schema；
- 使用 `z.infer` 推导 TypeScript 类型；
- contract 只定义边界，不急着做完整实现；
- apps/api 和 agent-core 后续都引用这些 contract。

验收：

- 能用类型表达“一次任务、一次运行、一个证据、一个产物、一次工具调用”；
- 不依赖具体模型 provider；
- 不依赖具体 UI。

### Step 3：抽象 Model Gateway

目标：把 `DeepSeekClient` 的经验迁移为通用模型层。

要做：

- 定义 `ModelClient` / `ModelGateway`；
- 实现 `DeepSeekProvider`；
- 支持 `generateJson` 和 `generateText`；
- 记录 model id、usage、attempts、latency；
- 保留 timeout、retry、JSON repair 能力；
- workflow 只依赖模型抽象，不直接依赖 DeepSeek。

验收：

- 更换 provider 不需要改 workflow 主体；
- 每次模型调用都有 trace metadata；
- JSON 输出仍然经过 schema validation。

### Step 4：引入 Evidence Packet

目标：把 homepage profile 从字符串集合升级为可追溯证据。

要做：

- 定义 `Evidence` schema；
- 给每条抽取文本生成稳定 `evidenceId`；
- 记录 `sourceType`、`productRole`、`section`、`sourceFile/sourceUrl`、`capturedAt`；
- 当前仍可先使用手动 HTML 和 cheerio；
- 输出 `evidence-packet.json`。

验收：

- 每条关键页面信息都有 evidence id；
- 能区分 self / competitor；
- 能区分 hero、nav、pricing、docs、customers 等 section；
- 原始 homepage profile 不再作为最终证据模型。

### Step 5：改造报告引用 evidenceId

目标：让报告结论可追溯。

要做：

- 修改 report schema；
- `selfEvidence` / `competitorEvidence` 由纯文本升级为 evidence id 引用；
- Markdown 渲染时再把 evidence id 显示为可读文本；
- quality check 增加 evidence id 是否存在的校验；
- prompt 要求模型引用 evidence id。

验收：

- 报告中的每个关键维度都能追溯到 evidence；
- evidence id 不存在时报告不通过；
- 用户追问时能根据 evidence id 找回上下文。

### Step 6：建立 Run / Artifact Store 雏形

目标：每次运行都可复盘。

早期可以先用文件目录，不必马上上数据库。

推荐结构：

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

要做：

- 每次分析生成 run id；
- 保存 input manifest；
- 保存 evidence packet；
- 保存 LLM messages；
- 保存 raw response 和 parsed output；
- 保存 quality check；
- 保存 usage；
- 保存 final artifact。

验收：

- 任意一次分析可以复盘输入、证据、prompt/messages、模型、输出和质量结果；
- 新旧 run 可以对比。

### Step 7：实现第一层 Business Workflow Tools

目标：让系统开始具备 Agent 可调用的粗粒度能力。

先定义并实现：

```text
run_competitive_analysis
deep_dive_dimension
refine_requirement
write_prd
```

要做：

- 定义 `ToolDefinition`；
- 每个 workflow tool 有 input schema 和 output schema；
- tool 内部调用 workflow runner；
- tool 输出 artifact id、summary、quality status；
- tool 调用写 trace。

验收：

- LLM 或 API 层可以按名称调用这些能力；
- 用户追问维度时不需要重跑完整分析；
- 需求建议可以继续细化为需求卡片或 PRD 草稿。

### Step 8：实现 Agent Router / Planner 初版

目标：让系统从“固定 workflow”变成“受控 Agent”。

要做：

- 定义用户 intent 分类；
- 根据用户输入选择 workflow tool；
- 信息不足时生成澄清问题；
- 用户追问时选择 deep dive；
- 用户要求文档时选择 write_prd；
- Agent Router 只选择粗粒度工具，不直接拼底层步骤。

验收：

- 用户可以自然语言触发不同 workflow tool；
- 系统能区分完整分析、追问、需求细化、PRD 生成；
- 不让 LLM 直接调用底层 `callModel`、`parseJson` 等工程步骤。

### Step 9：接入第二层 Primitive / MCP Tools

目标：为开放式探索和局部问答提供更强自主性。

优先接入：

```text
browser / Playwright tool
fetch_url
read_file
query_evidence
query_artifact
```

要做：

- 通过 MCP 或自定义 function tool 暴露细粒度能力；
- 给每个 tool 设置权限、范围和成本限制；
- 在非核心主流程中允许 ReAct-style 探索；
- 禁止 primitive tool 绕过 evidence / artifact / trace 体系。

验收：

- 用户问开放式问题时，Agent 可以查询网页、文件或已有证据；
- 工具调用有 trace；
- 细粒度工具不会破坏核心 workflow 的可控性。

### Step 10：建立最小 eval 样例集

目标：让 prompt、模型和 workflow 的改动可回归。

要做：

- 准备 3-5 组固定竞品分析样例；
- 保存输入、期望质量标准、人工评价；
- 每次改 prompt/model/workflow 后跑 eval；
- 记录 schema、evidence、quality、cost、latency 指标。

验收：

- 能知道一次改动让质量变好还是变坏；
- prompt 调参不再只靠感觉；
- 模型替换有基本评估依据。

### Step 11：接入真实网页抓取

目标：从手动 HTML 走向真实网页 evidence collection。

要做：

- 使用 Playwright 或 MCP browser tool 渲染页面；
- 抽取可见文本；
- 保存 DOM selector；
- 保存截图引用；
- 记录 capturedAt；
- 将抓取结果统一转成 Evidence Packet。

验收：

- 输入 URL 可以生成 evidence；
- evidence 能回到 URL、selector、截图；
- 分析 workflow 仍然只消费 evidence，不关心证据来源。

### Step 12：再考虑 Project Memory

目标：在 evidence 和 artifact 稳定后，引入低风险 memory。

先做：

```text
Project Memory
Conversation Summary
用户确认/否定记录
```

暂缓：

```text
复杂长期 User Memory
向量化全部历史
自动沉淀所有模型推断
```

验收：

- 用户确认的信息能被后续任务复用；
- 用户否定的信息不会继续污染上下文；
- memory 有 source、confidence、status。

## 最小正式版验收标准

一个可以称为“正式版雏形”的系统，至少要回答这些问题：

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

如果这些问题答不上来，系统仍然停留在 demo 阶段。

## 明确不做的事

早期不做：

- 完全自主多 Agent；
- 泛化 RAG 平台；
- 复杂长期 memory；
- 大而全前端；
- 自动生成完整产品战略；
- 没有 evidence 的市场结论；
- 无 trace 的黑盒模型调用；
- 无 eval 的 prompt 反复调参。

## 最终路线

后续开发应坚持：

```text
先把 workflow 做稳
再把 evidence 做实
再把 context builder 做清楚
再引入多轮交互
再沉淀 project memory
再扩展 PRD 和需求管理
最后再考虑多 Agent、RAG 和复杂自动规划
```

当前 MVP 的正确定位：

```text
它不是最终架构。
它是验证竞品分析链路成立的实验包。
它最有价值的遗产是 workflow、schema、trace、model client、quality check 的雏形。
```

正式系统要保留这些好习惯，但必须把 prompt、context、memory、evidence、artifact、eval 和 trace 的边界拆清楚。
