import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalysisTasksController } from './controllers/analysis-tasks.controller';
import { AnalysisTaskEntity } from './entities/analysis-task.entity';
import { AnalysisTasksService } from './services/analysis-tasks.service';

@Module({
  imports: [TypeOrmModule.forFeature([AnalysisTaskEntity])],
  controllers: [AnalysisTasksController],
  providers: [AnalysisTasksService],
})
export class AnalysisTasksModule {}
