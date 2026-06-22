import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type {
  AnalysisTaskDto,
  AnalysisTaskListItemDto,
  AnalysisTaskMockResult,
  AnalysisTaskTrace,
  CreateAnalysisTaskRequest,
} from '@product-intelligence-agent/shared';
import { Repository } from 'typeorm';
import { AnalysisTaskEntity } from './analysis-task.entity';

@Injectable()
export class AnalysisTasksService {
  constructor(
    @InjectRepository(AnalysisTaskEntity)
    private readonly analysisTasksRepository: Repository<AnalysisTaskEntity>,
  ) {}

  async create(request: CreateAnalysisTaskRequest): Promise<AnalysisTaskDto> {
    this.validateCreateRequest(request);

    const entity = this.analysisTasksRepository.create({
      title: request.title.trim(),
      productName: request.productName.trim(),
      competitorName: request.competitorName.trim(),
      analysisGoal: request.analysisGoal.trim(),
      sourceType: request.sourceType,
      input: request.input,
      status: 'created',
      result: null,
      trace: null,
      errorMessage: null,
    });

    return this.toDto(await this.analysisTasksRepository.save(entity));
  }

  async findAll(): Promise<AnalysisTaskListItemDto[]> {
    const tasks = await this.analysisTasksRepository.find({
      order: { createdAt: 'DESC' },
    });

    return tasks.map((task) => this.toListItemDto(task));
  }

  async findOne(id: string): Promise<AnalysisTaskDto> {
    return this.toDto(await this.findEntityById(id));
  }

  async runMock(id: string): Promise<AnalysisTaskDto> {
    const task = await this.findEntityById(id);

    const runningTask = await this.analysisTasksRepository.save({
      ...task,
      status: 'running',
      errorMessage: null,
    });

    const generatedAt = new Date().toISOString();
    const result: AnalysisTaskMockResult = {
      summary: `${task.productName} 与 ${task.competitorName} 的 mock 竞品分析已生成，当前结果用于验证任务链路，不代表真实模型结论。`,
      positioningComparison: [
        `${task.productName}：围绕当前输入中的自有产品信息建立分析基准。`,
        `${task.competitorName}：围绕当前输入中的竞品信息建立对照视角。`,
        `分析目标：${task.analysisGoal}`,
      ],
      strengths: [
        `${task.productName} 可以突出自身差异化定位。`,
        '当前任务骨架已经保留未来接入正式 Agent workflow 的结果字段。',
      ],
      opportunities: [
        `进一步补充 ${task.competitorName} 的页面内容、定价、用户路径等结构化信息。`,
        '后续阶段可将 mock 结果替换为正式模型分析报告。',
      ],
      recommendations: [
        '优先沉淀稳定的报告 schema，再接入真实 LLM。',
        '将 trace 字段用于记录未来 workflow 的关键执行步骤。',
      ],
      generatedAt,
    };
    const trace: AnalysisTaskTrace = {
      mode: 'mock',
      steps: [
        {
          name: 'load_task',
          status: 'completed',
          message: '读取分析任务输入。',
          timestamp: generatedAt,
        },
        {
          name: 'generate_mock_report',
          status: 'completed',
          message: '生成 mock 分析报告和建议。',
          timestamp: generatedAt,
        },
        {
          name: 'persist_result',
          status: 'completed',
          message: '写入 result 和 trace 字段。',
          timestamp: generatedAt,
        },
      ],
    };

    return this.toDto(
      await this.analysisTasksRepository.save({
        ...runningTask,
        status: 'completed',
        result,
        trace,
      }),
    );
  }

  private async findEntityById(id: string): Promise<AnalysisTaskEntity> {
    const task = await this.analysisTasksRepository.findOne({ where: { id } });

    if (!task) {
      throw new NotFoundException(`Analysis task ${id} not found`);
    }

    return task;
  }

  private validateCreateRequest(request: CreateAnalysisTaskRequest): void {
    const requiredTextFields: Array<keyof CreateAnalysisTaskRequest> = [
      'title',
      'productName',
      'competitorName',
      'analysisGoal',
    ];

    for (const field of requiredTextFields) {
      const value = request[field];
      if (typeof value !== 'string' || value.trim().length === 0) {
        throw new BadRequestException(`${field} is required`);
      }
    }

    if (request.sourceType !== 'manual') {
      throw new BadRequestException('sourceType must be manual');
    }

    if (
      !request.input ||
      typeof request.input !== 'object' ||
      Array.isArray(request.input)
    ) {
      throw new BadRequestException('input must be an object');
    }
  }

  private toDto(task: AnalysisTaskEntity): AnalysisTaskDto {
    return {
      id: task.id,
      title: task.title,
      productName: task.productName,
      competitorName: task.competitorName,
      analysisGoal: task.analysisGoal,
      sourceType: task.sourceType,
      input: task.input,
      status: task.status,
      result: task.result,
      trace: task.trace,
      errorMessage: task.errorMessage,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };
  }

  private toListItemDto(task: AnalysisTaskEntity): AnalysisTaskListItemDto {
    return {
      id: task.id,
      title: task.title,
      productName: task.productName,
      competitorName: task.competitorName,
      analysisGoal: task.analysisGoal,
      sourceType: task.sourceType,
      status: task.status,
      errorMessage: task.errorMessage,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };
  }
}
