import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AnalysisTasksModule } from './analysis-tasks/analysis-tasks.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST ?? 'localhost',
      port: Number(process.env.DATABASE_PORT ?? 5432),
      username: process.env.DATABASE_USER ?? 'agent',
      password: process.env.DATABASE_PASSWORD ?? 'agent',
      database: process.env.DATABASE_NAME ?? 'agent_dev',
      entities: [],
      synchronize: false,
      migrationsRun: false,
      // TypeORM 配置自动收集实体类，并加载到entities []中，无需手动指定
      autoLoadEntities: true,
    }),
    AnalysisTasksModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
