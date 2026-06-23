import { z } from 'zod';
import { analysisTaskWorkflowIdSchema } from './common.js';

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
export type AgentTraceRunModeV1 = z.infer<typeof agentTraceRunModeV1Schema>;

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
