import { z } from 'zod';

export type AnalysisTaskStatus = 'created' | 'running' | 'completed' | 'failed';

export type AnalysisTaskSourceType = 'manual';

export const analysisTaskInputSchema = z
  .object({
    selfUrl: z.string().optional(),
    competitorUrl: z.string().optional(),
    notes: z.string().optional(),
  })
  .passthrough();

export type AnalysisTaskInput = z.infer<typeof analysisTaskInputSchema>;

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

// 创建请求DTO-前端传递的数据
export type CreateAnalysisTaskRequest = z.infer<
  typeof createAnalysisTaskRequestSchema
>;

// 后端返回的数据
export interface AnalysisTaskDto {
  id: string;
  title: string;
  productName: string;
  competitorName: string;
  analysisGoal: string;
  sourceType: AnalysisTaskSourceType;
  input: AnalysisTaskInput;
  status: AnalysisTaskStatus;
  result: AnalysisTaskMockResult | Record<string, unknown> | null;
  trace: AnalysisTaskTrace | Record<string, unknown> | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

// 任务列表项DTO
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
