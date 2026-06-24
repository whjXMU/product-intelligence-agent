import { z } from 'zod';
import type {
  AnalysisSessionMessageRole,
  AnalysisSessionStatus,
} from './common.js';

export const analysisSessionStatusSchema = z.enum([
  'drafting',
  'brief_ready',
  'ready_to_run',
  'running',
  'completed',
  'failed',
]);

export const analysisSessionMessageRoleSchema = z.enum([
  'user',
  'assistant',
  'system',
]);

export const analysisSessionMessageSchema = z.object({
  id: z.string().trim().min(1),
  role: analysisSessionMessageRoleSchema,
  content: z.string().trim().min(1),
  createdAt: z.string().trim().min(1),
});

export const createAnalysisSessionRequestSchema = z.object({
  initialPrompt: z.string().trim().min(1, 'initialPrompt is required'),
});

export const addAnalysisSessionMessageRequestSchema = z.object({
  content: z.string().trim().min(1, 'content is required'),
});

export type AnalysisSessionMessage = z.infer<
  typeof analysisSessionMessageSchema
> & {
  role: AnalysisSessionMessageRole;
};

export type CreateAnalysisSessionRequest = z.infer<
  typeof createAnalysisSessionRequestSchema
>;

export type AddAnalysisSessionMessageRequest = z.infer<
  typeof addAnalysisSessionMessageRequestSchema
>;

export interface AnalysisSessionDto {
  id: string;
  title: string;
  status: AnalysisSessionStatus;
  messages: AnalysisSessionMessage[];
  briefDraft: Record<string, unknown> | null;
  resultText: string | null;
  reportDraft: Record<string, unknown> | null;
  trace: Record<string, unknown>[] | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AnalysisSessionListItemDto = Pick<
  AnalysisSessionDto,
  | 'id'
  | 'title'
  | 'status'
  | 'resultText'
  | 'errorMessage'
  | 'createdAt'
  | 'updatedAt'
>;
