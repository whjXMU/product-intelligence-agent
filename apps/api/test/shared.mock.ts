import { z } from 'zod';

export const analysisTaskInputSchema = z
  .object({
    selfUrl: z.string().optional(),
    competitorUrl: z.string().optional(),
    notes: z.string().optional(),
  })
  .passthrough();

export const createAnalysisTaskRequestSchema = z.object({
  title: z.string().trim().min(1, 'title is required'),
  productName: z.string().trim().min(1, 'productName is required'),
  competitorName: z.string().trim().min(1, 'competitorName is required'),
  analysisGoal: z.string().trim().min(1, 'analysisGoal is required'),
  sourceType: z.literal('manual'),
  input: analysisTaskInputSchema,
});
