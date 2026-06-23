import type { AnalysisTaskStatus } from '@product-intelligence-agent/shared';

export interface RunnableAnalysisTask {
  id: string;
  status: AnalysisTaskStatus;
}

export class AnalysisTaskAlreadyRunningError extends Error {
  constructor(readonly taskId: string) {
    super('Analysis task is already running');
  }
}

export function canRunAnalysisTask(status: AnalysisTaskStatus): boolean {
  return status !== 'running';
}

export function assertCanRunAnalysisTask(task: RunnableAnalysisTask): void {
  if (!canRunAnalysisTask(task.status)) {
    throw new AnalysisTaskAlreadyRunningError(task.id);
  }
}
