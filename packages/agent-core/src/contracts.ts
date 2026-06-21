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
