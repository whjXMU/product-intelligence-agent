import { agentTraceV1Schema } from '@product-intelligence-agent/shared';
import { createFailedTrace, createRunId } from './trace.factory';

describe('analysis task workflow trace factory', () => {
  it('creates a schema-valid failed AgentTraceV1', () => {
    const trace = createFailedTrace({
      taskId: 'task-1',
      startedAt: '2026-06-23T00:00:00.000Z',
      workflowId: 'competitive_analysis.v1',
      workflowVersion: '2026-06-23.deterministic.v1',
      mode: 'deterministic',
      errorCode: 'ANALYSIS_TASK_WORKFLOW_RUN_FAILED',
      errorMessage: 'workflow failed',
    });

    expect(() => agentTraceV1Schema.parse(trace)).not.toThrow();
    expect(trace).toMatchObject({
      schemaVersion: 'agent_trace.v1',
      runId: 'competitive_analysis_task-1_1782172800000',
      taskId: 'task-1',
      workflowId: 'competitive_analysis.v1',
      workflowVersion: '2026-06-23.deterministic.v1',
      mode: 'deterministic',
      status: 'failed',
      error: {
        code: 'ANALYSIS_TASK_WORKFLOW_RUN_FAILED',
        message: 'workflow failed',
        stepId: 'workflow_failed',
      },
    });
    expect(trace.steps).toEqual([
      expect.objectContaining({
        stepId: 'workflow_failed',
        status: 'failed',
        summary: 'workflow failed',
      }),
    ]);
  });

  it('normalizes task ids when creating workflow run ids', () => {
    expect(createRunId('task:with spaces', '2026-06-23T00:00:00.000Z')).toBe(
      'competitive_analysis_task_with_spaces_1782172800000',
    );
  });
});
