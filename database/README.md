# 数据库说明

## 本地数据库

本项目使用 PostgreSQL 作为主数据库。本地开发通过根目录 `docker-compose.yml` 启动。

```bash
pnpm db:up
```

默认连接信息：

- Host：`localhost`
- Port：`5432`
- User：`agent`
- Password：`agent`
- Database：`agent_dev`

## Migration 机制

当前 MVP V0 还没有业务表，因此只预留 `database/migrations/` 目录。

未来新增业务实体时，应通过 TypeORM migration 管理数据库结构变化，而不是手动改库。

建议触发条件：

- 新增竞品分析任务表；
- 新增分析报告表；
- 新增 Agent trace 表；
- 新增用户偏好或长期记忆表。
