import {
  agentTraceV1Schema,
  analysisTaskResultV1Schema,
  type AnalysisTaskInputV1,
} from '@product-intelligence-agent/shared';
import { WorkflowRunnerService } from './runner.service';

describe('WorkflowRunnerService', () => {
  it('returns AnalysisTaskResultV1 and AgentTraceV1 without model or tool calls', async () => {
    const runner = new WorkflowRunnerService();
    const startedAt = '2026-06-23T00:00:00.000Z';

    const output = await runner.run({
      taskId: 'task-1',
      input: createInput(),
      startedAt,
      mode: 'deterministic',
    });

    expect(() => analysisTaskResultV1Schema.parse(output.result)).not.toThrow();
    expect(() => agentTraceV1Schema.parse(output.trace)).not.toThrow();
    expect(output.result.schemaVersion).toBe('analysis_task_result.v1');
    expect(output.trace.schemaVersion).toBe('agent_trace.v1');
    expect(output.result.workflow.workflowId).toBe('competitive_analysis.v1');
    expect(output.result.workflow.runId).toBe(output.trace.runId);
    expect(output.trace.mode).toBe('deterministic');
    expect(output.trace.status).toBe('completed');
    expect(output.trace.modelCalls).toEqual([]);
    expect(output.trace.toolCalls).toEqual([]);
  });
});

function createInput(): AnalysisTaskInputV1 {
  return {
    schemaVersion: 'analysis_task_input.v1',
    subject: {
      productName: 'OpenAI',
      competitorNames: ['DeepSeek'],
    },
    goal: {
      primaryQuestion: '比较首页定位、核心卖点、用户转化路径',
      focusAreas: ['定位表达', '转化路径'],
      audience: 'pm',
    },
    sources: [
      {
        type: 'manual_url',
        role: 'self',
        name: 'OpenAI',
        url: 'https://openai.com',
      },
      {
        type: 'manual_url',
        role: 'competitor',
        name: 'DeepSeek',
        url: 'https://deepseek.com',
      },
    ],
    outputPreferences: {
      language: 'zh-CN',
      detailLevel: 'standard',
      includePrdSuggestions: true,
    },
  };
}
