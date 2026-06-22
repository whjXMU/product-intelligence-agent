import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import type { DataSourceOptions } from 'typeorm';
import { AnalysisTaskEntity } from '../analysis-tasks/analysis-task.entity';
import { getDatabaseConfig } from '../config/database.config';

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
    entities: [AnalysisTaskEntity],
    migrations: [migrationsGlob],
    synchronize: false,
    migrationsRun: false,
  };
}
