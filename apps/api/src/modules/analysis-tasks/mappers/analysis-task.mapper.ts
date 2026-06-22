import type {
  AnalysisTaskDto,
  AnalysisTaskListItemDto,
} from '@product-intelligence-agent/shared';
import type { AnalysisTaskEntity } from '../entities/analysis-task.entity';

export function toAnalysisTaskDto(task: AnalysisTaskEntity): AnalysisTaskDto {
  return {
    id: task.id,
    title: task.title,
    productName: task.productName,
    competitorName: task.competitorName,
    analysisGoal: task.analysisGoal,
    sourceType: task.sourceType,
    input: task.input,
    status: task.status,
    result: task.result,
    trace: task.trace,
    errorMessage: task.errorMessage,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

export function toAnalysisTaskListItemDto(
  task: AnalysisTaskEntity,
): AnalysisTaskListItemDto {
  return {
    id: task.id,
    title: task.title,
    productName: task.productName,
    competitorName: task.competitorName,
    analysisGoal: task.analysisGoal,
    sourceType: task.sourceType,
    status: task.status,
    errorMessage: task.errorMessage,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}
