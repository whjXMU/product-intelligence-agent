import type {
  AnalysisTaskDto,
  AnalysisTaskListItemDto,
  CreateAnalysisTaskRequest,
} from '@product-intelligence-agent/shared';
import { AnalysisTasksService } from '../services/analysis-tasks.service';
import { AnalysisTasksController } from './analysis-tasks.controller';

describe('AnalysisTasksController', () => {
  let controller: AnalysisTasksController;
  let service: jest.Mocked<
    Pick<
      AnalysisTasksService,
      'create' | 'findAll' | 'findOne' | 'runMock' | 'runWorkflow'
    >
  >;

  beforeEach(() => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      runMock: jest.fn(),
      runWorkflow: jest.fn(),
    };
    controller = new AnalysisTasksController(
      service as unknown as AnalysisTasksService,
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

  it('delegates run-workflow to the service', async () => {
    const dto = createTaskDto({
      status: 'completed',
      result: {
        schemaVersion: 'analysis_task_result.v1',
      },
      trace: {
        schemaVersion: 'agent_trace.v1',
      },
    });
    service.runWorkflow.mockResolvedValueOnce(dto);

    await expect(controller.runWorkflow(dto.id)).resolves.toBe(dto);

    expect(service.runWorkflow).toHaveBeenCalledWith(dto.id);
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
