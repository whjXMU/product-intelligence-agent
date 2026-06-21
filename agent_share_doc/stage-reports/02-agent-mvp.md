# 阶段 02 报告：Agent MVP 核心能力验证

## 阶段目标

先忽略前端、后端、数据库和网页抓取，在 `packages/agent-mvp` 中验证竞品首页分析 Agent 的核心流程。

## 当前输入方式

开发者手动复制 HTML 到：

```text
packages/agent-mvp/input/self.html
packages/agent-mvp/input/competitor.html
```

任务配置参考：

```text
packages/agent-mvp/input/task.example.json
```

正式运行时复制为：

```text
packages/agent-mvp/input/task.json
```

## 当前 LLM Provider

使用 DeepSeek。

API Key 放在本地：

```text
packages/agent-mvp/.env
```

注意：不读取、不打印、不提交 API Key。

## 已完成

- `packages/agent-mvp` 已加入 pnpm workspace；
- 已创建最小 package 骨架；
- 已创建输入输出目录；
- 已创建 Agent MVP 设计文档；
- 已新增根目录快捷脚本。
- 已定义 `task`、`homepage`、`report`、`trace` 四类 schema；
- CLI 入口已接入 `task.json` 校验。
- schema 已切换为 `zod`，同时提供运行时校验和 TypeScript 类型推导；
- 已实现 HTML 到 homepage profile 的确定性提取器；
- CLI 在输入齐全时会输出 `packages/agent-mvp/output/homepage-profiles.json`。

## 待完成

- HTML 清洗与结构化提取；
- DeepSeek model client；
- competitive-analysis workflow；
- JSON/Markdown/trace 输出；
- 使用真实 HTML 样例运行验证。

## 验证记录

- `pnpm -r list --depth -1`：已识别 `@product-intelligence-agent/agent-mvp`；
- `pnpm --filter @product-intelligence-agent/agent-mvp typecheck`：未通过，原因是新 workspace 包尚未执行 `pnpm install`，本地 `node_modules` 链接未建立，导致 `@types/node` 无法解析。
- 开发者手动执行 `pnpm install` 后，`pnpm agent:mvp:typecheck` 已通过。
- `pnpm agent:mvp:build` 已通过。
- `pnpm agent:mvp` 已通过，提示待补充 `task.json` 和两个 HTML 文件。
- 安装 `zod`、`cheerio`、`html-to-text` 后，schema 已切换为 `zod`，HTML 提取器已接入；
- `pnpm agent:mvp:typecheck`：通过；
- `pnpm agent:mvp:build`：通过；
- `pnpm agent:mvp`：通过。
- 用户补充真实 `task.json`、`self.html`、`competitor.html` 后，完整 workflow 已跑通；
- 输出文件：
  - `packages/agent-mvp/output/homepage-profiles.json`
  - `packages/agent-mvp/output/report.json`
  - `packages/agent-mvp/output/report.md`
  - `packages/agent-mvp/output/trace.json`
- 本次 DeepSeek 调用模型：`deepseek-v4-pro`；
- 本次 prompt 字符数：7889；
- DeepSeek 分析耗时：92548ms；
- 产出报告包含 12 个比较维度、6 条产品优化需求；
- 模型输出已通过 `competitiveAnalysisReportSchema` 校验。

## 当前观察

- DeepSeek 页面 HTML 没有提取到传统 heading，但通过正文前几行兜底提取到了 hero 信息；
- OpenAI 页面信息密度明显更高，报告中差距分析主要集中在场景表达、企业信任、商业化路径和生态表达；
- 当前提取器仍是启发式规则，后续可以继续优化 navigation、首屏区域和 footer 噪声过滤；
- 当前 LLM 分析已可用，但还没有实现失败重试、JSON 修复、成本统计和 eval 自动评分。

## 稳定性优化记录

- DeepSeek client 已支持超时和重试；
- DeepSeek client 已记录 usage、model 和 attempts；
- workflow 已输出 `llm-response-meta.json`；
- 新增本地质量检查器，输出 `quality-check.json`；
- 质量检查当前覆盖维度数量、需求数量、标准维度覆盖、证据完整性和成功指标；
- HTML 正文抽取已优先使用 `main`，并在无 `main` 时过滤 `header/nav/footer`；
- HTML 正文行已过滤备案、版权、协议等页脚噪声。

## 最新验证

- `pnpm agent:mvp:typecheck`：通过；
- `pnpm agent:mvp:build`：通过；
- `pnpm agent:mvp`：通过；
- `quality-check.json`：passed 为 true；
- 本次 LLM usage：prompt_tokens 3359，completion_tokens 7376，total_tokens 10735；
- 本次 DeepSeek 调用 attempts：1。

## JSON 修复与 Prompt 版本管理

- DeepSeek client 已迁移为 OpenAI SDK 调用；
- `packages/agent-mvp` 已声明 `openai` 依赖；
- 新增 prompt 版本：`competitive-analysis.v1.1.0`；
- workflow 已输出 `prompt-meta.json`；
- 模型输出先执行 `JSON.parse + zod schema`；
- 如果 JSON 或 schema 校验失败，会调用 DeepSeek 执行一次 JSON 修复；
- 修复结果仍必须通过 `competitiveAnalysisReportSchema`；
- 修复是否发生、修复 attempts、修复模型和 usage 会写入 `llm-response-meta.json`。

## 最新验证：OpenAI SDK 迁移后

- `pnpm agent:mvp:typecheck`：通过；
- `pnpm agent:mvp:build`：通过；
- `pnpm agent:mvp`：通过；
- `prompt-meta.json` 已输出：`competitive-analysis.v1.1.0`；
- `llm-response-meta.json` 已输出；
- 本次 JSON 修复未触发：`repaired=false`；
- 本次 DeepSeek 调用 attempts：1；
- 本次 LLM usage：prompt_tokens 3257，completion_tokens 6062，total_tokens 9319；
- `quality-check.json`：passed 为 true。

## 项目命名对齐

- 根项目名称已对齐为 `product-intelligence-agent`；
- workspace 包名已从 `@ai-product-agent/*` 对齐为 `@product-intelligence-agent/*`；
- 前后端共享包 import 已对齐为 `@product-intelligence-agent/shared`；
- Docker PostgreSQL 容器名已对齐为 `product-intelligence-agent-postgres`；
- README、docs、agent_share_doc 中旧项目名已替换。

### 当前注意事项

改 workspace package name 后，需要重新生成 pnpm workspace 软链。

当前 `pnpm typecheck` 中 `apps/web` 和 `apps/api` 会因为本地 `node_modules` 仍是旧软链而暂时找不到 `@product-intelligence-agent/shared`。

需要开发者在根目录手动执行：

```bash
pnpm install
```

之后再验证：

```bash
pnpm typecheck
pnpm build
```

## 当前阻塞

暂无。
