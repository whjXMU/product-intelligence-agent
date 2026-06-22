import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalysisTaskEntity } from './analysis-task.entity';
import { AnalysisTasksController } from './analysis-tasks.controller';
import { AnalysisTasksService } from './analysis-tasks.service';

@Module({
  imports: [TypeOrmModule.forFeature([AnalysisTaskEntity])],
  controllers: [AnalysisTasksController],
  providers: [AnalysisTasksService],
})
export class AnalysisTasksModule {}
