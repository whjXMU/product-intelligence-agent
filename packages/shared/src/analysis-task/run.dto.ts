import type { AgentTraceRunModeV1, AgentTraceV1 } from './trace.schema.js';
import type { AnalysisTaskResultV1 } from './result.schema.js';

export type AnalysisTaskRunStatus = 'running' | 'completed' | 'failed';

export interface AnalysisTaskRunDto {
  id: string;
  taskId: string;
  workflowId: string;
  workflowVersion: string;
  mode: AgentTraceRunModeV1;
  status: AnalysisTaskRunStatus;
  result: AnalysisTaskResultV1 | Record<string, unknown> | null;
  trace: AgentTraceV1 | Record<string, unknown> | null;
  errorCode: string | null;
  errorMessage: string | null;
  startedAt: string;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
