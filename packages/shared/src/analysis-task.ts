export type AnalysisTaskStatus = 'created' | 'running' | 'completed' | 'failed';

export type AnalysisTaskSourceType = 'manual';

export interface AnalysisTaskInput {
  selfUrl?: string;
  competitorUrl?: string;
  notes?: string;
  [key: string]: unknown;
}

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

// 创建请求DTO-前端传递的数据
export interface CreateAnalysisTaskRequest {
  title: string;
  productName: string;
  competitorName: string;
  analysisGoal: string;
  sourceType: AnalysisTaskSourceType;
  input: AnalysisTaskInput;
}

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
