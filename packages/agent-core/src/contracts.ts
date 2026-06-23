export interface AgentTool<Input = unknown, Output = unknown> {
  name: string;
  description: string;
  execute(input: Input): Promise<Output>;
}

export interface AgentMemoryRecord {
  scope: 'task' | 'user' | 'project';
  key: string;
  value: unknown;
}

export interface AgentWorkflowStep<Input = unknown, Output = unknown> {
  id: string;
  name: string;
  run(input: Input): Promise<Output>;
}

export interface AgentGuardrailResult {
  allowed: boolean;
  reason?: string;
}

export interface AgentTraceEvent {
  traceId: string;
  stepId: string;
  name: string;
  startedAt: string;
  endedAt?: string;
  status: 'running' | 'success' | 'failed';
  metadata?: Record<string, unknown>;
}

export type AgentWorkflowMode = 'mock' | 'deterministic' | 'llm';

export interface AgentWorkflowRunInput<Input> {
  taskId: string;
  input: Input;
  startedAt: string;
  mode: AgentWorkflowMode;
}

export interface AgentWorkflowRunOutput<Result, Trace> {
  result: Result;
  trace: Trace;
}

export interface AgentWorkflow<Input, Result, Trace> {
  id: string;
  version: string;
  run(
    input: AgentWorkflowRunInput<Input>,
  ): Promise<AgentWorkflowRunOutput<Result, Trace>>;
}
