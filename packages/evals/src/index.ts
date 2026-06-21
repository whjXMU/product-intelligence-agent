export interface EvaluationCase {
  id: string;
  name: string;
  input: unknown;
  expectedSignals: string[];
}

export const evalsPackagePurpose =
  '预留 Agent 输出质量评估、回归样例和分析质量评分脚本的位置。';
