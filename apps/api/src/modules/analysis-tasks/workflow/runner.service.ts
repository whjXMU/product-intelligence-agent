import { Injectable } from '@nestjs/common';
import type {
  AgentWorkflow,
  AgentWorkflowRunInput,
  AgentWorkflowRunOutput,
} from '@product-intelligence-agent/agent-core';
import {
  agentTraceV1Schema,
  analysisTaskResultV1Schema,
  type AgentTraceStepV1,
  type AgentTraceV1,
  type AnalysisTaskInputV1,
  type AnalysisTaskResultV1,
} from '@product-intelligence-agent/shared';
import { createRunId } from './trace.factory';

type Workflow = AgentWorkflow<
  AnalysisTaskInputV1,
  AnalysisTaskResultV1,
  AgentTraceV1
>;

@Injectable()
export class WorkflowRunnerService implements Workflow {
  readonly id = 'competitive_analysis.v1' as const;
  readonly version = '2026-06-23.deterministic.v1';

  run(
    runInput: AgentWorkflowRunInput<AnalysisTaskInputV1>,
  ): Promise<AgentWorkflowRunOutput<AnalysisTaskResultV1, AgentTraceV1>> {
    const runId = createRunId(runInput.taskId, runInput.startedAt);
    const generatedAt = new Date().toISOString();
    const productName = runInput.input.subject.productName;
    const competitorNames = runInput.input.subject.competitorNames;
    const competitorLabel = competitorNames.join('、');
    const sourceSummary = summarizeSources(runInput.input);
    const focusAreas = normalizeFocusAreas(runInput.input.goal.focusAreas);

    const steps: AgentTraceStepV1[] = [
      createCompletedStep({
        stepId: 'input_normalization',
        name: 'Normalize analysis input',
        kind: 'input_normalization',
        startedAt: runInput.startedAt,
        endedAt: generatedAt,
        summary: `已将任务输入标准化为 AnalysisTaskInputV1，包含 ${sourceSummary}.`,
        inputRefs: ['analysis_tasks.input'],
        outputRefs: ['workflow.input'],
      }),
      createCompletedStep({
        stepId: 'deterministic_analysis',
        name: 'Run deterministic competitive analysis',
        kind: 'analysis',
        startedAt: generatedAt,
        endedAt: generatedAt,
        summary: `基于产品、竞品、分析目标和 ${focusAreas.length} 个关注维度生成确定性分析。`,
        inputRefs: ['workflow.input'],
        outputRefs: ['analysis.findings'],
      }),
      createCompletedStep({
        stepId: 'report_generation',
        name: 'Generate versioned report',
        kind: 'report_generation',
        startedAt: generatedAt,
        endedAt: generatedAt,
        summary: '生成 AnalysisTaskResultV1 报告结构。',
        inputRefs: ['analysis.findings'],
        outputRefs: ['analysis_tasks.result'],
      }),
      createCompletedStep({
        stepId: 'quality_check',
        name: 'Validate report quality',
        kind: 'quality_check',
        startedAt: generatedAt,
        endedAt: generatedAt,
        summary: '检查报告是否包含摘要、对比维度、机会点和需求建议。',
        inputRefs: ['analysis_tasks.result'],
        outputRefs: ['quality.checks'],
      }),
    ];

    const result: AnalysisTaskResultV1 = {
      schemaVersion: 'analysis_task_result.v1',
      generatedAt,
      workflow: {
        workflowId: this.id,
        workflowVersion: this.version,
        runId,
      },
      executiveSummary: {
        oneLine: `${productName} 与 ${competitorLabel} 的竞品分析已由确定性 workflow 生成，重点围绕 ${runInput.input.goal.primaryQuestion}。`,
        keyFindings: [
          `${productName} 需要围绕目标用户、首屏信息和转化路径建立更清晰的自有产品叙事。`,
          `${competitorLabel} 可作为对照样本，用于识别定位表达、信息层级和行动入口上的差距。`,
          `当前输入包含 ${sourceSummary}，后续接入真实 Agent 后可替换为模型分析和证据引用。`,
        ],
        confidence: 'medium',
      },
      comparisonDimensions: [
        {
          id: 'positioning',
          name: '定位表达',
          selfAssessment: `${productName} 的定位应围绕「${runInput.input.goal.primaryQuestion}」给出更直接的价值承诺。`,
          competitorAssessment: `${competitorLabel} 可用于对照其首屏价值主张、目标用户和差异化标签。`,
          gap: '当前 deterministic runner 只能基于任务元信息生成基线判断，尚未读取真实页面内容。',
          evidenceRefs: [],
        },
        {
          id: 'conversion_path',
          name: '转化路径',
          selfAssessment: `${productName} 需要明确用户下一步动作，例如了解产品、提交线索或开始试用。`,
          competitorAssessment: `${competitorLabel} 的转化入口应在后续真实 workflow 中结合页面内容进一步分析。`,
          gap: '建议后续补充页面 HTML、关键 CTA 和用户路径数据，提高结论可验证性。',
          evidenceRefs: [],
        },
        {
          id: 'message_hierarchy',
          name: '信息层级',
          selfAssessment: `${productName} 可以按「问题、能力、证明、行动」组织页面信息。`,
          competitorAssessment: `${competitorLabel} 的信息层级可作为评估用户理解成本的参照。`,
          gap: `当前关注维度包括：${focusAreas.join('、')}。`,
          evidenceRefs: [],
        },
      ],
      opportunities: [
        {
          id: 'opportunity_clearer_value_prop',
          title: '强化首屏价值主张',
          rationale: `围绕 ${runInput.input.goal.primaryQuestion} 提炼一句能被目标用户快速理解的价值承诺。`,
          impact: 'high',
          effort: 'medium',
          evidenceRefs: [],
        },
        {
          id: 'opportunity_structured_competitor_evidence',
          title: '补充结构化竞品证据',
          rationale:
            '在后续 workflow 中加入页面文本、截图摘要或手工摘录，可提升对比结论可信度。',
          impact: 'medium',
          effort: 'low',
          evidenceRefs: [],
        },
      ],
      recommendations: [
        {
          id: 'rec_define_positioning_brief',
          title: '沉淀竞品分析定位简报',
          description: `为 ${productName} 建立一页定位简报，覆盖目标用户、核心场景、竞品差异和首屏表达。`,
          priority: 'p0',
          successMetric: '团队能在 5 分钟内复述产品定位和相对竞品差异。',
          evidenceRefs: [],
        },
        {
          id: 'rec_collect_workflow_sources',
          title: '补齐正式 Agent 输入素材',
          description:
            '为每个分析对象补充 URL、页面 HTML 或手工文本，供后续真实模型 runner 使用。',
          priority: 'p1',
          successMetric: '每个竞品至少有一个可追溯 source 输入。',
          evidenceRefs: [],
        },
      ],
      quality: {
        passed: true,
        score: 0.86,
        checks: [
          {
            name: 'schema_version',
            passed: true,
            message: '结果使用 AnalysisTaskResultV1。',
          },
          {
            name: 'minimum_report_sections',
            passed: true,
            message: '结果包含摘要、对比维度、机会点和需求建议。',
          },
          {
            name: 'trace_alignment',
            passed: true,
            message: 'result.workflow.runId 与 trace.runId 保持一致。',
          },
        ],
      },
    };

    const trace: AgentTraceV1 = {
      schemaVersion: 'agent_trace.v1',
      runId,
      taskId: runInput.taskId,
      workflowId: this.id,
      workflowVersion: this.version,
      mode: runInput.mode,
      status: 'completed',
      startedAt: runInput.startedAt,
      endedAt: generatedAt,
      steps,
      modelCalls: [],
      toolCalls: [],
      guardrails: [],
      artifacts: [],
    };

    return Promise.resolve({
      result: analysisTaskResultV1Schema.parse(result),
      trace: agentTraceV1Schema.parse(trace),
    });
  }
}

function createCompletedStep(
  step: Omit<AgentTraceStepV1, 'status'>,
): AgentTraceStepV1 {
  return {
    ...step,
    status: 'completed',
  };
}

function normalizeFocusAreas(focusAreas: string[]): string[] {
  return focusAreas.length > 0
    ? focusAreas
    : ['定位表达', '信息层级', '转化路径'];
}

function summarizeSources(input: AnalysisTaskInputV1): string {
  if (input.sources.length === 0) {
    return '0 个 source';
  }

  const sourceCounts = input.sources.reduce<Record<string, number>>(
    (counts, source) => ({
      ...counts,
      [source.type]: (counts[source.type] ?? 0) + 1,
    }),
    {},
  );

  return Object.entries(sourceCounts)
    .map(([type, count]) => `${count} 个 ${type}`)
    .join('、');
}
