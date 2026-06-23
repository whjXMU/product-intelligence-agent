import { z } from 'zod';
import { analysisTaskWorkflowIdSchema } from './common.js';

export const analysisTaskConfidenceSchema = z.enum(['low', 'medium', 'high']);
export const analysisTaskImpactSchema = z.enum(['low', 'medium', 'high']);
export const analysisTaskEffortSchema = z.enum(['low', 'medium', 'high']);
export const analysisTaskPrioritySchema = z.enum(['p0', 'p1', 'p2']);

export const analysisTaskResultV1Schema = z.object({
  schemaVersion: z.literal('analysis_task_result.v1'),
  generatedAt: z.string().datetime(),
  workflow: z.object({
    workflowId: analysisTaskWorkflowIdSchema,
    workflowVersion: z.string().trim().min(1),
    runId: z.string().trim().min(1),
  }),
  executiveSummary: z.object({
    oneLine: z.string().trim().min(1),
    keyFindings: z.array(z.string().trim().min(1)),
    confidence: analysisTaskConfidenceSchema,
  }),
  comparisonDimensions: z.array(
    z.object({
      id: z.string().trim().min(1),
      name: z.string().trim().min(1),
      selfAssessment: z.string().trim().min(1),
      competitorAssessment: z.string().trim().min(1),
      gap: z.string().trim().min(1),
      evidenceRefs: z.array(z.string().trim().min(1)).default([]),
    }),
  ),
  opportunities: z.array(
    z.object({
      id: z.string().trim().min(1),
      title: z.string().trim().min(1),
      rationale: z.string().trim().min(1),
      impact: analysisTaskImpactSchema,
      effort: analysisTaskEffortSchema,
      evidenceRefs: z.array(z.string().trim().min(1)).default([]),
    }),
  ),
  recommendations: z.array(
    z.object({
      id: z.string().trim().min(1),
      title: z.string().trim().min(1),
      description: z.string().trim().min(1),
      priority: analysisTaskPrioritySchema,
      successMetric: z.string().trim().optional(),
      evidenceRefs: z.array(z.string().trim().min(1)).default([]),
    }),
  ),
  quality: z.object({
    passed: z.boolean(),
    score: z.number().min(0).max(1),
    checks: z.array(
      z.object({
        name: z.string().trim().min(1),
        passed: z.boolean(),
        message: z.string().trim().min(1),
      }),
    ),
  }),
});

export type AnalysisTaskResultV1 = z.infer<typeof analysisTaskResultV1Schema>;
