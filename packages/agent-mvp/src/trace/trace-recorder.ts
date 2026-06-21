import type { AgentMvpTrace, TraceStep } from '../schemas/index.js';

export class TraceRecorder {
  private readonly steps: TraceStep[] = [];

  constructor(
    private readonly traceId: string,
    private readonly taskName: string,
  ) {}

  async runStep<T>(
    stepId: string,
    name: string,
    inputSummary: string,
    fn: () => Promise<T> | T,
    outputSummary: (result: T) => string,
  ): Promise<T> {
    const startedAtMs = Date.now();
    const startedAt = new Date(startedAtMs).toISOString();

    try {
      const result = await fn();
      const endedAtMs = Date.now();
      this.steps.push({
        stepId,
        name,
        status: 'success',
        startedAt,
        endedAt: new Date(endedAtMs).toISOString(),
        durationMs: endedAtMs - startedAtMs,
        inputSummary,
        outputSummary: outputSummary(result),
      });
      return result;
    } catch (error) {
      const endedAtMs = Date.now();
      this.steps.push({
        stepId,
        name,
        status: 'failed',
        startedAt,
        endedAt: new Date(endedAtMs).toISOString(),
        durationMs: endedAtMs - startedAtMs,
        inputSummary,
        errorMessage: error instanceof Error ? error.message : '未知错误',
      });
      throw error;
    }
  }

  toJSON(): AgentMvpTrace {
    return {
      traceId: this.traceId,
      taskName: this.taskName,
      steps: this.steps,
    };
  }
}
