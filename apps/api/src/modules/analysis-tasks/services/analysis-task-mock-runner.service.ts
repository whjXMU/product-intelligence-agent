import { Injectable } from '@nestjs/common';
import type {
  AnalysisTaskMockResult,
  AnalysisTaskTrace,
} from '@product-intelligence-agent/shared';
import type { AnalysisTaskEntity } from '../entities/analysis-task.entity';

export interface AnalysisTaskMockRunResult {
  result: AnalysisTaskMockResult;
  trace: AnalysisTaskTrace;
}

@Injectable()
export class AnalysisTaskMockRunnerService {
  run(task: AnalysisTaskEntity): AnalysisTaskMockRunResult {
    const generatedAt = new Date().toISOString();

    return {
      result: {
        summary: `${task.productName} 与 ${task.competitorName} 的 mock 竞品分析已生成，当前结果用于验证任务链路，不代表真实模型结论。`,
        positioningComparison: [
          `${task.productName}：围绕当前输入中的自有产品信息建立分析基准。`,
          `${task.competitorName}：围绕当前输入中的竞品信息建立对照视角。`,
          `分析目标：${task.analysisGoal}`,
        ],
        strengths: [
          `${task.productName} 可以突出自身差异化定位。`,
          '当前任务骨架已经保留未来接入正式 Agent workflow 的结果字段。',
        ],
        opportunities: [
          `进一步补充 ${task.competitorName} 的页面内容、定价、用户路径等结构化信息。`,
          '后续阶段可将 mock 结果替换为正式模型分析报告。',
        ],
        recommendations: [
          '优先沉淀稳定的报告 schema，再接入真实 LLM。',
          '将 trace 字段用于记录未来 workflow 的关键执行步骤。',
        ],
        generatedAt,
      },
      trace: {
        mode: 'mock',
        steps: [
          {
            name: 'load_task',
            status: 'completed',
            message: '读取分析任务输入。',
            timestamp: generatedAt,
          },
          {
            name: 'generate_mock_report',
            status: 'completed',
            message: '生成 mock 分析报告和建议。',
            timestamp: generatedAt,
          },
          {
            name: 'persist_result',
            status: 'completed',
            message: '写入 result 和 trace 字段。',
            timestamp: generatedAt,
          },
        ],
      },
    };
  }
}
