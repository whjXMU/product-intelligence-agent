import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  createAnalysisTaskRequestSchema,
  type AnalysisTaskDto,
  type AnalysisTaskListItemDto,
  type AnalysisTaskRunDto,
  type AnalysisTaskRunListItemDto,
  type CreateAnalysisTaskRequest,
} from '@product-intelligence-agent/shared';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { AnalysisTaskRunsService } from '../services/analysis-task-runs.service';
import { AnalysisTasksService } from '../services/analysis-tasks.service';

@Controller('analysis-tasks')
export class AnalysisTasksController {
  constructor(
    private readonly analysisTasksService: AnalysisTasksService,
    private readonly analysisTaskRunsService: AnalysisTaskRunsService,
  ) {}

  @Post()
  async create(
    @Body(new ZodValidationPipe(createAnalysisTaskRequestSchema))
    request: CreateAnalysisTaskRequest,
  ): Promise<AnalysisTaskDto> {
    return this.analysisTasksService.create(request);
  }

  @Get()
  async findAll(): Promise<AnalysisTaskListItemDto[]> {
    return this.analysisTasksService.findAll();
  }

  @Get(':id')
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<AnalysisTaskDto> {
    return this.analysisTasksService.findOne(id);
  }

  @Post(':id/run-mock')
  async runMock(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<AnalysisTaskDto> {
    return this.analysisTasksService.runMock(id);
  }

  @Post(':id/runs')
  async createRun(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<AnalysisTaskRunDto> {
    return this.analysisTaskRunsService.createAgentRun(id);
  }

  @Get(':id/runs')
  async listRuns(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<AnalysisTaskRunListItemDto[]> {
    return this.analysisTaskRunsService.listRuns(id);
  }

  @Get(':id/runs/:runId')
  async findRun(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('runId', new ParseUUIDPipe()) runId: string,
  ): Promise<AnalysisTaskRunDto> {
    return this.analysisTaskRunsService.findRun(id, runId);
  }
}
