import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { AnalysisTaskEntity } from './analysis-tasks/analysis-task.entity';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: Number(process.env.DATABASE_PORT ?? 5432),
  username: process.env.DATABASE_USER ?? 'agent',
  password: process.env.DATABASE_PASSWORD ?? 'agent',
  database: process.env.DATABASE_NAME ?? 'agent_dev',
  entities: [AnalysisTaskEntity],
  migrations: ['../../database/migrations/*{.ts,.js}'],
  synchronize: false,
  migrationsRun: false,
});

export default AppDataSource;
