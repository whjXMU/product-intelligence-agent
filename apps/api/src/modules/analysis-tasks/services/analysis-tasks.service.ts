import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
    this.validateCreateRequest(request);

    const entity = this.analysisTasksRepository.create({
      title: request.title.trim(),
      productName: request.productName.trim(),
      competitorName: request.competitorName.trim(),
      analysisGoal: request.analysisGoal.trim(),
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

  private validateCreateRequest(request: CreateAnalysisTaskRequest): void {
    const requiredTextFields: Array<keyof CreateAnalysisTaskRequest> = [
      'title',
      'productName',
      'competitorName',
      'analysisGoal',
    ];

    for (const field of requiredTextFields) {
      const value = request[field];
      if (typeof value !== 'string' || value.trim().length === 0) {
        throw new BadRequestException(`${field} is required`);
      }
    }

    if (request.sourceType !== 'manual') {
      throw new BadRequestException('sourceType must be manual');
    }

    if (
      !request.input ||
      typeof request.input !== 'object' ||
      Array.isArray(request.input)
    ) {
      throw new BadRequestException('input must be an object');
    }
  }
}
