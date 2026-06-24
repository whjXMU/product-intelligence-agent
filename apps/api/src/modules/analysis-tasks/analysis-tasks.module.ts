import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalysisSessionsController } from './controllers/analysis-sessions.controller';
import { AnalysisTasksController } from './controllers/analysis-tasks.controller';
import { AnalysisSessionEntity } from './entities/analysis-session.entity';
import { AnalysisTaskRunEntity } from './entities/analysis-task-run.entity';
import { AnalysisTaskEntity } from './entities/analysis-task.entity';
import { AnalysisTaskMockRunnerService } from './services/analysis-task-mock-runner.service';
import { AnalysisTaskRunsService } from './services/analysis-task-runs.service';
import { AnalysisTasksService } from './services/analysis-tasks.service';
import { AnalysisSessionsService } from './services/analysis-sessions.service';
import { WorkflowRunnerService } from './workflow/runner.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AnalysisTaskEntity,
      AnalysisTaskRunEntity,
      AnalysisSessionEntity,
    ]),
  ],
  controllers: [AnalysisTasksController, AnalysisSessionsController],
  providers: [
    AnalysisTasksService,
    AnalysisTaskRunsService,
    AnalysisSessionsService,
    AnalysisTaskMockRunnerService,
    WorkflowRunnerService,
  ],
})
export class AnalysisTasksModule {}
