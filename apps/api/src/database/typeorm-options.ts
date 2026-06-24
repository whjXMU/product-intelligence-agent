import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import type { DataSourceOptions } from 'typeorm';
import { getDatabaseConfig } from '../config/database.config';
import { AnalysisSessionEntity } from '../modules/analysis-tasks/entities/analysis-session.entity';
import { AnalysisTaskRunEntity } from '../modules/analysis-tasks/entities/analysis-task-run.entity';
import { AnalysisTaskEntity } from '../modules/analysis-tasks/entities/analysis-task.entity';

const migrationsGlob = '../../database/migrations/*{.ts,.js}';

export function getTypeOrmModuleOptions(): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    ...getDatabaseConfig(),
    entities: [],
    synchronize: false,
    migrationsRun: false,
    autoLoadEntities: true,
  };
}

export function getTypeOrmDataSourceOptions(): DataSourceOptions {
  return {
    type: 'postgres',
    ...getDatabaseConfig(),
    entities: [
      AnalysisTaskEntity,
      AnalysisTaskRunEntity,
      AnalysisSessionEntity,
    ],
    migrations: [migrationsGlob],
    synchronize: false,
    migrationsRun: false,
  };
}
