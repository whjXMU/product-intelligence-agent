import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalysisTasksController } from './controllers/analysis-tasks.controller';
import { AnalysisTaskRunEntity } from './entities/analysis-task-run.entity';
import { AnalysisTaskEntity } from './entities/analysis-task.entity';
import { AnalysisTaskMockRunnerService } from './services/analysis-task-mock-runner.service';
import { AnalysisTaskRunsService } from './services/analysis-task-runs.service';
import { AnalysisTasksService } from './services/analysis-tasks.service';
import { WorkflowRunnerService } from './workflow/runner.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AnalysisTaskEntity, AnalysisTaskRunEntity]),
  ],
  controllers: [AnalysisTasksController],
  providers: [
    AnalysisTasksService,
    AnalysisTaskRunsService,
    AnalysisTaskMockRunnerService,
    WorkflowRunnerService,
  ],
})
export class AnalysisTasksModule {}
