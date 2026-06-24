import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type {
  AnalysisSessionMessage,
  AnalysisSessionStatus,
} from '@product-intelligence-agent/shared';

@Entity({ name: 'analysis_sessions' })
export class AnalysisSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'varchar', length: 40, default: 'drafting' })
  status!: AnalysisSessionStatus;

  @Column({ type: 'jsonb' })
  messages!: AnalysisSessionMessage[];

  @Column({ name: 'brief_draft', type: 'jsonb', nullable: true })
  briefDraft!: Record<string, unknown> | null;

  @Column({ name: 'result_text', type: 'text', nullable: true })
  resultText!: string | null;

  @Column({ name: 'report_draft', type: 'jsonb', nullable: true })
  reportDraft!: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  trace!: Record<string, unknown>[] | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
