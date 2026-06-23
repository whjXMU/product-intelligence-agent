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

export const analysisTaskWorkflowIdSchema = z.literal('competitive_analysis.v1');

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

export const agentTraceStepKindV1Schema = z.enum([
  'input_normalization',
  'analysis',
  'report_generation',
  'quality_check',
  'persistence',
]);

export const agentTraceStepStatusV1Schema = z.enum([
  'running',
  'completed',
  'failed',
  'skipped',
]);

export const agentTraceRunModeV1Schema = z.enum([
  'mock',
  'deterministic',
  'llm',
]);

export const agentTraceRunStatusV1Schema = z.enum([
  'running',
  'completed',
  'failed',
]);

export const agentTraceStepV1Schema = z.object({
  stepId: z.string().trim().min(1),
  name: z.string().trim().min(1),
  kind: agentTraceStepKindV1Schema,
  status: agentTraceStepStatusV1Schema,
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().optional(),
  summary: z.string().trim().min(1),
  inputRefs: z.array(z.string().trim().min(1)).optional(),
  outputRefs: z.array(z.string().trim().min(1)).optional(),
});

export const agentModelCallTraceV1Schema = z.object({
  id: z.string().trim().min(1),
  stepId: z.string().trim().min(1),
  provider: z.string().trim().min(1),
  model: z.string().trim().min(1),
  promptVersion: z.string().trim().optional(),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().optional(),
  usage: z
    .object({
      inputTokens: z.number().int().nonnegative().optional(),
      outputTokens: z.number().int().nonnegative().optional(),
      totalTokens: z.number().int().nonnegative().optional(),
    })
    .optional(),
  status: z.enum(['completed', 'failed']),
  errorMessage: z.string().trim().optional(),
});

export const agentToolCallTraceV1Schema = z.object({
  id: z.string().trim().min(1),
  stepId: z.string().trim().min(1),
  toolName: z.string().trim().min(1),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().optional(),
  status: z.enum(['completed', 'failed']),
  inputSummary: z.string().trim().optional(),
  outputSummary: z.string().trim().optional(),
  errorMessage: z.string().trim().optional(),
});

export const agentGuardrailTraceV1Schema = z.object({
  id: z.string().trim().min(1),
  stepId: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1),
  passed: z.boolean(),
  message: z.string().trim().optional(),
});

export const agentArtifactRefV1Schema = z.object({
  id: z.string().trim().min(1),
  type: z.enum(['input', 'output', 'intermediate']),
  name: z.string().trim().min(1),
  ref: z.string().trim().min(1),
  mimeType: z.string().trim().optional(),
});

export const agentTraceV1Schema = z.object({
  schemaVersion: z.literal('agent_trace.v1'),
  runId: z.string().trim().min(1),
  taskId: z.string().trim().min(1),
  workflowId: analysisTaskWorkflowIdSchema,
  workflowVersion: z.string().trim().min(1),
  mode: agentTraceRunModeV1Schema,
  status: agentTraceRunStatusV1Schema,
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().optional(),
  steps: z.array(agentTraceStepV1Schema),
  modelCalls: z.array(agentModelCallTraceV1Schema).default([]),
  toolCalls: z.array(agentToolCallTraceV1Schema).default([]),
  guardrails: z.array(agentGuardrailTraceV1Schema).default([]),
  artifacts: z.array(agentArtifactRefV1Schema).default([]),
  error: z
    .object({
      code: z.string().trim().min(1),
      message: z.string().trim().min(1),
      stepId: z.string().trim().min(1).optional(),
    })
    .optional(),
});

export type AgentTraceV1 = z.infer<typeof agentTraceV1Schema>;
export type AgentTraceStepV1 = z.infer<typeof agentTraceStepV1Schema>;
export type AgentModelCallTraceV1 = z.infer<
  typeof agentModelCallTraceV1Schema
>;
export type AgentToolCallTraceV1 = z.infer<typeof agentToolCallTraceV1Schema>;
export type AgentGuardrailTraceV1 = z.infer<
  typeof agentGuardrailTraceV1Schema
>;
export type AgentArtifactRefV1 = z.infer<typeof agentArtifactRefV1Schema>;

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
  result: AnalysisTaskMockResult | AnalysisTaskResultV1 | Record<string, unknown> | null;
  trace: AnalysisTaskTrace | AgentTraceV1 | Record<string, unknown> | null;
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
