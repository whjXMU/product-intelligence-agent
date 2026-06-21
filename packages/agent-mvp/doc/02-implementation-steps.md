# 实施步骤

## Step 1：工程接入

目标：让 `packages/agent-mvp` 成为 pnpm workspace 中的独立实验包。

验收：

```bash
pnpm --filter @ai-product-agent/agent-mvp typecheck
pnpm --filter @ai-product-agent/agent-mvp build
pnpm --filter @ai-product-agent/agent-mvp start
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

## Step 5：Competitive Analysis Workflow

目标：串联 HTML 提取、模型分析、报告生成。

输出：

- `output/report.json`
- `output/report.md`
- `output/trace.json`

## Step 6：质量校验

目标：判断输出是否像产品经理能用的结果。

最低标准：

- 每个评分维度有 evidence；
- 每条优化需求有问题、方案和指标；
- 报告能指出己方和竞品的具体差异；
- 不输出无法从页面内容支撑的断言。
