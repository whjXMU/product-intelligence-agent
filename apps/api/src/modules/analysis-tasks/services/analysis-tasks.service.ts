import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type {
  AnalysisTaskDto,
  AnalysisTaskListItemDto,
  CreateAnalysisTaskRequest,
} from '@product-intelligence-agent/shared';
import { Repository } from 'typeorm';
import { ErrorCodes } from '../../../common/errors/error-codes';
import {
  AnalysisTaskAlreadyRunningError,
  assertCanRunAnalysisTask,
} from '../domain/task-status';
import { AnalysisTaskEntity } from '../entities/analysis-task.entity';
import {
  toAnalysisTaskDto,
  toAnalysisTaskListItemDto,
} from '../mappers/analysis-task.mapper';
import {
  InputMappingError,
  toWorkflowInputV1,
} from '../mappers/workflow-input.mapper';
import { createFailedTrace } from '../workflow/trace.factory';
import { AnalysisTaskMockRunnerService } from './analysis-task-mock-runner.service';
import { WorkflowRunnerService } from '../workflow/runner.service';

@Injectable()
export class AnalysisTasksService {
  constructor(
    @InjectRepository(AnalysisTaskEntity)
    private readonly analysisTasksRepository: Repository<AnalysisTaskEntity>,
    private readonly mockRunner: AnalysisTaskMockRunnerService,
    private readonly workflowRunner: WorkflowRunnerService,
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

    assertCanRunAnalysisTaskForHttp(task);

    const runningTask = await this.markRunning(task);

    try {
      const { result, trace } = this.mockRunner.run(runningTask);

      return toAnalysisTaskDto(
        await this.markCompleted(runningTask, { result, trace }),
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown mock runner error';

      await this.markFailed(runningTask, { errorMessage });

      throw new InternalServerErrorException({
        code: ErrorCodes.ANALYSIS_TASK_RUN_FAILED,
        message: 'Failed to run mock analysis task',
        details: {
          taskId: runningTask.id,
          errorMessage,
        },
      });
    }
  }

  async runWorkflow(id: string): Promise<AnalysisTaskDto> {
    const task = await this.findEntityById(id);

    assertCanRunAnalysisTaskForHttp(task);

    const startedAt = new Date().toISOString();
    const runningTask = await this.markRunning(task, { clearOutput: true });

    try {
      const input = toWorkflowInputV1(runningTask);
      const { result, trace } = await this.workflowRunner.run({
        taskId: runningTask.id,
        input,
        startedAt,
        mode: 'deterministic',
      });

      return toAnalysisTaskDto(
        await this.markCompleted(runningTask, { result, trace }),
      );
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      const trace = createFailedTrace({
        taskId: runningTask.id,
        startedAt,
        workflowId: this.workflowRunner.id,
        workflowVersion: this.workflowRunner.version,
        mode: 'deterministic',
        errorCode: ErrorCodes.ANALYSIS_TASK_WORKFLOW_RUN_FAILED,
        errorMessage,
      });

      await this.markFailed(runningTask, { trace, errorMessage });

      if (error instanceof InputMappingError) {
        throw new BadRequestException({
          code: ErrorCodes.ANALYSIS_TASK_INPUT_INVALID,
          message: error.message,
          details: error.issues,
        });
      }

      throw new InternalServerErrorException({
        code: ErrorCodes.ANALYSIS_TASK_WORKFLOW_RUN_FAILED,
        message: 'Failed to run analysis task workflow',
        details: {
          taskId: runningTask.id,
          errorMessage,
        },
      });
    }
  }

  private async findEntityById(id: string): Promise<AnalysisTaskEntity> {
    const task = await this.analysisTasksRepository.findOne({ where: { id } });

    if (!task) {
      throw new NotFoundException({
        code: ErrorCodes.ANALYSIS_TASK_NOT_FOUND,
        message: `Analysis task ${id} not found`,
        details: { taskId: id },
      });
    }

    return task;
  }

  private async markRunning(
    task: AnalysisTaskEntity,
    options: { clearOutput?: boolean } = {},
  ): Promise<AnalysisTaskEntity> {
    return this.analysisTasksRepository.save({
      ...task,
      status: 'running',
      result: options.clearOutput ? null : task.result,
      trace: options.clearOutput ? null : task.trace,
      errorMessage: null,
    });
  }

  private async markCompleted(
    task: AnalysisTaskEntity,
    output: {
      result: NonNullable<AnalysisTaskEntity['result']>;
      trace: NonNullable<AnalysisTaskEntity['trace']>;
    },
  ): Promise<AnalysisTaskEntity> {
    return this.analysisTasksRepository.save({
      ...task,
      status: 'completed',
      result: output.result,
      trace: output.trace,
      errorMessage: null,
    });
  }

  private async markFailed(
    task: AnalysisTaskEntity,
    failure: {
      errorMessage: string;
      trace?: NonNullable<AnalysisTaskEntity['trace']>;
    },
  ): Promise<AnalysisTaskEntity> {
    return this.analysisTasksRepository.save({
      ...task,
      status: 'failed',
      trace: failure.trace ?? task.trace,
      errorMessage: failure.errorMessage,
    });
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Unknown workflow runner error';
}

function assertCanRunAnalysisTaskForHttp(task: AnalysisTaskEntity): void {
  try {
    assertCanRunAnalysisTask(task);
  } catch (error) {
    if (error instanceof AnalysisTaskAlreadyRunningError) {
      throw new ConflictException({
        code: ErrorCodes.ANALYSIS_TASK_ALREADY_RUNNING,
        message: error.message,
        details: {
          taskId: error.taskId,
        },
      });
    }

    throw error;
  }
}
