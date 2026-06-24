import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type {
  AddAnalysisSessionMessageRequest,
  AnalysisSessionDto,
  AnalysisSessionListItemDto,
  AnalysisTaskDto,
  AnalysisTaskListItemDto,
  CreateAnalysisSessionRequest,
  CreateAnalysisTaskRequest,
} from '@product-intelligence-agent/shared';
import request from 'supertest';
import { App } from 'supertest/types';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { AnalysisSessionsController } from '../src/modules/analysis-tasks/controllers/analysis-sessions.controller';
import { AnalysisTasksController } from '../src/modules/analysis-tasks/controllers/analysis-tasks.controller';
import { AnalysisSessionsService } from '../src/modules/analysis-tasks/services/analysis-sessions.service';
import { AnalysisTaskRunsService } from '../src/modules/analysis-tasks/services/analysis-task-runs.service';
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

const sessionId = '22222222-2222-4222-8222-222222222222';

const sessionDto: AnalysisSessionDto = {
  id: sessionId,
  title: '帮我分析 OpenAI 和 DeepSeek 首页',
  status: 'drafting',
  messages: [
    {
      id: 'message-1',
      role: 'user',
      content: '帮我分析 OpenAI 和 DeepSeek 首页',
      createdAt: '2026-06-24T00:00:00.000Z',
    },
  ],
  briefDraft: null,
  resultText: null,
  reportDraft: null,
  trace: null,
  errorMessage: null,
  createdAt: '2026-06-24T00:00:00.000Z',
  updatedAt: '2026-06-24T00:00:00.000Z',
};

const sessionListItemDto: AnalysisSessionListItemDto = {
  id: sessionDto.id,
  title: sessionDto.title,
  status: sessionDto.status,
  resultText: sessionDto.resultText,
  errorMessage: sessionDto.errorMessage,
  createdAt: sessionDto.createdAt,
  updatedAt: sessionDto.updatedAt,
};

function expectErrorCode(body: unknown, code: string): void {
  expect(typeof body).toBe('object');
  expect(body).not.toBeNull();

  const responseBody = body as {
    code?: unknown;
  };

  expect(responseBody.code).toBe(code);
}

interface MockAnalysisTasksService {
  create: jest.Mock<Promise<AnalysisTaskDto>, [CreateAnalysisTaskRequest]>;
  findAll: jest.Mock<Promise<AnalysisTaskListItemDto[]>, []>;
  findOne: jest.Mock<Promise<AnalysisTaskDto>, [string]>;
  runMock: jest.Mock<Promise<AnalysisTaskDto>, [string]>;
}

interface MockAnalysisTaskRunsService {
  createAgentRun: jest.Mock;
  listRuns: jest.Mock;
  findRun: jest.Mock;
}

interface MockAnalysisSessionsService {
  create: jest.Mock<Promise<AnalysisSessionDto>, [CreateAnalysisSessionRequest]>;
  findAll: jest.Mock<Promise<AnalysisSessionListItemDto[]>, []>;
  findOne: jest.Mock<Promise<AnalysisSessionDto>, [string]>;
  addMessage: jest.Mock<
    Promise<AnalysisSessionDto>,
    [string, AddAnalysisSessionMessageRequest]
  >;
  run: jest.Mock<Promise<AnalysisSessionDto>, [string]>;
}

describe('AnalysisTasksController (e2e)', () => {
  let app: INestApplication<App>;
  let analysisTasksService: MockAnalysisTasksService;
  let analysisTaskRunsService: MockAnalysisTaskRunsService;
  let analysisSessionsService: MockAnalysisSessionsService;

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
    analysisTaskRunsService = {
      createAgentRun: jest.fn(),
      listRuns: jest.fn(),
      findRun: jest.fn(),
    };
    analysisSessionsService = {
      create: jest.fn((request: CreateAnalysisSessionRequest) => {
        void request;
        return Promise.resolve(sessionDto);
      }),
      findAll: jest.fn(() => Promise.resolve([sessionListItemDto])),
      findOne: jest.fn((id: string) => {
        void id;
        return Promise.resolve(sessionDto);
      }),
      addMessage: jest.fn(
        (id: string, request: AddAnalysisSessionMessageRequest) => {
          void id;
          void request;
          return Promise.resolve({
            ...sessionDto,
            messages: [
              ...sessionDto.messages,
              {
                id: 'message-2',
                role: 'user',
                content: '重点看企业可信度',
                createdAt: '2026-06-24T00:01:00.000Z',
              },
            ],
          });
        },
      ),
      run: jest.fn((id: string) => {
        void id;
        return Promise.resolve({
          ...sessionDto,
          status: 'completed',
          resultText: 'Agent 联调入口已收到你的分析需求。',
          trace: [{ name: 'placeholder_agent_run', status: 'completed' }],
        });
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AnalysisTasksController, AnalysisSessionsController],
      providers: [
        {
          provide: AnalysisTasksService,
          useValue: analysisTasksService,
        },
        {
          provide: AnalysisTaskRunsService,
          useValue: analysisTaskRunsService,
        },
        {
          provide: AnalysisSessionsService,
          useValue: analysisSessionsService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
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

    expectErrorCode(body, 'core.validation_failed');
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

    expectErrorCode(body, 'core.validation_failed');
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

  it('creates an analysis session from a natural language prompt', async () => {
    await request(app.getHttpServer())
      .post('/analysis-sessions')
      .send({
        initialPrompt: ' 帮我分析 OpenAI 和 DeepSeek 首页 ',
      })
      .expect(201)
      .expect(sessionDto);

    expect(analysisSessionsService.create).toHaveBeenCalledWith({
      initialPrompt: '帮我分析 OpenAI 和 DeepSeek 首页',
    });
  });

  it('adds a message and runs an analysis session', async () => {
    await request(app.getHttpServer())
      .post(`/analysis-sessions/${sessionId}/messages`)
      .send({
        content: ' 重点看企业可信度 ',
      })
      .expect(201);

    expect(analysisSessionsService.addMessage).toHaveBeenCalledWith(sessionId, {
      content: '重点看企业可信度',
    });

    const response = await request(app.getHttpServer())
      .post(`/analysis-sessions/${sessionId}/run`)
      .expect(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        id: sessionId,
        status: 'completed',
      }),
    );
    expect(analysisSessionsService.run).toHaveBeenCalledWith(sessionId);
  });
});
