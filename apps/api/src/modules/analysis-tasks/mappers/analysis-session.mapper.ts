import type {
  AnalysisSessionDto,
  AnalysisSessionListItemDto,
} from '@product-intelligence-agent/shared';
import type { AnalysisSessionEntity } from '../entities/analysis-session.entity';

export function toAnalysisSessionDto(
  session: AnalysisSessionEntity,
): AnalysisSessionDto {
  return {
    id: session.id,
    title: session.title,
    status: session.status,
    messages: session.messages,
    briefDraft: session.briefDraft,
    resultText: session.resultText,
    reportDraft: session.reportDraft,
    trace: session.trace,
    errorMessage: session.errorMessage,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  };
}

export function toAnalysisSessionListItemDto(
  session: AnalysisSessionEntity,
): AnalysisSessionListItemDto {
  return {
    id: session.id,
    title: session.title,
    status: session.status,
    resultText: session.resultText,
    errorMessage: session.errorMessage,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  };
}
