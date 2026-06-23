import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type {
  AgentTraceV1,
  AnalysisTaskInputV1,
  AnalysisTaskResultV1,
} from '@product-intelligence-agent/shared';
import { ErrorCodes } from '../../../common/errors/error-codes';
import { AnalysisTaskRunEntity } from '../entities/analysis-task-run.entity';
import { AnalysisTaskEntity } from '../entities/analysis-task.entity';
import { WorkflowRunnerService } from '../workflow/runner.service';
import { AnalysisTaskRunsService } from './analysis-task-runs.service';
import { DataSource } from 'typeorm';

interface MockAnalysisTaskRepository {
  save: jest.Mock<Promise<AnalysisTaskEntity>, [Partial<AnalysisTaskEntity>]>;
  findOne: jest.Mock<Promise<AnalysisTaskEntity | null>, [unknown?]>;
}

interface MockAnalysisTaskRunRepository {
  create: jest.Mock<AnalysisTaskRunEntity, [Partial<AnalysisTaskRunEntity>]>;
  save: jest.Mock<
    Promise<AnalysisTaskRunEntity>,
    [Partial<AnalysisTaskRunEntity>]
  >;
  findOne: jest.Mock<Promise<AnalysisTaskRunEntity | null>, [unknown?]>;
}

interface MockEntityManager {
  getRepository: jest.Mock<
    MockAnalysisTaskRepository | MockAnalysisTaskRunRepository,
    [typeof AnalysisTaskEntity | typeof AnalysisTaskRunEntity]
  >;
}

interface MockDataSource {
  transaction: jest.Mock<
    Promise<unknown>,
    [(manager: MockEntityManager) => Promise<unknown>]
  >;
}

const baseTask = (
  overrides: Partial<AnalysisTaskEntity> = {},
): AnalysisTaskEntity => ({
  id: 'task-1',
  title: 'OpenAI 与 DeepSeek 首页竞品分析',
  productName: 'OpenAI',
  competitorName: 'DeepSeek',
  analysisGoal: '比较首页定位、核心卖点、用户转化路径',
  sourceType: 'manual',
  input: {
    selfUrl: 'https://openai.com',
    competitorUrl: 'https://deepseek.com',
  },
  status: 'created',
  result: null,
  trace: null,
  errorMessage: null,
  createdAt: new Date('2026-06-22T00:00:00.000Z'),
  updatedAt: new Date('2026-06-22T00:00:00.000Z'),
  ...overrides,
});

const baseRun = (
  overrides: Partial<AnalysisTaskRunEntity> = {},
): AnalysisTaskRunEntity => ({
  id: 'run-1',
  taskId: 'task-1',
  workflowId: 'competitive_analysis.v1',
  workflowVersion: '2026-06-23.deterministic.v1',
  mode: 'deterministic',
  status: 'running',
  result: null,
  trace: null,
  errorCode: null,
  errorMessage: null,
  startedAt: new Date('2026-06-22T00:01:00.000Z'),
  endedAt: null,
  createdAt: new Date('2026-06-22T00:01:00.000Z'),
  updatedAt: new Date('2026-06-22T00:01:00.000Z'),
  ...overrides,
});

describe('AnalysisTaskRunsService', () => {
  let service: AnalysisTaskRunsService;
  let dataSource: jest.Mocked<MockDataSource>;
  let transactionManager: MockEntityManager;
  let taskRepository: jest.Mocked<MockAnalysisTaskRepository>;
  let runRepository: jest.Mocked<MockAnalysisTaskRunRepository>;
  let workflowRunner: jest.Mocked<
    Pick<WorkflowRunnerService, 'id' | 'run' | 'version'>
  >;

  beforeEach(async () => {
    taskRepository = {
      save: jest.fn((task: Partial<AnalysisTaskEntity>) =>
        Promise.resolve(
          baseTask({
            ...task,
            updatedAt: new Date('2026-06-22T00:01:00.000Z'),
          }),
        ),
      ),
      findOne: jest.fn(() => Promise.resolve(baseTask())),
    };
    runRepository = {
      create: jest.fn((run: Partial<AnalysisTaskRunEntity>) => baseRun(run)),
      save: jest.fn((run: Partial<AnalysisTaskRunEntity>) =>
        Promise.resolve(
          baseRun({
            ...run,
            updatedAt: new Date('2026-06-22T00:03:00.000Z'),
          }),
        ),
      ),
      findOne: jest.fn(() => Promise.resolve(baseRun())),
    };
    transactionManager = {
      getRepository: jest.fn((entity) => {
        if (entity === AnalysisTaskEntity) {
          return taskRepository;
        }

        return runRepository;
      }),
    };
    dataSource = {
      transaction: jest.fn((work) => work(transactionManager)),
    };
    workflowRunner = {
      id: 'competitive_analysis.v1',
      version: '2026-06-23.deterministic.v1',
      run: jest.fn(({ taskId, input, startedAt }) =>
        Promise.resolve(createWorkflowRunOutput(taskId, input, startedAt)),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalysisTaskRunsService,
        {
          provide: DataSource,
          useValue: dataSource,
        },
        {
          provide: WorkflowRunnerService,
          useValue: workflowRunner,
        },
        {
          provide: getRepositoryToken(AnalysisTaskEntity),
          useValue: taskRepository,
        },
        {
          provide: getRepositoryToken(AnalysisTaskRunEntity),
          useValue: runRepository,
        },
      ],
    }).compile();

    service = module.get(AnalysisTaskRunsService);
  });

  it('creates an agent run and persists task result and trace', async () => {
    const run = await service.createAgentRun('task-1');

    expect(dataSource.transaction).toHaveBeenCalledTimes(2);
    expect(taskRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'task-1' },
      lock: { mode: 'pessimistic_write' },
    });
    const workflowRunInput = workflowRunner.run.mock.calls[0]?.[0];
    expect(workflowRunInput).toMatchObject({
      taskId: 'task-1',
      mode: 'deterministic',
    });
    expect(workflowRunInput?.input).toMatchObject({
      schemaVersion: 'analysis_task_input.v1',
      subject: {
        productName: 'OpenAI',
        competitorNames: ['DeepSeek'],
      },
    });
    expect(taskRepository.save).toHaveBeenCalledTimes(2);
    expect(runRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: 'task-1',
        workflowId: 'competitive_analysis.v1',
        workflowVersion: '2026-06-23.deterministic.v1',
        mode: 'deterministic',
        status: 'running',
      }),
    );
    expect(runRepository.save).toHaveBeenCalledTimes(2);

    const runningTask = taskRepository.save.mock.calls[0]?.[0];
    const completedTask = taskRepository.save.mock.calls[1]?.[0];
    const completedRun = runRepository.save.mock.calls[1]?.[0];

    expect(runningTask).toMatchObject({
      status: 'running',
      result: null,
      trace: null,
      errorMessage: null,
    });
    expect(completedTask).toMatchObject({
      status: 'completed',
      errorMessage: null,
      result: {
        schemaVersion: 'analysis_task_result.v1',
      },
      trace: {
        schemaVersion: 'agent_trace.v1',
        mode: 'deterministic',
        status: 'completed',
      },
    });
    expect(completedRun).toMatchObject({
      status: 'completed',
      errorCode: null,
      errorMessage: null,
      result: {
        schemaVersion: 'analysis_task_result.v1',
      },
      trace: {
        schemaVersion: 'agent_trace.v1',
      },
    });
    expect(run.status).toBe('completed');
  });

  it('rejects agent runs when a task is already running', async () => {
    taskRepository.findOne.mockResolvedValueOnce(
      baseTask({ status: 'running' }),
    );

    await expect(service.createAgentRun('task-1')).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(workflowRunner.run).not.toHaveBeenCalled();
    expect(taskRepository.save).not.toHaveBeenCalled();
    expect(runRepository.save).not.toHaveBeenCalled();
  });

  it('marks task and run as failed when workflow input cannot be mapped', async () => {
    taskRepository.findOne.mockResolvedValueOnce(
      baseTask({
        input: {
          selfUrl: 'not-a-valid-url',
          competitorUrl: 'https://deepseek.com',
        },
      }),
    );

    await expect(service.createAgentRun('task-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(workflowRunner.run).not.toHaveBeenCalled();
    expect(dataSource.transaction).toHaveBeenCalledTimes(2);
    expect(taskRepository.save).toHaveBeenCalledTimes(2);
    expect(runRepository.save).toHaveBeenCalledTimes(2);

    const failedTask = taskRepository.save.mock.calls[1]?.[0];
    const failedRun = runRepository.save.mock.calls[1]?.[0];
    expect(failedTask).toMatchObject({
      status: 'failed',
      trace: {
        schemaVersion: 'agent_trace.v1',
        mode: 'deterministic',
        status: 'failed',
      },
    });
    expect(failedRun).toMatchObject({
      status: 'failed',
      errorCode: ErrorCodes.ANALYSIS_TASK_INPUT_INVALID,
      trace: {
        schemaVersion: 'agent_trace.v1',
        mode: 'deterministic',
        status: 'failed',
      },
    });
    expect(typeof failedRun?.errorMessage).toBe('string');
  });

  it('marks task and run as failed when deterministic workflow runner throws', async () => {
    workflowRunner.run.mockRejectedValueOnce(new Error('workflow failed'));

    await expect(service.createAgentRun('task-1')).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );

    expect(taskRepository.save).toHaveBeenCalledTimes(2);
    expect(dataSource.transaction).toHaveBeenCalledTimes(2);
    expect(runRepository.save).toHaveBeenCalledTimes(2);

    const failedTask = taskRepository.save.mock.calls[1]?.[0];
    const failedRun = runRepository.save.mock.calls[1]?.[0];
    expect(failedTask).toMatchObject({
      status: 'failed',
      errorMessage: 'workflow failed',
      trace: {
        schemaVersion: 'agent_trace.v1',
        mode: 'deterministic',
        status: 'failed',
        error: {
          code: ErrorCodes.ANALYSIS_TASK_WORKFLOW_RUN_FAILED,
          message: 'workflow failed',
        },
      },
    });
    expect(failedRun).toMatchObject({
      status: 'failed',
      errorCode: ErrorCodes.ANALYSIS_TASK_WORKFLOW_RUN_FAILED,
      errorMessage: 'workflow failed',
    });
  });

  it('returns a run by task and run id', async () => {
    const run = await service.findRun('task-1', 'run-1');

    expect(taskRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'task-1' },
    });
    expect(runRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'run-1', taskId: 'task-1' },
    });
    expect(run).toMatchObject({
      id: 'run-1',
      taskId: 'task-1',
      status: 'running',
    });
  });

  it('throws when a task cannot be found', async () => {
    taskRepository.findOne.mockResolvedValueOnce(null);

    await expect(service.createAgentRun('missing-task')).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
  });
});

function createWorkflowRunOutput(
  taskId: string,
  input: AnalysisTaskInputV1,
  startedAt: string,
): {
  result: AnalysisTaskResultV1;
  trace: AgentTraceV1;
} {
  const generatedAt = '2026-06-22T00:02:00.000Z';
  const runId = `competitive_analysis_${taskId}_${Date.parse(startedAt)}`;

  return {
    result: {
      schemaVersion: 'analysis_task_result.v1',
      generatedAt,
      workflow: {
        workflowId: 'competitive_analysis.v1',
        workflowVersion: '2026-06-23.deterministic.v1',
        runId,
      },
      executiveSummary: {
        oneLine: `${input.subject.productName} workflow result`,
        keyFindings: ['确定性 workflow 已生成分析结果。'],
        confidence: 'medium',
      },
      comparisonDimensions: [
        {
          id: 'positioning',
          name: '定位表达',
          selfAssessment: '自有产品定位评估。',
          competitorAssessment: '竞品定位评估。',
          gap: '定位表达存在差距。',
          evidenceRefs: [],
        },
      ],
      opportunities: [
        {
          id: 'opportunity',
          title: '优化机会',
          rationale: '基于任务输入生成机会点。',
          impact: 'medium',
          effort: 'low',
          evidenceRefs: [],
        },
      ],
      recommendations: [
        {
          id: 'recommendation',
          title: '需求建议',
          description: '基于任务输入生成需求建议。',
          priority: 'p1',
          evidenceRefs: [],
        },
      ],
      quality: {
        passed: true,
        score: 0.86,
        checks: [
          {
            name: 'schema',
            passed: true,
            message: '结果符合 V1 schema。',
          },
        ],
      },
    },
    trace: {
      schemaVersion: 'agent_trace.v1',
      runId,
      taskId,
      workflowId: 'competitive_analysis.v1',
      workflowVersion: '2026-06-23.deterministic.v1',
      mode: 'deterministic',
      status: 'completed',
      startedAt,
      endedAt: generatedAt,
      steps: [
        {
          stepId: 'input_normalization',
          name: 'Normalize input',
          kind: 'input_normalization',
          status: 'completed',
          startedAt,
          endedAt: generatedAt,
          summary: '输入已标准化。',
        },
      ],
      modelCalls: [],
      toolCalls: [],
      guardrails: [],
      artifacts: [],
    },
  };
}
