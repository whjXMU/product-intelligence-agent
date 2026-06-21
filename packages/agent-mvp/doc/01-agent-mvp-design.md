# Agent MVP 设计

## 当前目标

在 `packages/agent-mvp` 下验证一个最小可运行的竞品首页分析 Agent。

本阶段暂时忽略前端、后端、数据库和网页抓取，只处理用户手动放入的 HTML 文件。

## 输入

```text
packages/agent-mvp/input/
  task.json
  self.html
  competitor.html
```

`task.json` 用于描述分析视角、己方产品、竞品产品和分析目标。

`self.html` 是己方官网首页 HTML。

`competitor.html` 是竞品官网首页 HTML。

## 输出

```text
packages/agent-mvp/output/
  report.json
  report.md
  trace.json
```

`report.json` 面向程序消费。

`report.md` 面向产品经理阅读。

`trace.json` 记录每一步的输入摘要、输出摘要、耗时和错误。

## MVP Workflow

```text
读取 task.json
→ 读取两个 HTML 文件
→ 清洗 HTML 噪声
→ 提取首页产品表达信息
→ 使用 DeepSeek 进行结构化比较
→ 生成评分和差距分析
→ 生成产品优化需求
→ 输出 JSON、Markdown、Trace
```

## 当前立即实现

- 独立 package；
- workspace 接入；
- 输入输出目录；
- 设计文档；
- 后续实现所需的工程边界。

## 当前只预留

- HTML parser；
- DeepSeek model client；
- prompt；
- schema 校验；
- markdown renderer；
- trace recorder。

## 当前不实现

- 网页抓取；
- 浏览器渲染；
- 截图视觉分析；
- RAG；
- 多 Agent；
- 数据库存储；
- 前后端联动。

## 推荐技术方案

当前推荐：规则提取 + LLM 结构化分析 + Schema 校验。

原因：

- 规则提取负责降低 HTML 噪声；
- LLM 负责产品分析和洞察生成；
- Schema 校验负责稳定输出结构；
- 单 Agent workflow 便于调试和教学。

## DeepSeek Provider

`.env` 文件由开发者本地维护，不提交 Git。

建议变量名：

```text
DEEPSEEK_API_KEY=...
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
```

后续实现模型调用时，只读取环境变量，不在日志、trace 或错误信息中输出 API Key。
