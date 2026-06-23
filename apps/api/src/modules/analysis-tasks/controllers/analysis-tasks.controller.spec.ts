import type {
  AnalysisTaskDto,
  AnalysisTaskListItemDto,
  AnalysisTaskRunDto,
  CreateAnalysisTaskRequest,
} from '@product-intelligence-agent/shared';
import { AnalysisTaskRunsService } from '../services/analysis-task-runs.service';
import { AnalysisTasksService } from '../services/analysis-tasks.service';
import { AnalysisTasksController } from './analysis-tasks.controller';

describe('AnalysisTasksController', () => {
  let controller: AnalysisTasksController;
  let service: jest.Mocked<
    Pick<AnalysisTasksService, 'create' | 'findAll' | 'findOne' | 'runMock'>
  >;
  let runsService: jest.Mocked<
    Pick<AnalysisTaskRunsService, 'createAgentRun' | 'findRun'>
  >;

  beforeEach(() => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      runMock: jest.fn(),
    };
    runsService = {
      createAgentRun: jest.fn(),
      findRun: jest.fn(),
    };
    controller = new AnalysisTasksController(
      service as unknown as AnalysisTasksService,
      runsService as unknown as AnalysisTaskRunsService,
    );
  });

  it('delegates task creation to the service', async () => {
    const request: CreateAnalysisTaskRequest = {
      title: 'OpenAI 与 DeepSeek 首页竞品分析',
      productName: 'OpenAI',
      competitorName: 'DeepSeek',
      analysisGoal: '比较首页定位',
      sourceType: 'manual',
      input: {
        selfUrl: 'https://openai.com',
        competitorUrl: 'https://deepseek.com',
      },
    };
    const dto = createTaskDto();
    service.create.mockResolvedValueOnce(dto);

    await expect(controller.create(request)).resolves.toBe(dto);

    expect(service.create).toHaveBeenCalledWith(request);
  });

  it('delegates list and detail reads to the service', async () => {
    const listItem: AnalysisTaskListItemDto = {
      id: '7b6f5b61-060f-4b0a-8bed-9c0e3b1ce2dd',
      title: 'OpenAI 与 DeepSeek 首页竞品分析',
      productName: 'OpenAI',
      competitorName: 'DeepSeek',
      analysisGoal: '比较首页定位',
      sourceType: 'manual',
      status: 'created',
      errorMessage: null,
      createdAt: '2026-06-22T00:00:00.000Z',
      updatedAt: '2026-06-22T00:00:00.000Z',
    };
    const dto = createTaskDto();
    service.findAll.mockResolvedValueOnce([listItem]);
    service.findOne.mockResolvedValueOnce(dto);

    await expect(controller.findAll()).resolves.toEqual([listItem]);
    await expect(controller.findOne(dto.id)).resolves.toBe(dto);

    expect(service.findAll).toHaveBeenCalledWith();
    expect(service.findOne).toHaveBeenCalledWith(dto.id);
  });

  it('keeps run-mock as a compatible service entry', async () => {
    const dto = createTaskDto({ status: 'completed' });
    service.runMock.mockResolvedValueOnce(dto);

    await expect(controller.runMock(dto.id)).resolves.toBe(dto);

    expect(service.runMock).toHaveBeenCalledWith(dto.id);
  });

  it('delegates agent run creation and lookup to the run service', async () => {
    const dto = createTaskDto();
    const run = createRunDto({ taskId: dto.id });
    runsService.createAgentRun.mockResolvedValueOnce(run);
    runsService.findRun.mockResolvedValueOnce(run);

    await expect(controller.createRun(dto.id)).resolves.toBe(run);
    await expect(controller.findRun(dto.id, run.id)).resolves.toBe(run);

    expect(runsService.createAgentRun).toHaveBeenCalledWith(dto.id);
    expect(runsService.findRun).toHaveBeenCalledWith(dto.id, run.id);
  });
});

function createTaskDto(
  overrides: Partial<AnalysisTaskDto> = {},
): AnalysisTaskDto {
  return {
    id: '7b6f5b61-060f-4b0a-8bed-9c0e3b1ce2dd',
    title: 'OpenAI 与 DeepSeek 首页竞品分析',
    productName: 'OpenAI',
    competitorName: 'DeepSeek',
    analysisGoal: '比较首页定位',
    sourceType: 'manual',
    input: {
      selfUrl: 'https://openai.com',
      competitorUrl: 'https://deepseek.com',
    },
    status: 'created',
    result: null,
    trace: null,
    errorMessage: null,
    createdAt: '2026-06-22T00:00:00.000Z',
    updatedAt: '2026-06-22T00:00:00.000Z',
    ...overrides,
  };
}

function createRunDto(
  overrides: Partial<AnalysisTaskRunDto> = {},
): AnalysisTaskRunDto {
  return {
    id: '1b5d77b7-7ff2-4752-ae79-4dc697f646a2',
    taskId: '7b6f5b61-060f-4b0a-8bed-9c0e3b1ce2dd',
    workflowId: 'competitive_analysis.v1',
    workflowVersion: '2026-06-23.deterministic.v1',
    mode: 'deterministic',
    status: 'completed',
    result: null,
    trace: null,
    errorCode: null,
    errorMessage: null,
    startedAt: '2026-06-22T00:01:00.000Z',
    endedAt: '2026-06-22T00:02:00.000Z',
    createdAt: '2026-06-22T00:01:00.000Z',
    updatedAt: '2026-06-22T00:02:00.000Z',
    ...overrides,
  };
}
