import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type {
  AnalysisTaskRunDto,
  AnalysisTaskRunListItemDto,
} from '@product-intelligence-agent/shared';
import { DataSource, Repository } from 'typeorm';
import { ErrorCodes } from '../../../common/errors/error-codes';
import {
  AnalysisTaskAlreadyRunningError,
  assertCanRunAnalysisTask,
} from '../domain/task-status';
import { AnalysisTaskRunEntity } from '../entities/analysis-task-run.entity';
import { AnalysisTaskEntity } from '../entities/analysis-task.entity';
import {
  toAnalysisTaskRunDto,
  toAnalysisTaskRunListItemDto,
} from '../mappers/analysis-task-run.mapper';
import {
  InputMappingError,
  toWorkflowInputV1,
} from '../mappers/workflow-input.mapper';
import { createFailedTrace } from '../workflow/trace.factory';
import { WorkflowRunnerService } from '../workflow/runner.service';

@Injectable()
export class AnalysisTaskRunsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(AnalysisTaskEntity)
    private readonly analysisTasksRepository: Repository<AnalysisTaskEntity>,
    @InjectRepository(AnalysisTaskRunEntity)
    private readonly analysisTaskRunsRepository: Repository<AnalysisTaskRunEntity>,
    private readonly workflowRunner: WorkflowRunnerService,
  ) {}

  async createAgentRun(taskId: string): Promise<AnalysisTaskRunDto> {
    const startedAt = new Date().toISOString();
    const { runningTask, run } = await this.claimAgentRun(taskId, startedAt);

    try {
      // Agent 执行可能较慢，不能包在数据库事务里，避免长时间占用连接和锁。
      const input = toWorkflowInputV1(runningTask);
      const { result, trace } = await this.workflowRunner.run({
        taskId: runningTask.id,
        input,
        startedAt,
        mode: 'deterministic',
      });

      return toAnalysisTaskRunDto(
        await this.completeAgentRun(runningTask, run, { result, trace }),
      );
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      const errorCode =
        error instanceof InputMappingError
          ? ErrorCodes.ANALYSIS_TASK_INPUT_INVALID
          : ErrorCodes.ANALYSIS_TASK_WORKFLOW_RUN_FAILED;
      const trace = createFailedTrace({
        taskId: runningTask.id,
        startedAt,
        workflowId: this.workflowRunner.id,
        workflowVersion: this.workflowRunner.version,
        mode: 'deterministic',
        errorCode,
        errorMessage,
      });

      await this.failAgentRun(runningTask, run, {
        trace,
        errorCode,
        errorMessage,
      });

      if (error instanceof InputMappingError) {
        throw new BadRequestException({
          code: ErrorCodes.ANALYSIS_TASK_INPUT_INVALID,
          message: error.message,
          details: error.issues,
        });
      }

      throw new InternalServerErrorException({
        code: ErrorCodes.ANALYSIS_TASK_WORKFLOW_RUN_FAILED,
        message: 'Failed to run analysis agent',
        details: {
          taskId: runningTask.id,
          errorMessage,
        },
      });
    }
  }

  async findRun(taskId: string, runId: string): Promise<AnalysisTaskRunDto> {
    await this.findTaskById(taskId);

    const run = await this.analysisTaskRunsRepository.findOne({
      where: { id: runId, taskId },
    });

    if (!run) {
      throw new NotFoundException({
        code: ErrorCodes.CORE_NOT_FOUND,
        message: `Analysis task run ${runId} not found`,
        details: { taskId, runId },
      });
    }

    return toAnalysisTaskRunDto(run);
  }

  async listRuns(taskId: string): Promise<AnalysisTaskRunListItemDto[]> {
    await this.findTaskById(taskId);

    const runs = await this.analysisTaskRunsRepository.find({
      where: { taskId },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    return runs.map((run) => toAnalysisTaskRunListItemDto(run));
  }

  private async claimAgentRun(
    taskId: string,
    startedAt: string,
  ): Promise<{
    runningTask: AnalysisTaskEntity;
    run: AnalysisTaskRunEntity;
  }> {
    // 执行前只用短事务完成“锁定任务、标记 running、创建 run”，避免并发启动多次。
    return this.dataSource.transaction(async (manager) => {
      const taskRepository = manager.getRepository(AnalysisTaskEntity);
      const runRepository = manager.getRepository(AnalysisTaskRunEntity);
      const task = await taskRepository.findOne({
        where: { id: taskId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!task) {
        throw new NotFoundException({
          code: ErrorCodes.ANALYSIS_TASK_NOT_FOUND,
          message: `Analysis task ${taskId} not found`,
          details: { taskId },
        });
      }

      assertCanRunAnalysisTaskForHttp(task);

      const runningTask = await this.markTaskRunning(taskRepository, task);
      const run = await this.createRunningAgentRun(
        runRepository,
        runningTask,
        startedAt,
      );

      return { runningTask, run };
    });
  }

  private async completeAgentRun(
    runningTask: AnalysisTaskEntity,
    run: AnalysisTaskRunEntity,
    output: {
      result: NonNullable<AnalysisTaskRunEntity['result']>;
      trace: NonNullable<AnalysisTaskRunEntity['trace']>;
    },
  ): Promise<AnalysisTaskRunEntity> {
    // 成功路径把 task 最新状态和 run 历史一起写入，避免二者只更新一边。
    return this.dataSource.transaction(async (manager) => {
      const taskRepository = manager.getRepository(AnalysisTaskEntity);
      const runRepository = manager.getRepository(AnalysisTaskRunEntity);

      await this.markTaskCompleted(taskRepository, runningTask, output);

      return this.markRunCompleted(runRepository, run, output);
    });
  }

  private async failAgentRun(
    runningTask: AnalysisTaskEntity,
    run: AnalysisTaskRunEntity,
    failure: {
      trace: NonNullable<AnalysisTaskRunEntity['trace']>;
      errorCode: string;
      errorMessage: string;
    },
  ): Promise<AnalysisTaskRunEntity> {
    // 失败路径同样双写 task 和 run，保证界面状态与排障记录对应同一次失败。
    return this.dataSource.transaction(async (manager) => {
      const taskRepository = manager.getRepository(AnalysisTaskEntity);
      const runRepository = manager.getRepository(AnalysisTaskRunEntity);

      await this.markTaskFailed(taskRepository, runningTask, {
        trace: failure.trace,
        errorMessage: failure.errorMessage,
      });

      return this.markRunFailed(runRepository, run, failure);
    });
  }

  private async findTaskById(id: string): Promise<AnalysisTaskEntity> {
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

  private async markTaskRunning(
    taskRepository: Repository<AnalysisTaskEntity>,
    task: AnalysisTaskEntity,
  ): Promise<AnalysisTaskEntity> {
    return taskRepository.save({
      ...task,
      status: 'running',
      result: null,
      trace: null,
      errorMessage: null,
    });
  }

  private async markTaskCompleted(
    taskRepository: Repository<AnalysisTaskEntity>,
    task: AnalysisTaskEntity,
    output: {
      result: NonNullable<AnalysisTaskEntity['result']>;
      trace: NonNullable<AnalysisTaskEntity['trace']>;
    },
  ): Promise<AnalysisTaskEntity> {
    return taskRepository.save({
      ...task,
      status: 'completed',
      result: output.result,
      trace: output.trace,
      errorMessage: null,
    });
  }

  private async markTaskFailed(
    taskRepository: Repository<AnalysisTaskEntity>,
    task: AnalysisTaskEntity,
    failure: {
      errorMessage: string;
      trace: NonNullable<AnalysisTaskEntity['trace']>;
    },
  ): Promise<AnalysisTaskEntity> {
    return taskRepository.save({
      ...task,
      status: 'failed',
      trace: failure.trace,
      errorMessage: failure.errorMessage,
    });
  }

  private async createRunningAgentRun(
    runRepository: Repository<AnalysisTaskRunEntity>,
    task: AnalysisTaskEntity,
    startedAt: string,
  ): Promise<AnalysisTaskRunEntity> {
    return runRepository.save(
      runRepository.create({
        taskId: task.id,
        workflowId: this.workflowRunner.id,
        workflowVersion: this.workflowRunner.version,
        mode: 'deterministic',
        status: 'running',
        result: null,
        trace: null,
        errorCode: null,
        errorMessage: null,
        startedAt: new Date(startedAt),
        endedAt: null,
      }),
    );
  }

  private async markRunCompleted(
    runRepository: Repository<AnalysisTaskRunEntity>,
    run: AnalysisTaskRunEntity,
    output: {
      result: NonNullable<AnalysisTaskRunEntity['result']>;
      trace: NonNullable<AnalysisTaskRunEntity['trace']>;
    },
  ): Promise<AnalysisTaskRunEntity> {
    return runRepository.save({
      ...run,
      status: 'completed',
      result: output.result,
      trace: output.trace,
      errorCode: null,
      errorMessage: null,
      endedAt: new Date(),
    });
  }

  private async markRunFailed(
    runRepository: Repository<AnalysisTaskRunEntity>,
    run: AnalysisTaskRunEntity,
    failure: {
      trace: NonNullable<AnalysisTaskRunEntity['trace']>;
      errorCode: string;
      errorMessage: string;
    },
  ): Promise<AnalysisTaskRunEntity> {
    return runRepository.save({
      ...run,
      status: 'failed',
      trace: failure.trace,
      errorCode: failure.errorCode,
      errorMessage: failure.errorMessage,
      endedAt: new Date(),
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
