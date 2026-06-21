import type { CompetitiveAnalysisReport } from '../schemas/index.js';

export function renderMarkdownReport(report: CompetitiveAnalysisReport): string {
  const lines: string[] = [];

  lines.push(`# ${report.task.selfProduct.name} vs ${report.task.competitorProduct.name} 官网首页竞品分析`);
  lines.push('');
  lines.push(`分析视角：${report.task.rolePerspective}`);
  lines.push('');
  lines.push('## 总体结论');
  lines.push('');
  lines.push(report.summary.conclusion);
  lines.push('');
  lines.push(`- ${report.task.selfProduct.name} 综合评分：${report.summary.selfOverallScore}/10`);
  lines.push(`- ${report.task.competitorProduct.name} 综合评分：${report.summary.competitorOverallScore}/10`);
  lines.push('');
  lines.push('## 关键差距');
  lines.push('');
  for (const gap of report.summary.keyGaps) {
    lines.push(`- ${gap}`);
  }
  lines.push('');
  lines.push('## 维度评分');
  lines.push('');
  lines.push('| 维度 | 己方 | 竞品 | 胜出方 | 严重度 |');
  lines.push('| --- | ---: | ---: | --- | --- |');
  for (const item of report.dimensions) {
    lines.push(
      `| ${item.dimension} | ${item.selfScore} | ${item.competitorScore} | ${renderWinner(item.winner)} | ${item.severity} |`,
    );
  }
  lines.push('');
  for (const item of report.dimensions) {
    lines.push(`### ${item.dimension}`);
    lines.push('');
    lines.push(item.reason);
    lines.push('');
    lines.push(`差距：${item.gap}`);
    lines.push('');
    lines.push(`己方证据：${item.selfEvidence.join('；') || '无明确证据'}`);
    lines.push('');
    lines.push(`竞品证据：${item.competitorEvidence.join('；') || '无明确证据'}`);
    lines.push('');
  }
  lines.push('## 产品优化需求');
  lines.push('');
  for (const requirement of report.requirements) {
    lines.push(`### ${requirement.priority} ${requirement.title}`);
    lines.push('');
    lines.push(`问题：${requirement.problem}`);
    lines.push('');
    lines.push(`用户价值：${requirement.userValue}`);
    lines.push('');
    lines.push(`方案：${requirement.proposedSolution}`);
    lines.push('');
    lines.push(`竞品参考：${requirement.competitorReference}`);
    lines.push('');
    lines.push(`成功指标：${requirement.successMetrics.join('；')}`);
    lines.push('');
    lines.push(`实现说明：${requirement.implementationNotes}`);
    lines.push('');
  }
  lines.push('## 风险和假设');
  lines.push('');
  for (const risk of report.risksAndAssumptions) {
    lines.push(`- ${risk}`);
  }
  lines.push('');

  return lines.join('\n');
}

function renderWinner(winner: 'self' | 'competitor' | 'tie'): string {
  if (winner === 'self') {
    return '己方';
  }

  if (winner === 'competitor') {
    return '竞品';
  }

  return '持平';
}
