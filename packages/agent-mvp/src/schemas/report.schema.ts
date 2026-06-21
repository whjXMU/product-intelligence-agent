import { z } from 'zod';
import { competitiveAnalysisTaskSchema } from './task.schema.js';

export const comparisonWinnerSchema = z.enum(['self', 'competitor', 'tie']);
export const severitySchema = z.enum(['low', 'medium', 'high']);
export const requirementPrioritySchema = z.enum(['P0', 'P1', 'P2']);

export const dimensionComparisonSchema = z.object({
  dimension: z.string(),
  selfScore: z.number().min(1).max(10),
  competitorScore: z.number().min(1).max(10),
  winner: comparisonWinnerSchema,
  reason: z.string(),
  selfEvidence: z.array(z.string()),
  competitorEvidence: z.array(z.string()),
  gap: z.string(),
  severity: severitySchema,
});

export const productRequirementSchema = z.object({
  title: z.string(),
  priority: requirementPrioritySchema,
  problem: z.string(),
  userValue: z.string(),
  proposedSolution: z.string(),
  competitorReference: z.string(),
  successMetrics: z.array(z.string()),
  implementationNotes: z.string(),
});

export const competitiveAnalysisReportSchema = z.object({
  task: competitiveAnalysisTaskSchema,
  summary: z.object({
    conclusion: z.string(),
    selfOverallScore: z.number().min(1).max(10),
    competitorOverallScore: z.number().min(1).max(10),
    keyGaps: z.array(z.string()),
    topOpportunities: z.array(z.string()),
  }),
  dimensions: z.array(dimensionComparisonSchema),
  requirements: z.array(productRequirementSchema),
  risksAndAssumptions: z.array(z.string()),
});

export type ComparisonWinner = z.infer<typeof comparisonWinnerSchema>;
export type Severity = z.infer<typeof severitySchema>;
export type RequirementPriority = z.infer<typeof requirementPrioritySchema>;
export type DimensionComparison = z.infer<typeof dimensionComparisonSchema>;
export type ProductRequirement = z.infer<typeof productRequirementSchema>;
export type CompetitiveAnalysisReport = z.infer<
  typeof competitiveAnalysisReportSchema
>;

export const standardComparisonDimensions = [
  '品牌定位清晰度',
  '核心能力表达',
  '首页主张是否明确',
  '产品入口清晰度',
  '开发者转化路径',
  '企业客户信任建设',
  '模型能力展示',
  '应用场景展示',
  '文档/API/控制台引导',
  '商业化路径清晰度',
] as const;
