import {
  agentTraceV1Schema,
  type AgentTraceV1,
} from '@product-intelligence-agent/shared';

export interface CreateFailedTraceInput {
  taskId: string;
  startedAt: string;
  workflowId: 'competitive_analysis.v1';
  workflowVersion: string;
  mode: AgentTraceV1['mode'];
  errorCode: string;
  errorMessage: string;
}

export function createFailedTrace(input: CreateFailedTraceInput): AgentTraceV1 {
  const endedAt = new Date().toISOString();
  const stepId = 'workflow_failed';

  return agentTraceV1Schema.parse({
    schemaVersion: 'agent_trace.v1',
    runId: createRunId(input.taskId, input.startedAt),
    taskId: input.taskId,
    workflowId: input.workflowId,
    workflowVersion: input.workflowVersion,
    mode: input.mode,
    status: 'failed',
    startedAt: input.startedAt,
    endedAt,
    steps: [
      {
        stepId,
        name: 'Run analysis task workflow',
        kind: 'analysis',
        status: 'failed',
        startedAt: input.startedAt,
        endedAt,
        summary: input.errorMessage,
        inputRefs: ['analysis_tasks.input'],
        outputRefs: ['analysis_tasks.trace'],
      },
    ],
    modelCalls: [],
    toolCalls: [],
    guardrails: [],
    artifacts: [],
    error: {
      code: input.errorCode,
      message: input.errorMessage,
      stepId,
    },
  });
}

export function createRunId(taskId: string, startedAt: string): string {
  const timestamp = Date.parse(startedAt);
  const normalizedTaskId = taskId.replace(/[^a-zA-Z0-9_-]/g, '_');

  return `competitive_analysis_${normalizedTaskId}_${timestamp}`;
}
