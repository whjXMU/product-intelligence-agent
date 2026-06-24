import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  addAnalysisSessionMessageRequestSchema,
  createAnalysisSessionRequestSchema,
  type AddAnalysisSessionMessageRequest,
  type AnalysisSessionDto,
  type AnalysisSessionListItemDto,
  type CreateAnalysisSessionRequest,
} from '@product-intelligence-agent/shared';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { AnalysisSessionsService } from '../services/analysis-sessions.service';

@Controller('analysis-sessions')
export class AnalysisSessionsController {
  constructor(
    private readonly analysisSessionsService: AnalysisSessionsService,
  ) {}

  @Post()
  async create(
    @Body(new ZodValidationPipe(createAnalysisSessionRequestSchema))
    request: CreateAnalysisSessionRequest,
  ): Promise<AnalysisSessionDto> {
    return this.analysisSessionsService.create(request);
  }

  @Get()
  async findAll(): Promise<AnalysisSessionListItemDto[]> {
    return this.analysisSessionsService.findAll();
  }

  @Get(':id')
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<AnalysisSessionDto> {
    return this.analysisSessionsService.findOne(id);
  }

  @Post(':id/messages')
  async addMessage(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(addAnalysisSessionMessageRequestSchema))
    request: AddAnalysisSessionMessageRequest,
  ): Promise<AnalysisSessionDto> {
    return this.analysisSessionsService.addMessage(id, request);
  }

  @Post(':id/run')
  async run(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<AnalysisSessionDto> {
    return this.analysisSessionsService.run(id);
  }

  @Delete(':id')
  async remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<null> {
    await this.analysisSessionsService.remove(id);
    return null;
  }
}
