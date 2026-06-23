import type { AnalysisTaskRunDto } from '@product-intelligence-agent/shared';
import type { AnalysisTaskRunEntity } from '../entities/analysis-task-run.entity';

export function toAnalysisTaskRunDto(
  run: AnalysisTaskRunEntity,
): AnalysisTaskRunDto {
  return {
    id: run.id,
    taskId: run.taskId,
    workflowId: run.workflowId,
    workflowVersion: run.workflowVersion,
    mode: run.mode,
    status: run.status,
    result: run.result,
    trace: run.trace,
    errorCode: run.errorCode,
    errorMessage: run.errorMessage,
    startedAt: run.startedAt.toISOString(),
    endedAt: run.endedAt?.toISOString() ?? null,
    createdAt: run.createdAt.toISOString(),
    updatedAt: run.updatedAt.toISOString(),
  };
}
