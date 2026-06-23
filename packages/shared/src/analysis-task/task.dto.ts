import { z } from 'zod';
import type { AgentTraceV1 } from './trace.schema.js';
import {
  analysisTaskInputSchema,
  type AnalysisTaskInput,
} from './input.schema.js';
import type { AnalysisTaskResultV1 } from './result.schema.js';
import type { AnalysisTaskSourceType, AnalysisTaskStatus } from './common.js';

export interface AnalysisTaskMockResult {
  summary: string;
  positioningComparison: string[];
  strengths: string[];
  opportunities: string[];
  recommendations: string[];
  generatedAt: string;
}

export interface AnalysisTaskTraceStep {
  name: string;
  status: 'completed' | 'failed';
  message: string;
  timestamp: string;
}

export interface AnalysisTaskTrace {
  mode: 'mock';
  steps: AnalysisTaskTraceStep[];
}

export const createAnalysisTaskRequestSchema = z.object({
  title: z.string().trim().min(1, 'title is required'),
  productName: z.string().trim().min(1, 'productName is required'),
  competitorName: z.string().trim().min(1, 'competitorName is required'),
  analysisGoal: z.string().trim().min(1, 'analysisGoal is required'),
  sourceType: z.literal('manual'),
  input: analysisTaskInputSchema,
});

export type CreateAnalysisTaskRequest = z.infer<
  typeof createAnalysisTaskRequestSchema
>;

export interface AnalysisTaskDto {
  id: string;
  title: string;
  productName: string;
  competitorName: string;
  analysisGoal: string;
  sourceType: AnalysisTaskSourceType;
  input: AnalysisTaskInput;
  status: AnalysisTaskStatus;
  result:
    | AnalysisTaskMockResult
    | AnalysisTaskResultV1
    | Record<string, unknown>
    | null;
  trace: AnalysisTaskTrace | AgentTraceV1 | Record<string, unknown> | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AnalysisTaskListItemDto = Pick<
  AnalysisTaskDto,
  | 'id'
  | 'title'
  | 'productName'
  | 'competitorName'
  | 'analysisGoal'
  | 'sourceType'
  | 'status'
  | 'errorMessage'
  | 'createdAt'
  | 'updatedAt'
>;
