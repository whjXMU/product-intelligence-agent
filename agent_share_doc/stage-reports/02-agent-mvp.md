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

- `pnpm -r list --depth -1`：已识别 `@ai-product-agent/agent-mvp`；
- `pnpm --filter @ai-product-agent/agent-mvp typecheck`：未通过，原因是新 workspace 包尚未执行 `pnpm install`，本地 `node_modules` 链接未建立，导致 `@types/node` 无法解析。
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

## 当前阻塞

暂无。
