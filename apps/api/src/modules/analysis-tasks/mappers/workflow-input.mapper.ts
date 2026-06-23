import {
  analysisTaskAudienceSchema,
  analysisTaskInputV1Schema,
  type AnalysisTaskInputSourceV1,
  type AnalysisTaskInputV1,
} from '@product-intelligence-agent/shared';
import type { AnalysisTaskEntity } from '../entities/analysis-task.entity';

export interface InputMappingIssue {
  path: string;
  message: string;
}

export class InputMappingError extends Error {
  constructor(readonly issues: InputMappingIssue[]) {
    super('Analysis task input cannot be mapped to AnalysisTaskInputV1');
  }
}

export function toWorkflowInputV1(
  task: AnalysisTaskEntity,
): AnalysisTaskInputV1 {
  const rawInput = task.input as Record<string, unknown>;
  const sources: AnalysisTaskInputSourceV1[] = [];
  const selfUrl = readString(rawInput.selfUrl);
  const competitorUrl = readString(rawInput.competitorUrl);
  const notes = readString(rawInput.notes);

  if (selfUrl) {
    sources.push({
      type: 'manual_url',
      role: 'self',
      name: task.productName,
      url: selfUrl,
      notes,
    });
  }

  if (competitorUrl) {
    sources.push({
      type: 'manual_url',
      role: 'competitor',
      name: task.competitorName,
      url: competitorUrl,
      notes,
    });
  }

  if (!selfUrl && !competitorUrl && notes) {
    sources.push({
      type: 'manual_text',
      role: 'self',
      name: task.productName,
      content: notes,
    });
  }

  const input = {
    schemaVersion: 'analysis_task_input.v1',
    subject: {
      productName: task.productName,
      competitorNames: [task.competitorName],
    },
    goal: {
      primaryQuestion: task.analysisGoal,
      focusAreas: readStringArray(rawInput.focusAreas),
      audience: readAudience(rawInput.audience),
    },
    sources,
    outputPreferences: {
      language: readLanguage(rawInput.language),
      detailLevel: readDetailLevel(rawInput.detailLevel),
      includePrdSuggestions: readBoolean(rawInput.includePrdSuggestions, true),
    },
  };

  const parsed = analysisTaskInputV1Schema.safeParse(input);

  if (!parsed.success) {
    throw new InputMappingError(
      parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    );
  }

  return parsed.data;
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function readAudience(value: unknown): AnalysisTaskInputV1['goal']['audience'] {
  const parsed = analysisTaskAudienceSchema.safeParse(value);

  return parsed.success ? parsed.data : 'pm';
}

function readLanguage(
  value: unknown,
): AnalysisTaskInputV1['outputPreferences']['language'] {
  return value === 'en-US' ? 'en-US' : 'zh-CN';
}

function readDetailLevel(
  value: unknown,
): AnalysisTaskInputV1['outputPreferences']['detailLevel'] {
  return value === 'brief' || value === 'deep' ? value : 'standard';
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}
