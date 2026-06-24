import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AnalysisSessionEntity } from '../entities/analysis-session.entity';
import { AnalysisSessionsService } from './analysis-sessions.service';

interface MockAnalysisSessionRepository {
  create: jest.Mock<AnalysisSessionEntity, [Partial<AnalysisSessionEntity>]>;
  save: jest.Mock<Promise<AnalysisSessionEntity>, [Partial<AnalysisSessionEntity>]>;
  find: jest.Mock<Promise<AnalysisSessionEntity[]>, [unknown?]>;
  findOne: jest.Mock<Promise<AnalysisSessionEntity | null>, [unknown?]>;
  delete: jest.Mock<Promise<unknown>, [unknown]>;
}

const baseSession = (
  overrides: Partial<AnalysisSessionEntity> = {},
): AnalysisSessionEntity => ({
  id: 'session-1',
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
  createdAt: new Date('2026-06-24T00:00:00.000Z'),
  updatedAt: new Date('2026-06-24T00:00:00.000Z'),
  ...overrides,
});

describe('AnalysisSessionsService', () => {
  let service: AnalysisSessionsService;
  let repository: jest.Mocked<MockAnalysisSessionRepository>;

  beforeEach(async () => {
    repository = {
      create: jest.fn((session: Partial<AnalysisSessionEntity>) =>
        baseSession(session),
      ),
      save: jest.fn((session: Partial<AnalysisSessionEntity>) =>
        Promise.resolve(
          baseSession({
            ...session,
            updatedAt: new Date('2026-06-24T00:01:00.000Z'),
          }),
        ),
      ),
      find: jest.fn(() => Promise.resolve([baseSession()])),
      findOne: jest.fn(() => Promise.resolve(baseSession())),
      delete: jest.fn((criteria: unknown) => {
        void criteria;
        return Promise.resolve({ affected: 1 });
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalysisSessionsService,
        {
          provide: getRepositoryToken(AnalysisSessionEntity),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get(AnalysisSessionsService);
  });

  it('creates a drafting session from an initial prompt', async () => {
    const session = await service.create({
      initialPrompt: '帮我分析 OpenAI 和 DeepSeek 首页',
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '帮我分析 OpenAI 和 DeepSeek 首页',
        status: 'drafting',
        resultText: null,
      }),
    );
    expect(session.status).toBe('drafting');
    expect(session.messages).toEqual([
      expect.objectContaining({
        role: 'user',
        content: '帮我分析 OpenAI 和 DeepSeek 首页',
      }),
    ]);
  });

  it('adds a user message while the session is not running', async () => {
    const session = await service.addMessage('session-1', {
      content: '重点看企业可信度',
    });

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'drafting',
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: '重点看企业可信度',
          }),
        ]),
      }),
    );
    expect(session.messages).toHaveLength(2);
  });

  it('runs a placeholder agent session and records trace', async () => {
    const session = await service.run('session-1');

    expect(repository.save).toHaveBeenCalledTimes(2);
    expect(repository.save.mock.calls[0]?.[0]).toMatchObject({
      status: 'running',
      errorMessage: null,
    });
    expect(repository.save.mock.calls[1]?.[0]).toMatchObject({
      status: 'completed',
      resultText: expect.stringContaining('Agent 联调入口已收到'),
      trace: [
        expect.objectContaining({
          name: 'placeholder_agent_run',
          status: 'completed',
        }),
      ],
    });
    expect(session.status).toBe('completed');
  });

  it('rejects messages while running', async () => {
    repository.findOne.mockResolvedValueOnce(
      baseSession({ status: 'running' }),
    );

    await expect(
      service.addMessage('session-1', { content: '继续分析' }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(repository.save).not.toHaveBeenCalled();
  });

  it('throws when a session cannot be found', async () => {
    repository.findOne.mockResolvedValueOnce(null);

    await expect(service.findOne('missing-session')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('deletes an existing session', async () => {
    await expect(service.remove('session-1')).resolves.toBeUndefined();

    expect(repository.delete).toHaveBeenCalledWith({ id: 'session-1' });
  });
});
