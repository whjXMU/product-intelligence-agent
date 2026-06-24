import { z } from 'zod';

export type AnalysisTaskStatus = 'created' | 'running' | 'completed' | 'failed';

export type AnalysisTaskSourceType = 'manual';

export const analysisTaskWorkflowIdSchema = z.literal('competitive_analysis.v1');

export type AnalysisSessionStatus =
  | 'drafting'
  | 'brief_ready'
  | 'ready_to_run'
  | 'running'
  | 'completed'
  | 'failed';

export type AnalysisSessionMessageRole = 'user' | 'assistant' | 'system';
