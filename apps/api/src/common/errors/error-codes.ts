export const ErrorCodes = {
  CORE_OK: 'core.ok',
  CORE_VALIDATION_FAILED: 'core.validation_failed',
  CORE_NOT_FOUND: 'core.not_found',
  CORE_INTERNAL_ERROR: 'core.internal_error',
  ANALYSIS_TASK_NOT_FOUND: 'analysis_task.not_found',
  ANALYSIS_TASK_ALREADY_RUNNING: 'analysis_task.already_running',
  ANALYSIS_TASK_INPUT_INVALID: 'analysis_task.input_invalid',
  ANALYSIS_TASK_RUN_FAILED: 'analysis_task.run_failed',
  ANALYSIS_TASK_WORKFLOW_RUN_FAILED: 'analysis_task.workflow_run_failed',
  ANALYSIS_SESSION_NOT_FOUND: 'analysis_session.not_found',
  ANALYSIS_SESSION_ALREADY_RUNNING: 'analysis_session.already_running',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
