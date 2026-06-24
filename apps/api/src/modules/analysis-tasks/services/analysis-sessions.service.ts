import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type {
  AddAnalysisSessionMessageRequest,
  AnalysisSessionDto,
  AnalysisSessionListItemDto,
  AnalysisSessionMessage,
  CreateAnalysisSessionRequest,
} from '@product-intelligence-agent/shared';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { ErrorCodes } from '../../../common/errors/error-codes';
import { AnalysisSessionEntity } from '../entities/analysis-session.entity';
import {
  toAnalysisSessionDto,
  toAnalysisSessionListItemDto,
} from '../mappers/analysis-session.mapper';

@Injectable()
export class AnalysisSessionsService {
  constructor(
    @InjectRepository(AnalysisSessionEntity)
    private readonly analysisSessionsRepository: Repository<AnalysisSessionEntity>,
  ) {}

  async create(
    request: CreateAnalysisSessionRequest,
  ): Promise<AnalysisSessionDto> {
    const now = new Date().toISOString();
    const message = createSessionMessage('user', request.initialPrompt, now);
    const entity = this.analysisSessionsRepository.create({
      title: createSessionTitle(request.initialPrompt),
      status: 'drafting',
      messages: [message],
      briefDraft: null,
      resultText: null,
      reportDraft: null,
      trace: null,
      errorMessage: null,
    });

    return toAnalysisSessionDto(
      await this.analysisSessionsRepository.save(entity),
    );
  }

  async findAll(): Promise<AnalysisSessionListItemDto[]> {
    const sessions = await this.analysisSessionsRepository.find({
      order: { createdAt: 'DESC' },
    });

    return sessions.map((session) => toAnalysisSessionListItemDto(session));
  }

  async findOne(id: string): Promise<AnalysisSessionDto> {
    return toAnalysisSessionDto(await this.findEntityById(id));
  }

  async addMessage(
    id: string,
    request: AddAnalysisSessionMessageRequest,
  ): Promise<AnalysisSessionDto> {
    const session = await this.findEntityById(id);

    if (session.status === 'running') {
      throw new ConflictException({
        code: ErrorCodes.ANALYSIS_SESSION_ALREADY_RUNNING,
        message: `Analysis session ${id} is already running`,
        details: { sessionId: id },
      });
    }

    const message = createSessionMessage(
      'user',
      request.content,
      new Date().toISOString(),
    );

    return toAnalysisSessionDto(
      await this.analysisSessionsRepository.save({
        ...session,
        status: 'drafting',
        messages: [...session.messages, message],
        errorMessage: null,
      }),
    );
  }

  async run(id: string): Promise<AnalysisSessionDto> {
    const session = await this.findEntityById(id);

    if (session.status === 'running') {
      throw new ConflictException({
        code: ErrorCodes.ANALYSIS_SESSION_ALREADY_RUNNING,
        message: `Analysis session ${id} is already running`,
        details: { sessionId: id },
      });
    }

    const startedAt = new Date().toISOString();
    const runningSession = await this.analysisSessionsRepository.save({
      ...session,
      status: 'running',
      errorMessage: null,
    });

    const latestUserMessage = [...runningSession.messages]
      .reverse()
      .find((message) => message.role === 'user');
    const resultText = createPlaceholderResultText(
      latestUserMessage?.content ?? runningSession.title,
    );
    const endedAt = new Date().toISOString();
    const assistantMessage = createSessionMessage('assistant', resultText, endedAt);

    return toAnalysisSessionDto(
      await this.analysisSessionsRepository.save({
        ...runningSession,
        status: 'completed',
        messages: [...runningSession.messages, assistantMessage],
        resultText,
        trace: [
          {
            name: 'placeholder_agent_run',
            status: 'completed',
            startedAt,
            endedAt,
            message: 'Agent 尚未接入，当前返回确定性占位结果用于联调。',
          },
        ],
        errorMessage: null,
      }),
    );
  }

  private async findEntityById(id: string): Promise<AnalysisSessionEntity> {
    const session = await this.analysisSessionsRepository.findOne({
      where: { id },
    });

    if (!session) {
      throw new NotFoundException({
        code: ErrorCodes.ANALYSIS_SESSION_NOT_FOUND,
        message: `Analysis session ${id} not found`,
        details: { sessionId: id },
      });
    }

    return session;
  }
}

function createSessionMessage(
  role: AnalysisSessionMessage['role'],
  content: string,
  createdAt: string,
): AnalysisSessionMessage {
  return {
    id: randomUUID(),
    role,
    content,
    createdAt,
  };
}

function createSessionTitle(prompt: string): string {
  const normalized = prompt.replace(/\s+/g, ' ').trim();

  if (normalized.length <= 40) {
    return normalized;
  }

  return `${normalized.slice(0, 40)}...`;
}

function createPlaceholderResultText(prompt: string): string {
  return [
    'Agent 联调入口已收到你的分析需求。',
    '',
    `原始输入：${prompt}`,
    '',
    '当前阶段尚未接入真实 Agent。下一步会基于该 Session 接入需求澄清、Brief 生成和分析执行流程。',
  ].join('\n');
}
