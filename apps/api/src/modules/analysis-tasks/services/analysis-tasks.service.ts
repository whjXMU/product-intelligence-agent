import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type {
  AnalysisTaskDto,
  AnalysisTaskListItemDto,
  CreateAnalysisTaskRequest,
} from '@product-intelligence-agent/shared';
import { Repository } from 'typeorm';
import { AnalysisTaskEntity } from '../entities/analysis-task.entity';
import {
  toAnalysisTaskDto,
  toAnalysisTaskListItemDto,
} from '../mappers/analysis-task.mapper';
import { AnalysisTaskMockRunnerService } from './analysis-task-mock-runner.service';

@Injectable()
export class AnalysisTasksService {
  constructor(
    @InjectRepository(AnalysisTaskEntity)
    private readonly analysisTasksRepository: Repository<AnalysisTaskEntity>,
    private readonly mockRunner: AnalysisTaskMockRunnerService,
  ) {}

  async create(request: CreateAnalysisTaskRequest): Promise<AnalysisTaskDto> {
    const entity = this.analysisTasksRepository.create({
      title: request.title,
      productName: request.productName,
      competitorName: request.competitorName,
      analysisGoal: request.analysisGoal,
      sourceType: request.sourceType,
      input: request.input,
      status: 'created',
      result: null,
      trace: null,
      errorMessage: null,
    });

    return toAnalysisTaskDto(await this.analysisTasksRepository.save(entity));
  }

  async findAll(): Promise<AnalysisTaskListItemDto[]> {
    const tasks = await this.analysisTasksRepository.find({
      order: { createdAt: 'DESC' },
    });

    return tasks.map((task) => toAnalysisTaskListItemDto(task));
  }

  async findOne(id: string): Promise<AnalysisTaskDto> {
    return toAnalysisTaskDto(await this.findEntityById(id));
  }

  async runMock(id: string): Promise<AnalysisTaskDto> {
    const task = await this.findEntityById(id);

    const runningTask = await this.analysisTasksRepository.save({
      ...task,
      status: 'running',
      errorMessage: null,
    });

    const { result, trace } = this.mockRunner.run(runningTask);

    return toAnalysisTaskDto(
      await this.analysisTasksRepository.save({
        ...runningTask,
        status: 'completed',
        result,
        trace,
      }),
    );
  }

  private async findEntityById(id: string): Promise<AnalysisTaskEntity> {
    const task = await this.analysisTasksRepository.findOne({ where: { id } });

    if (!task) {
      throw new NotFoundException(`Analysis task ${id} not found`);
    }

    return task;
  }
}
