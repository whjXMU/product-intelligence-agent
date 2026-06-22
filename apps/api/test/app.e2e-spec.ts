import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type {
  AnalysisTaskDto,
  AnalysisTaskListItemDto,
  CreateAnalysisTaskRequest,
} from '@product-intelligence-agent/shared';
import request from 'supertest';
import { App } from 'supertest/types';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { AnalysisTasksController } from '../src/modules/analysis-tasks/controllers/analysis-tasks.controller';
import { AnalysisTasksService } from '../src/modules/analysis-tasks/services/analysis-tasks.service';

const taskId = '11111111-1111-4111-8111-111111111111';

const taskDto: AnalysisTaskDto = {
  id: taskId,
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
  createdAt: '2026-06-22T00:00:00.000Z',
  updatedAt: '2026-06-22T00:00:00.000Z',
};

const listItemDto: AnalysisTaskListItemDto = {
  id: taskDto.id,
  title: taskDto.title,
  productName: taskDto.productName,
  competitorName: taskDto.competitorName,
  analysisGoal: taskDto.analysisGoal,
  sourceType: taskDto.sourceType,
  status: taskDto.status,
  errorMessage: taskDto.errorMessage,
  createdAt: taskDto.createdAt,
  updatedAt: taskDto.updatedAt,
};

function expectErrorCode(body: unknown, code: string): void {
  expect(typeof body).toBe('object');
  expect(body).not.toBeNull();

  const responseBody = body as {
    success?: unknown;
    error?: {
      code?: unknown;
    };
  };

  expect(responseBody.success).toBe(false);
  expect(responseBody.error?.code).toBe(code);
}

interface MockAnalysisTasksService {
  create: jest.Mock<Promise<AnalysisTaskDto>, [CreateAnalysisTaskRequest]>;
  findAll: jest.Mock<Promise<AnalysisTaskListItemDto[]>, []>;
  findOne: jest.Mock<Promise<AnalysisTaskDto>, [string]>;
  runMock: jest.Mock<Promise<AnalysisTaskDto>, [string]>;
}

describe('AnalysisTasksController (e2e)', () => {
  let app: INestApplication<App>;
  let analysisTasksService: MockAnalysisTasksService;

  beforeEach(async () => {
    analysisTasksService = {
      create: jest.fn((request: CreateAnalysisTaskRequest) => {
        void request;
        return Promise.resolve(taskDto);
      }),
      findAll: jest.fn(() => Promise.resolve([listItemDto])),
      findOne: jest.fn((id: string) => {
        void id;
        return Promise.resolve(taskDto);
      }),
      runMock: jest.fn((id: string) => {
        void id;
        return Promise.resolve({
          ...taskDto,
          status: 'completed',
          result: {
            summary: 'mock report',
            positioningComparison: [],
            strengths: [],
            opportunities: [],
            recommendations: [],
            generatedAt: '2026-06-22T00:01:00.000Z',
          },
        });
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AnalysisTasksController],
      providers: [
        {
          provide: AnalysisTasksService,
          useValue: analysisTasksService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('creates an analysis task', async () => {
    await request(app.getHttpServer())
      .post('/analysis-tasks')
      .send({
        title: ' OpenAI 与 DeepSeek 首页竞品分析 ',
        productName: ' OpenAI ',
        competitorName: ' DeepSeek ',
        analysisGoal: ' 比较首页定位、核心卖点、用户转化路径 ',
        sourceType: 'manual',
        input: {
          selfUrl: 'https://openai.com',
          competitorUrl: 'https://deepseek.com',
        },
      })
      .expect(201)
      .expect(taskDto);

    expect(analysisTasksService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'OpenAI 与 DeepSeek 首页竞品分析',
        productName: 'OpenAI',
        competitorName: 'DeepSeek',
      }),
    );
  });

  it('rejects invalid create body', async () => {
    const response = await request(app.getHttpServer())
      .post('/analysis-tasks')
      .send({
        title: '',
        productName: 'OpenAI',
        competitorName: 'DeepSeek',
        analysisGoal: 'goal',
        sourceType: 'manual',
        input: {},
      })
      .expect(400);
    const body: unknown = response.body;

    expectErrorCode(body, 'VALIDATION_ERROR');
    expect(analysisTasksService.create).not.toHaveBeenCalled();
  });

  it('lists analysis tasks', async () => {
    await request(app.getHttpServer())
      .get('/analysis-tasks')
      .expect(200)
      .expect([listItemDto]);
  });

  it('rejects invalid task id', async () => {
    const response = await request(app.getHttpServer())
      .get('/analysis-tasks/not-a-uuid')
      .expect(400);
    const body: unknown = response.body;

    expectErrorCode(body, 'VALIDATION_ERROR');
    expect(analysisTasksService.findOne).not.toHaveBeenCalled();
  });

  it('runs mock analysis', async () => {
    const response = await request(app.getHttpServer())
      .post(`/analysis-tasks/${taskId}/run-mock`)
      .expect(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        id: taskId,
        status: 'completed',
      }),
    );

    expect(analysisTasksService.runMock).toHaveBeenCalledWith(taskId);
  });
});
