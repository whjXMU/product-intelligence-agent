import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AnalysisTaskEntity } from '../entities/analysis-task.entity';
import { AnalysisTaskMockRunnerService } from './analysis-task-mock-runner.service';
import { AnalysisTasksService } from './analysis-tasks.service';

interface MockAnalysisTaskRepository {
  create: jest.Mock<AnalysisTaskEntity, [Partial<AnalysisTaskEntity>]>;
  save: jest.Mock<Promise<AnalysisTaskEntity>, [Partial<AnalysisTaskEntity>]>;
  find: jest.Mock<Promise<AnalysisTaskEntity[]>, [unknown?]>;
  findOne: jest.Mock<Promise<AnalysisTaskEntity | null>, [unknown?]>;
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

describe('AnalysisTasksService', () => {
  let service: AnalysisTasksService;
  let repository: jest.Mocked<MockAnalysisTaskRepository>;
  let mockRunner: jest.Mocked<Pick<AnalysisTaskMockRunnerService, 'run'>>;

  beforeEach(async () => {
    repository = {
      create: jest.fn((task: Partial<AnalysisTaskEntity>) => baseTask(task)),
      save: jest.fn((task: Partial<AnalysisTaskEntity>) =>
        Promise.resolve(
          baseTask({
            ...task,
            updatedAt: new Date('2026-06-22T00:01:00.000Z'),
          }),
        ),
      ),
      find: jest.fn(() => Promise.resolve([baseTask()])),
      findOne: jest.fn(() => Promise.resolve(baseTask())),
    };
    mockRunner = {
      run: jest.fn((task: AnalysisTaskEntity) => ({
        result: {
          summary: `${task.productName} 与 ${task.competitorName} 的 mock 竞品分析已生成。`,
          positioningComparison: [],
          strengths: [],
          opportunities: [],
          recommendations: [],
          generatedAt: '2026-06-22T00:02:00.000Z',
        },
        trace: {
          mode: 'mock',
          steps: [
            {
              name: 'generate_mock_report',
              status: 'completed',
              message: '生成 mock 分析报告和建议。',
              timestamp: '2026-06-22T00:02:00.000Z',
            },
          ],
        },
      })),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalysisTasksService,
        {
          provide: AnalysisTaskMockRunnerService,
          useValue: mockRunner,
        },
        {
          provide: getRepositoryToken(AnalysisTaskEntity),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get(AnalysisTasksService);
  });

  it('creates an analysis task with created status', async () => {
    const task = await service.create({
      title: 'OpenAI 与 DeepSeek 首页竞品分析',
      productName: 'OpenAI',
      competitorName: 'DeepSeek',
      analysisGoal: '比较首页定位、核心卖点、用户转化路径',
      sourceType: 'manual',
      input: {
        notes: '当前阶段只保存输入，不抓取网页。',
      },
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'OpenAI 与 DeepSeek 首页竞品分析',
        productName: 'OpenAI',
        competitorName: 'DeepSeek',
        status: 'created',
        result: null,
        trace: null,
      }),
    );
    expect(task.status).toBe('created');
    expect(task.createdAt).toBe('2026-06-22T00:00:00.000Z');
  });

  it('returns list items without input, result or trace payloads', async () => {
    const tasks = await service.findAll();

    expect(repository.find).toHaveBeenCalledWith({
      order: { createdAt: 'DESC' },
    });
    expect(tasks).toEqual([
      expect.objectContaining({
        id: 'task-1',
        title: 'OpenAI 与 DeepSeek 首页竞品分析',
        status: 'created',
      }),
    ]);
    expect(tasks[0]).not.toHaveProperty('input');
    expect(tasks[0]).not.toHaveProperty('result');
    expect(tasks[0]).not.toHaveProperty('trace');
  });

  it('generates and persists a mock result', async () => {
    const task = await service.runMock('task-1');

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { id: 'task-1' },
    });
    expect(mockRunner.run).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'task-1',
        status: 'running',
      }),
    );
    expect(repository.save).toHaveBeenCalledTimes(2);

    const firstSavedTask = repository.save.mock.calls[0]?.[0];
    const secondSavedTask = repository.save.mock.calls[1]?.[0];

    expect(firstSavedTask).toMatchObject({
      status: 'running',
      errorMessage: null,
    });
    expect(secondSavedTask).toMatchObject({
      status: 'completed',
    });
    expect(JSON.stringify(secondSavedTask?.result)).toContain(
      'OpenAI 与 DeepSeek',
    );
    expect(secondSavedTask?.trace).toMatchObject({ mode: 'mock' });
    expect(task.status).toBe('completed');
    expect(task.result).not.toBeNull();
    expect(typeof task.result?.generatedAt).toBe('string');
  });

  it('rejects mock runs when a task is already running', async () => {
    repository.findOne.mockResolvedValueOnce(baseTask({ status: 'running' }));

    await expect(service.runMock('task-1')).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(mockRunner.run).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('marks the task as failed when mock runner throws', async () => {
    mockRunner.run.mockImplementationOnce(() => {
      throw new Error('mock runner failed');
    });

    await expect(service.runMock('task-1')).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );

    expect(repository.save).toHaveBeenCalledTimes(2);

    const failedTask = repository.save.mock.calls[1]?.[0];
    expect(failedTask).toMatchObject({
      status: 'failed',
      errorMessage: 'mock runner failed',
    });
  });

  it('throws when a task cannot be found', async () => {
    repository.findOne.mockResolvedValueOnce(null);

    await expect(service.findOne('missing-task')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
