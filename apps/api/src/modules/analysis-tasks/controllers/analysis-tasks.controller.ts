import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  createAnalysisTaskRequestSchema,
  type AnalysisTaskDto,
  type AnalysisTaskListItemDto,
  type CreateAnalysisTaskRequest,
} from '@product-intelligence-agent/shared';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { AnalysisTasksService } from '../services/analysis-tasks.service';

@Controller('analysis-tasks')
export class AnalysisTasksController {
  constructor(private readonly analysisTasksService: AnalysisTasksService) {}

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
  async findOne(@Param('id') id: string): Promise<AnalysisTaskDto> {
    return this.analysisTasksService.findOne(id);
  }

  @Post(':id/run-mock')
  async runMock(@Param('id') id: string): Promise<AnalysisTaskDto> {
    return this.analysisTasksService.runMock(id);
  }
}
