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

## 待完成

- 输入输出 schema；
- HTML 清洗与结构化提取；
- DeepSeek model client；
- competitive-analysis workflow；
- JSON/Markdown/trace 输出；
- 使用真实 HTML 样例运行验证。

## 验证记录

- `pnpm -r list --depth -1`：已识别 `@ai-product-agent/agent-mvp`；
- `pnpm --filter @ai-product-agent/agent-mvp typecheck`：未通过，原因是新 workspace 包尚未执行 `pnpm install`，本地 `node_modules` 链接未建立，导致 `@types/node` 无法解析。

## 当前阻塞

需要开发者在根目录手动执行：

```bash
pnpm install
```

执行完成后继续验证：

```bash
pnpm agent:mvp:typecheck
pnpm agent:mvp:build
pnpm agent:mvp
```
