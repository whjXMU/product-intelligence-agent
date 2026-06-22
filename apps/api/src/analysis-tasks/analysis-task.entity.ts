import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type {
  AnalysisTaskInput,
  AnalysisTaskMockResult,
  AnalysisTaskSourceType,
  AnalysisTaskStatus,
  AnalysisTaskTrace,
} from '@product-intelligence-agent/shared';

@Entity({ name: 'analysis_tasks' })
export class AnalysisTaskEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ name: 'product_name', type: 'varchar', length: 120 })
  productName!: string;

  @Column({ name: 'competitor_name', type: 'varchar', length: 120 })
  competitorName!: string;

  @Column({ name: 'analysis_goal', type: 'text' })
  analysisGoal!: string;

  @Column({ name: 'source_type', type: 'varchar', length: 40 })
  sourceType!: AnalysisTaskSourceType;

  @Column({ type: 'jsonb' })
  input!: AnalysisTaskInput;

  @Column({ type: 'varchar', length: 40, default: 'created' })
  status!: AnalysisTaskStatus;

  @Column({ type: 'jsonb', nullable: true })
  result!: AnalysisTaskMockResult | Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  trace!: AnalysisTaskTrace | Record<string, unknown> | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
