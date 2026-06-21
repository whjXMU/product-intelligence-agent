import type {
  CompetitiveAnalysisTask,
  HomepagePair,
} from '../schemas/index.js';
import { standardComparisonDimensions } from '../schemas/index.js';

export const COMPETITIVE_ANALYSIS_PROMPT_VERSION =
  'competitive-analysis.v1.1.0';

export function buildCompetitiveAnalysisPrompt(
  task: CompetitiveAnalysisTask,
  homepagePair: HomepagePair,
): string {
  return [
    '你是一位资深 AI 产品经理和竞品分析专家。',
    `Prompt 版本：${COMPETITIVE_ANALYSIS_PROMPT_VERSION}`,
    '你的任务是基于两个官网首页提取结果，站在己方产品经理视角进行竞品比较。',
    '',
    '重要约束：',
    '1. 只能基于输入中的 homepage profile 和 evidence 分析，不要编造页面没有提供的信息。',
    '2. 每个评分维度必须给出 selfEvidence 和 competitorEvidence。',
    '3. 输出必须是严格 JSON，不要输出 Markdown，不要包裹代码块。',
    '4. 分数使用 1-10 分，10 分最好。',
    '5. 需求建议必须像产品需求，不要只写“优化表达”这类空话。',
    '',
    `分析视角：${task.rolePerspective}`,
    `分析目标：${task.objective}`,
    '',
    '固定比较维度：',
    standardComparisonDimensions.map((dimension) => `- ${dimension}`).join('\n'),
    '',
    '你可以根据页面内容额外补充 1-3 个动态维度。',
    '',
    '输出 JSON 结构必须匹配：',
    JSON.stringify(
      {
        task: '原样放回输入 task 对象',
        summary: {
          conclusion: '总体结论',
          selfOverallScore: 1,
          competitorOverallScore: 1,
          keyGaps: ['关键差距'],
          topOpportunities: ['最高优先级机会'],
        },
        dimensions: [
          {
            dimension: '维度名称',
            selfScore: 1,
            competitorScore: 1,
            winner: 'self | competitor | tie',
            reason: '评分理由',
            selfEvidence: ['己方页面证据'],
            competitorEvidence: ['竞品页面证据'],
            gap: '差距描述',
            severity: 'low | medium | high',
          },
        ],
        requirements: [
          {
            title: '需求标题',
            priority: 'P0 | P1 | P2',
            problem: '问题描述',
            userValue: '用户价值',
            proposedSolution: '建议方案',
            competitorReference: '竞品参考',
            successMetrics: ['成功指标'],
            implementationNotes: '实现说明',
          },
        ],
        risksAndAssumptions: ['风险和假设'],
      },
      null,
      2,
    ),
    '',
    '输入 task：',
    JSON.stringify(task, null, 2),
    '',
    '首页提取结果：',
    JSON.stringify(homepagePair, null, 2),
  ].join('\n');
}

export function buildReportJsonRepairPrompt(input: {
  originalContent: string;
  errorMessage: string;
}): string {
  return [
    '你是 JSON 修复器。',
    '请把下面的模型输出修复为严格 JSON 对象，且必须匹配竞品分析报告结构。',
    '不要新增事实，不要扩写内容，只修复 JSON 格式、字段名、枚举值、缺失的必填字段类型问题。',
    '',
    '结构要求：',
    '- root.task 必须存在；',
    '- root.summary 必须包含 conclusion、selfOverallScore、competitorOverallScore、keyGaps、topOpportunities；',
    '- root.dimensions 必须是数组，每项包含 dimension、selfScore、competitorScore、winner、reason、selfEvidence、competitorEvidence、gap、severity；',
    '- winner 只能是 self、competitor、tie；',
    '- severity 只能是 low、medium、high；',
    '- root.requirements 必须是数组，每项包含 title、priority、problem、userValue、proposedSolution、competitorReference、successMetrics、implementationNotes；',
    '- priority 只能是 P0、P1、P2；',
    '- root.risksAndAssumptions 必须是字符串数组。',
    '',
    '校验错误：',
    input.errorMessage,
    '',
    '原始输出：',
    input.originalContent,
  ].join('\n');
}
