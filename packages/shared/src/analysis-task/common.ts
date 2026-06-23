import { z } from 'zod';

export type AnalysisTaskStatus = 'created' | 'running' | 'completed' | 'failed';

export type AnalysisTaskSourceType = 'manual';

export const analysisTaskWorkflowIdSchema = z.literal('competitive_analysis.v1');
