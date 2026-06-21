# 启动与验证说明

## 环境要求

- Node.js；
- pnpm；
- Docker Desktop 或本机 PostgreSQL。

当前项目使用 pnpm workspace 管理多个应用和包。

## 1. 安装依赖

```bash
pnpm install
```

如果 Codex 执行安装命令时因为网络或 registry 问题中断，可以由开发者手动执行该命令。

## 2. 启动数据库

```bash
pnpm db:up
```

该命令会启动 `docker-compose.yml` 中的 PostgreSQL。

默认连接信息：

- Host：`localhost`
- Port：`5432`
- User：`agent`
- Password：`agent`
- Database：`agent_dev`

## 3. 启动后端

```bash
pnpm dev:api
```

后端默认监听：

```text
http://localhost:3000
```

健康检查：

```text
http://localhost:3000/health
```

## 4. 启动前端

```bash
pnpm dev:web
```

前端默认监听：

```text
http://localhost:5173
```

首页会调用后端 `/health`，展示 API、PostgreSQL 和 Agent Core 的状态。

## 5. 验证命令

```bash
pnpm typecheck
pnpm lint
pnpm build
pnpm --filter @ai-product-agent/api test
```

## 常见问题

### Docker daemon 未启动

如果看到：

```text
Cannot connect to the Docker daemon
```

说明 Docker Desktop 没有启动。启动 Docker Desktop 后重新执行：

```bash
pnpm db:up
```

### 前端显示后端连接失败

优先检查：

- 后端是否已执行 `pnpm dev:api`；
- 后端是否监听 `3000` 端口；
- 数据库是否已启动；
- 浏览器是否访问 `http://localhost:5173`。
