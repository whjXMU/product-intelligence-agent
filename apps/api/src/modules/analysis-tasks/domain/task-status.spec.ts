import type { AnalysisTaskStatus } from '@product-intelligence-agent/shared';
import {
  AnalysisTaskAlreadyRunningError,
  assertCanRunAnalysisTask,
  canRunAnalysisTask,
} from './task-status';

describe('analysis task status rules', () => {
  it.each<AnalysisTaskStatus>(['created', 'completed', 'failed'])(
    'allows %s tasks to run',
    (status) => {
      expect(canRunAnalysisTask(status)).toBe(true);
      expect(() =>
        assertCanRunAnalysisTask({
          id: 'task-1',
          status,
        }),
      ).not.toThrow();
    },
  );

  it('rejects running tasks', () => {
    expect(canRunAnalysisTask('running')).toBe(false);
    expect(() =>
      assertCanRunAnalysisTask({
        id: 'task-1',
        status: 'running',
      }),
    ).toThrow(AnalysisTaskAlreadyRunningError);
  });
});
