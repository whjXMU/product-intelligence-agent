import { z } from 'zod';

export const analysisTaskInputSchema = z
  .object({
    selfUrl: z.string().optional(),
    competitorUrl: z.string().optional(),
    notes: z.string().optional(),
  })
  .passthrough();

export type AnalysisTaskInput = z.infer<typeof analysisTaskInputSchema>;

export const analysisTaskAudienceSchema = z.enum([
  'pm',
  'founder',
  'designer',
  'engineer',
  'other',
]);

export const analysisTaskInputSourceRoleSchema = z.enum([
  'self',
  'competitor',
]);

export const analysisTaskInputSourceSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('manual_url'),
    role: analysisTaskInputSourceRoleSchema,
    name: z.string().trim().min(1),
    url: z.string().trim().url(),
    notes: z.string().trim().optional(),
  }),
  z.object({
    type: z.literal('manual_html'),
    role: analysisTaskInputSourceRoleSchema,
    name: z.string().trim().min(1),
    htmlRef: z.string().trim().min(1),
    notes: z.string().trim().optional(),
  }),
  z.object({
    type: z.literal('manual_text'),
    role: analysisTaskInputSourceRoleSchema,
    name: z.string().trim().min(1),
    content: z.string().trim().min(1),
    notes: z.string().trim().optional(),
  }),
]);

export const analysisTaskInputV1Schema = z.object({
  schemaVersion: z.literal('analysis_task_input.v1'),
  subject: z.object({
    productName: z.string().trim().min(1),
    competitorNames: z.array(z.string().trim().min(1)).min(1),
  }),
  goal: z.object({
    primaryQuestion: z.string().trim().min(1),
    focusAreas: z.array(z.string().trim().min(1)).default([]),
    audience: analysisTaskAudienceSchema,
  }),
  sources: z.array(analysisTaskInputSourceSchema).default([]),
  outputPreferences: z.object({
    language: z.enum(['zh-CN', 'en-US']),
    detailLevel: z.enum(['brief', 'standard', 'deep']),
    includePrdSuggestions: z.boolean(),
  }),
});

export type AnalysisTaskInputV1 = z.infer<typeof analysisTaskInputV1Schema>;
export type AnalysisTaskInputSourceV1 = z.infer<
  typeof analysisTaskInputSourceSchema
>;
