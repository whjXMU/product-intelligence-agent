# 阶段 02 任务说明：竞品分析任务业务骨架

## 阶段目标

建立正式产品主线的第一个业务闭环：竞品分析任务。

本阶段不接真实 Agent，不复用 `packages/agent-mvp` 的实验 workflow，只用 mock 结果验证产品和工程链路。

目标链路：

```text
前端创建任务
→ 后端保存 analysis_tasks
→ 前端查看任务列表
→ 前端查看任务详情和 mock 分析报告
→ 后续阶段替换为正式 Agent workflow
```

## 为什么先做任务骨架

Agent 产品不是只有模型调用。正式系统必须先回答：

- 用户提交什么任务；
- 任务状态如何流转；
- 输入、结果和 trace 存在哪里；
- 前端如何展示任务和报告；
- 后续 Agent 执行如何接入稳定业务对象。

如果跳过任务骨架继续扩展 `agent-mvp`，项目会变成一个脚本 demo，而不是成熟 Agent 产品。

## 当前立即实现

### 后端

- 新增 `analysis-tasks` NestJS module；
- 新增 TypeORM entity：`AnalysisTaskEntity`；
- 新增 migration，创建 `analysis_tasks` 表；
- 新增 shared DTO 和类型；
- 提供任务 API：
  - `POST /analysis-tasks`：创建任务；
  - `GET /analysis-tasks`：任务列表；
  - `GET /analysis-tasks/:id`：任务详情；
  - `POST /analysis-tasks/:id/run-mock`：生成 mock 分析结果。

### 前端

- 将首页升级为任务工作台；
- 保留 health check 状态区域，但不要让它成为主界面重点；
- 新增创建任务表单；
- 新增任务列表；
- 新增任务详情和 mock 报告展示；
- 所有接口调用使用 `packages/shared` 中的 DTO 类型。

### 文档

- 更新本阶段报告；
- 更新 `agent_share_doc/project-status.md`；
- 必要时补充 `docs/getting-started.md` 中的验证方式。

## 当前只预留

- `trace` 字段：未来接 Agent trace；
- `result` 字段：当前存 mock 报告，未来存正式报告；
- `input` 字段：当前存用户输入，未来扩展为 structured input；
- `status` 字段：当前手动 mock 流转，未来接 workflow runner。

## 当前不实现

- 不接 DeepSeek；
- 不调用 `packages/agent-mvp`；
- 不做多 Agent；
- 不做 RAG；
- 不做网页抓取；
- 不做队列；
- 不做复杂权限系统；
- 不把 experimental prompt、workflow、LLM client 迁入正式代码。

## 推荐数据模型

### 状态

```ts
type AnalysisTaskStatus = 'created' | 'running' | 'completed' | 'failed';
```

### analysis_tasks 表

建议字段：

- `id`：uuid，主键；
- `title`：任务标题；
- `productName`：己方产品名称；
- `competitorName`：竞品名称；
- `analysisGoal`：分析目标；
- `sourceType`：输入类型，当前可为 `manual`;
- `input`：jsonb，任务输入；
- `status`：任务状态；
- `result`：jsonb，可为空，当前存 mock 报告；
- `trace`：jsonb，可为空，未来存 Agent trace；
- `errorMessage`：失败原因，可为空；
- `createdAt`：创建时间；
- `updatedAt`：更新时间。

## 推荐 API 契约

### POST /analysis-tasks

请求：

```json
{
  "title": "OpenAI 与 DeepSeek 首页竞品分析",
  "productName": "OpenAI",
  "competitorName": "DeepSeek",
  "analysisGoal": "比较首页定位、核心卖点、用户转化路径",
  "sourceType": "manual",
  "input": {
    "selfUrl": "https://openai.com",
    "competitorUrl": "https://deepseek.com",
    "notes": "当前阶段只保存输入，不抓取网页。"
  }
}
```

响应：`AnalysisTaskDto`

### GET /analysis-tasks

响应：

```ts
AnalysisTaskListItemDto[]
```

### GET /analysis-tasks/:id

响应：`AnalysisTaskDto`

### POST /analysis-tasks/:id/run-mock

行为：

- 将任务状态短暂更新为 `running`；
- 生成 mock report；
- 将状态更新为 `completed`；
- 写入 `result` 和 `trace`。

响应：`AnalysisTaskDto`

## 子窗口拆分建议

### 子窗口 A：后端任务骨架

负责写入范围：

- `apps/api/src/analysis-tasks/**`
- `apps/api/src/app.module.ts`
- `packages/shared/src/analysis-task.ts`
- `packages/shared/src/index.ts`
- `database/migrations/**`
- 必要测试文件
- 本阶段报告中的后端完成记录

不要修改：

- `packages/agent-mvp/**`
- `docs/mvp-subagent-docs/**`
- 前端页面，除非主窗口明确要求

### 子窗口 B：前端任务工作台

启动条件：

- 后端 API 契约稳定，或者主窗口已经确认 DTO。

负责写入范围：

- `apps/web/src/**`
- 必要时更新 `apps/web/README.md`
- 本阶段报告中的前端完成记录

不要修改：

- `packages/agent-mvp/**`
- 后端数据库 entity/migration；
- shared DTO，除非主窗口明确授权。

## 验收命令

不要由子窗口执行 `pnpm install`。如果依赖或 workspace 软链缺失，停止并提示开发者手动执行。

建议验证：

```bash
pnpm typecheck
pnpm lint
pnpm build
pnpm --filter @product-intelligence-agent/api test
```

数据库验证：

```bash
pnpm db:up
pnpm dev:api
pnpm dev:web
```

手动验证：

- 访问 `http://localhost:5173`；
- 创建一个分析任务；
- 查看任务列表；
- 进入任务详情；
- 点击或触发 mock 分析；
- 看到 mock 报告和状态变为 `completed`。

## 完成标准

- 前端可以完成任务创建、列表查看、详情查看；
- 后端任务数据持久化到 PostgreSQL；
- mock 分析结果可以写入并展示；
- shared DTO 被前后端共同使用；
- `packages/agent-mvp` 保持实验包地位，没有继续承载正式业务复杂度。

## 当前执行状态

阶段 02 已完成并通过总控验收。

## 总控验收记录

验收时间：2026-06-23

总控检查结果：

- 后端 `analysis-tasks` 模块边界清晰，controller/service/mock runner/entity/mapper 分层合理；
- `packages/shared/src/analysis-task.ts` 已成为前后端共享 DTO 和 zod 校验来源；
- `analysis_tasks` migration 可被 TypeORM migration 命令识别；
- 前端任务工作台已拆分为 router、API、composables、components 和展示工具；
- `packages/agent-mvp` 仍保持实验包地位，没有被正式业务直接继承；
- 页面标题已从默认 `web` 调整为 `product-intelligence-agent`。

总控验证命令：

```bash
pnpm typecheck
pnpm lint
pnpm build
pnpm --filter @product-intelligence-agent/api test
pnpm --filter @product-intelligence-agent/api test:e2e
pnpm --filter @product-intelligence-agent/web build
pnpm db:migrate
```

以上命令均已通过。

集成验证：

- `docker compose up -d postgres`：PostgreSQL 容器运行中；
- `\dt analysis_tasks`：确认 `analysis_tasks` 表存在；
- `GET /health`：返回数据库连接正常；
- `POST /analysis-tasks`：创建验收任务成功，状态为 `created`；
- `POST /analysis-tasks/:id/run-mock`：mock 执行成功，状态变为 `completed`，并写入 `result` 和 `trace`；
- `GET /analysis-tasks`：可返回任务列表；
- `pnpm dev:web`：Vite 启动成功，因 5173 被占用自动使用 5174；
- `GET http://localhost:5174/analysis-tasks`：前端入口返回 200。

验收结论：

阶段 02 达成目标。项目已经从纯工程骨架进入了可持久化、可展示、可演进的业务任务闭环。

## 后端子窗口完成记录

后端子窗口已完成阶段 02 后端任务骨架。

完成内容：

- 新增 `analysis_tasks` TypeORM entity；
- 新增 `analysis_tasks` 建表 migration；
- 新增 NestJS `analysis-tasks` module/service/controller；
- 新增 `packages/shared/src/analysis-task.ts` DTO 和类型，并从 shared 入口导出；
- 实现后端 API：
  - `POST /analysis-tasks`
  - `GET /analysis-tasks`
  - `GET /analysis-tasks/:id`
  - `POST /analysis-tasks/:id/run-mock`
- 新增 `AnalysisTasksService` 单元测试，覆盖创建、列表、mock 执行和未找到任务；
- 修正根路由既有单测断言，使其与当前启动文案一致。

验证结果：

```bash
pnpm typecheck
pnpm lint
pnpm build
pnpm --filter @product-intelligence-agent/api test
```

以上命令均已通过。

说明：

- 本次没有执行 `pnpm install`；
- 本次没有修改 `packages/agent-mvp/**`；
- 本次没有修改 `docs/mvp-subagent-docs/**`；
- 本次没有修改 `apps/web/src/**`；

## 前端子窗口完成记录

完成时间：2026-06-22

完成内容：

- 将首页升级为阶段 02 任务工作台，并引入 Vue Router；
- `App.vue` 仅保留 `AppLayout`，`AppLayout` 挂载 `<RouterView />`；
- 新增 `app/router` 应用路由层：
  - `index.ts` 创建 router；
  - `routes.ts` 汇总根路由；
  - `routeModules.ts` 使用 `import.meta.glob` 自动汇总 `views/**/routes.ts`；
  - `types.ts` 定义可选 `disabled` 的本地路由类型；
- 新增 `views/analysis-tasks` 业务视图模块，模块内聚路由、页面、任务 API、composables、组件和业务展示工具；
- 新增路由页面：
  - `/analysis-tasks`：任务工作台；
  - `/analysis-tasks/:id`：任务详情和 mock 报告；
- 新增跨业务 shared 层：
  - `shared/api/http.ts`：通用 HTTP 请求；
  - `shared/utils/date.ts`：通用日期格式化；
  - `shared/utils/error.ts`：通用错误格式化；
  - `shared/system/**`：health check API、composable 和状态条组件；
- 新增任务工作台组件：
  - `AnalysisTaskCreateForm.vue`
  - `AnalysisTaskList.vue`
  - `AnalysisTaskDetailPanel.vue`
- 新增任务展示工具函数 `analysisTaskDisplay.ts`，集中处理日期、状态文案和 mock result/trace 类型收窄；
- 保留 health check 状态，并弱化为底部状态条；
- 新增竞品分析任务创建表单；
- 新增任务列表，支持刷新和点击进入详情路由；
- 新增任务详情页，展示任务输入、状态、分析目标；
- 新增 mock 报告展示，覆盖 summary、定位对比、优势、机会点、建议和 trace；
- 接入后端 analysis-tasks API：
  - `POST /analysis-tasks`
  - `GET /analysis-tasks`
  - `GET /analysis-tasks/:id`
  - `POST /analysis-tasks/:id/run-mock`
- 前端请求和状态使用 `packages/shared` 导出的 DTO 类型；
- 更新 `apps/web/src/style.css`，将页面调整为工作台布局。

验证结果：

```bash
pnpm --filter @product-intelligence-agent/web typecheck
pnpm --filter @product-intelligence-agent/web build
pnpm lint
pnpm typecheck
```

以上命令均已通过。

说明：

- 本次没有执行 `pnpm install`；
- 本次没有修改 `packages/agent-mvp/**`；
- 本次没有修改 `docs/mvp-subagent-docs/**`；
- 本次没有修改后端 entity/migration；
- 本次没有修改 shared DTO。

待联调事项：

- 数据库容器和实际 migration 执行未在本窗口验证，需后续结合 `pnpm db:up` 和 API 启动做联调。
