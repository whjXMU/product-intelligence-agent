# 实施步骤

## Step 1：工程接入

目标：让 `packages/agent-mvp` 成为 pnpm workspace 中的独立实验包。

验收：

```bash
pnpm --filter @product-intelligence-agent/agent-mvp typecheck
pnpm --filter @product-intelligence-agent/agent-mvp build
pnpm --filter @product-intelligence-agent/agent-mvp start
```

## Step 2：定义输入输出 Schema

目标：先把 Agent 的输入输出边界写清楚。

计划新增：

```text
src/schemas/task.schema.ts
src/schemas/homepage.schema.ts
src/schemas/report.schema.ts
```

当前实现：

- 使用 `zod` 定义 schema；
- 使用 `z.infer` 推导 TypeScript 类型；
- 对 `task.json`、中间态 homepage profile、最终 report、trace 都保留运行时校验入口；
- 后续对 LLM 输出做严格 parse，失败时进入修复或重试流程。

为什么不直接只写 TypeScript 类型：

- TypeScript 类型只在编译期有效；
- `task.json` 和 LLM 返回值都是运行时数据；
- Agent 项目必须重视运行时校验，否则错误会延迟到 workflow 后半段才暴露。

## Step 3：HTML 清洗与首页信息提取

目标：把手动 HTML 转为可分析的结构化 homepage profile。

推荐库：

- `cheerio`：解析静态 HTML；
- `html-to-text`：可选，用于正文文本抽取。

当前实现：

- 使用 `cheerio` 提取 title、description、heading、nav、button/link 文案；
- 使用 `html-to-text` 抽取正文文本预览；
- 使用关键词规则初步归类 CTA、产品主张、目标用户、信任信号、开发者信号和定价信号；
- 输出 `output/homepage-profiles.json`，作为 LLM 分析前的可审计中间态。

为什么要有这个中间态：

- 避免把整份 HTML 直接丢给模型；
- 减少 token 浪费；
- 降低无关脚本、样式、导航噪声；
- 方便人工检查 Agent 到底基于什么信息做判断。

## Step 4：DeepSeek Model Client

目标：封装 DeepSeek 调用，避免 workflow 直接写 HTTP 细节。

当前推荐先用 DeepSeek 兼容 OpenAI 的 Chat Completions API。

可选方案：

- 直接用 Node `fetch` 调 HTTP：依赖少，适合 MVP；
- 使用 `openai` SDK：体验好，但多一个依赖。

当前推荐先用 `fetch`，因为 Node 版本已经支持全局 `fetch`。

当前实现：

- 支持 `DEEPSEEK_API_KEY` 或 `LLM_API_KEY`；
- 支持 `DEEPSEEK_BASE_URL` 或 `LLM_BASE_URL`；
- 支持 `DEEPSEEK_MODEL` 或 `LLM_MODEL_ID`；
- 支持超时配置：`DEEPSEEK_TIMEOUT_MS` 或 `LLM_TIMEOUT_MS`；
- 支持重试次数配置：`DEEPSEEK_MAX_RETRIES` 或 `LLM_MAX_RETRIES`；
- 默认对 429、5xx、网络错误和超时进行重试；
- 输出 `output/llm-response-meta.json` 记录模型、usage 和 attempts。

为什么要封装成 client：

- workflow 不应该关心 HTTP 细节；
- 更换模型 provider 时，只改 client 或 provider 层；
- 超时、重试、usage 记录属于模型调用基础设施，不属于业务分析逻辑。

## Step 5：Competitive Analysis Workflow

目标：串联 HTML 提取、模型分析、报告生成。

输出：

- `output/report.json`
- `output/report.md`
- `output/homepage-profiles.json`
- `output/quality-check.json`
- `output/llm-response-meta.json`
- `output/prompt-meta.json`
- `output/trace.json`

当前实现：

- workflow 负责编排，不直接写模型 HTTP 细节；
- DeepSeek client 负责模型调用；
- prompt 文件负责 prompt 版本和 prompt 内容；
- renderer 负责 Markdown 输出；
- evaluator 负责本地质量检查。

## Step 5.1：JSON 修复重试

目标：模型第一次输出 JSON 不合法时，不立即失败，而是进入修复流程。

当前实现：

- 第一次先执行 `JSON.parse + zod schema`；
- 如果失败，调用 DeepSeek 进行一次 JSON 修复；
- 修复 prompt 明确要求“不新增事实，只修 JSON 结构”；
- 修复结果再次经过 `competitiveAnalysisReportSchema`；
- 修复信息写入 `output/llm-response-meta.json`。

为什么这一步重要：

- LLM 即使被要求输出 JSON，也可能偶发输出多余文本、错误枚举值或缺字段；
- Agent 系统不能把偶发格式错误暴露给用户；
- 修复重试是结构化输出场景的基础稳定性能力。

## Step 5.2：Prompt 版本管理

目标：让每份报告可以追溯到使用的 prompt 版本。

当前实现：

- prompt 文件导出 `COMPETITIVE_ANALYSIS_PROMPT_VERSION`；
- workflow 输出 `output/prompt-meta.json`；
- prompt 版本当前为 `competitive-analysis.v1.1.0`。

为什么这一步重要：

- Agent 输出质量很大程度取决于 prompt；
- 后续调整 prompt 后，需要知道报告差异来自模型、输入还是 prompt 版本；
- eval 和回归测试必须绑定 prompt 版本。

## Step 6：质量校验

目标：判断输出是否像产品经理能用的结果。

最低标准：

- 每个评分维度有 evidence；
- 每条优化需求有问题、方案和指标；
- 报告能指出己方和竞品的具体差异；
- 不输出无法从页面内容支撑的断言。

当前实现：

- 检查比较维度数量；
- 检查产品需求数量；
- 检查标准维度覆盖率；
- 检查每个维度是否包含己方和竞品 evidence；
- 检查每条需求是否包含 success metrics；
- 输出 `output/quality-check.json`。

注意：

质量检查不是为了替代产品经理判断，而是为了让 Agent 输出具备最低可用标准。后续可以继续加入更细的 eval，例如事实一致性、需求可执行性、证据引用准确性。

## MVP 剩余任务

### 必做

- 增加 JSON 修复失败时的错误归档；
- 增加 prompt 输入长度统计和过长截断策略；
- 增加报告人工复核清单；
- 把 `quality-check` 扩展为可配置阈值；
- 增加最小 eval case，记录一次固定输入的期望质量。

### 可选

- 将 `DeepSeekClient` 抽象成通用 `ModelClient`；
- 增加缓存，避免同一份 HTML 重复调用模型；
- 增加多轮分析：先提取网页 profile，再让模型按维度逐项分析；
- 增加 CLI 参数，支持指定不同 task 文件；
- 增加 HTML 输入脱敏和敏感信息扫描。

### 暂不做

- 多 Agent；
- RAG；
- 数据库；
- 队列；
- 自动网页抓取；
- 前端可视化调试面板。
