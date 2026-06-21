import { z } from 'zod';

export const traceStepStatusSchema = z.enum(['success', 'failed']);

export const traceStepSchema = z.object({
  stepId: z.string(),
  name: z.string(),
  status: traceStepStatusSchema,
  startedAt: z.string(),
  endedAt: z.string(),
  durationMs: z.number().nonnegative(),
  inputSummary: z.string().optional(),
  outputSummary: z.string().optional(),
  errorMessage: z.string().optional(),
});

export const agentMvpTraceSchema = z.object({
  traceId: z.string(),
  taskName: z.string(),
  steps: z.array(traceStepSchema),
});

export type TraceStepStatus = z.infer<typeof traceStepStatusSchema>;
export type TraceStep = z.infer<typeof traceStepSchema>;
export type AgentMvpTrace = z.infer<typeof agentMvpTraceSchema>;
