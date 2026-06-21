import {
  reportQualityCheckSchema,
  standardComparisonDimensions,
  type CompetitiveAnalysisReport,
  type QualityCheckIssue,
  type QualityCheckMetric,
  type ReportQualityCheck,
} from '../schemas/index.js';

export function evaluateReportQuality(
  report: CompetitiveAnalysisReport,
): ReportQualityCheck {
  const metrics: QualityCheckMetric[] = [
    createMetric('dimension_count', report.dimensions.length, 10),
    createMetric('requirement_count', report.requirements.length, 3),
    createMetric(
      'covered_standard_dimension_count',
      countCoveredStandardDimensions(report),
      8,
    ),
    createMetric(
      'dimension_with_self_evidence_count',
      report.dimensions.filter((dimension) => dimension.selfEvidence.length > 0)
        .length,
      report.dimensions.length,
    ),
    createMetric(
      'dimension_with_competitor_evidence_count',
      report.dimensions.filter(
        (dimension) => dimension.competitorEvidence.length > 0,
      ).length,
      report.dimensions.length,
    ),
    createMetric(
      'requirement_with_success_metrics_count',
      report.requirements.filter(
        (requirement) => requirement.successMetrics.length > 0,
      ).length,
      report.requirements.length,
    ),
  ];
  const issues: QualityCheckIssue[] = [];

  for (const metric of metrics) {
    if (!metric.passed) {
      issues.push({
        code: metric.name,
        message: `${metric.name} 未达标：${metric.value}/${metric.threshold}`,
        severity: 'warning',
      });
    }
  }

  for (const dimension of report.dimensions) {
    if (dimension.selfEvidence.some(isWeakEvidence)) {
      issues.push({
        code: 'weak_self_evidence',
        message: `维度「${dimension.dimension}」存在较弱的己方证据`,
        severity: 'info',
      });
    }

    if (dimension.competitorEvidence.some(isWeakEvidence)) {
      issues.push({
        code: 'weak_competitor_evidence',
        message: `维度「${dimension.dimension}」存在较弱的竞品证据`,
        severity: 'info',
      });
    }
  }

  return reportQualityCheckSchema.parse({
    passed: issues.every((issue) => issue.severity !== 'warning' && issue.severity !== 'error'),
    metrics,
    issues,
  });
}

function createMetric(
  name: string,
  value: number,
  threshold: number,
): QualityCheckMetric {
  return {
    name,
    value,
    threshold,
    passed: value >= threshold,
  };
}

function countCoveredStandardDimensions(
  report: CompetitiveAnalysisReport,
): number {
  return standardComparisonDimensions.filter((standardDimension) =>
    report.dimensions.some((dimension) =>
      dimension.dimension.includes(standardDimension),
    ),
  ).length;
}

function isWeakEvidence(value: string): boolean {
  return value.trim().length === 0 || value.includes('无明确证据');
}
