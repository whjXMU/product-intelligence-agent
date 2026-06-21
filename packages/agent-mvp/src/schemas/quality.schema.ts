import { z } from 'zod';

export const qualityCheckIssueSchema = z.object({
  code: z.string(),
  message: z.string(),
  severity: z.enum(['info', 'warning', 'error']),
});

export const qualityCheckMetricSchema = z.object({
  name: z.string(),
  value: z.number(),
  threshold: z.number(),
  passed: z.boolean(),
});

export const reportQualityCheckSchema = z.object({
  passed: z.boolean(),
  metrics: z.array(qualityCheckMetricSchema),
  issues: z.array(qualityCheckIssueSchema),
});

export type QualityCheckIssue = z.infer<typeof qualityCheckIssueSchema>;
export type QualityCheckMetric = z.infer<typeof qualityCheckMetricSchema>;
export type ReportQualityCheck = z.infer<typeof reportQualityCheckSchema>;
