import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type {
  AgentTraceRunModeV1,
  AgentTraceV1,
  AnalysisTaskResultV1,
  AnalysisTaskRunStatus,
} from '@product-intelligence-agent/shared';

@Entity({ name: 'analysis_task_runs' })
export class AnalysisTaskRunEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'task_id', type: 'uuid' })
  taskId!: string;

  @Column({ name: 'workflow_id', type: 'varchar', length: 120 })
  workflowId!: string;

  @Column({ name: 'workflow_version', type: 'varchar', length: 120 })
  workflowVersion!: string;

  @Column({ type: 'varchar', length: 40 })
  mode!: AgentTraceRunModeV1;

  @Column({ type: 'varchar', length: 40 })
  status!: AnalysisTaskRunStatus;

  @Column({ type: 'jsonb', nullable: true })
  result!: AnalysisTaskResultV1 | Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  trace!: AgentTraceV1 | Record<string, unknown> | null;

  @Column({ name: 'error_code', type: 'varchar', length: 120, nullable: true })
  errorCode!: string | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @Column({ name: 'started_at', type: 'timestamptz' })
  startedAt!: Date;

  @Column({ name: 'ended_at', type: 'timestamptz', nullable: true })
  endedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
