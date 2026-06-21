import { z } from 'zod';

export const productHtmlInputSchema = z.object({
  name: z.string().trim().min(1, '产品名称不能为空'),
  htmlFile: z.string().trim().min(1, 'HTML 文件名不能为空'),
});

export const analysisPreferencesSchema = z
  .object({
    language: z.string().trim().min(1).default('zh-CN'),
    scoreScale: z.literal('1-10').default('1-10'),
    requireEvidence: z.boolean().default(true),
  })
  .default({
    language: 'zh-CN',
    scoreScale: '1-10',
    requireEvidence: true,
  });

export const competitiveAnalysisTaskSchema = z.object({
  rolePerspective: z.string().trim().min(1, '分析视角不能为空'),
  selfProduct: productHtmlInputSchema,
  competitorProduct: productHtmlInputSchema,
  objective: z.string().trim().min(1, '分析目标不能为空'),
  analysisPreferences: analysisPreferencesSchema,
});

export type ProductHtmlInput = z.infer<typeof productHtmlInputSchema>;
export type AnalysisPreferences = z.infer<typeof analysisPreferencesSchema>;
export type CompetitiveAnalysisTask = z.infer<
  typeof competitiveAnalysisTaskSchema
>;

export function parseCompetitiveAnalysisTask(
  input: unknown,
): CompetitiveAnalysisTask {
  return competitiveAnalysisTaskSchema.parse(input);
}
