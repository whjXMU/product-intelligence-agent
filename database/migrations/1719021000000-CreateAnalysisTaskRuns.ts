interface MigrationQueryRunner {
  query(query: string): Promise<unknown>;
}

export class CreateAnalysisTaskRuns1719021000000 {
  name = 'CreateAnalysisTaskRuns1719021000000';

  async up(queryRunner: MigrationQueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "analysis_task_runs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "task_id" uuid NOT NULL,
        "workflow_id" character varying(120) NOT NULL,
        "workflow_version" character varying(120) NOT NULL,
        "mode" character varying(40) NOT NULL,
        "status" character varying(40) NOT NULL,
        "result" jsonb,
        "trace" jsonb,
        "error_code" character varying(120),
        "error_message" text,
        "started_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "ended_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_analysis_task_runs_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_analysis_task_runs_task_id" FOREIGN KEY ("task_id")
          REFERENCES "analysis_tasks" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_analysis_task_runs_task_id_created_at"
      ON "analysis_task_runs" ("task_id", "created_at")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_analysis_task_runs_status"
      ON "analysis_task_runs" ("status")
    `);
  }

  async down(queryRunner: MigrationQueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "IDX_analysis_task_runs_status"');
    await queryRunner.query(
      'DROP INDEX "IDX_analysis_task_runs_task_id_created_at"',
    );
    await queryRunner.query('DROP TABLE "analysis_task_runs"');
  }
}
