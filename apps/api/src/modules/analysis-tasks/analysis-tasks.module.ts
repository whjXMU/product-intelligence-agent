import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalysisTasksController } from './controllers/analysis-tasks.controller';
import { AnalysisTaskEntity } from './entities/analysis-task.entity';
import { AnalysisTaskMockRunnerService } from './services/analysis-task-mock-runner.service';
import { AnalysisTasksService } from './services/analysis-tasks.service';

@Module({
  imports: [TypeOrmModule.forFeature([AnalysisTaskEntity])],
  controllers: [AnalysisTasksController],
  providers: [AnalysisTasksService, AnalysisTaskMockRunnerService],
})
export class AnalysisTasksModule {}
