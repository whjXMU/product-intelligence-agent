interface MigrationQueryRunner {
  query(query: string): Promise<unknown>;
}

export class CreateAnalysisSessions1792800000000 {
  name = 'CreateAnalysisSessions1792800000000';

  async up(queryRunner: MigrationQueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await queryRunner.query(`
      CREATE TABLE "analysis_sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying(200) NOT NULL,
        "status" character varying(40) NOT NULL DEFAULT 'drafting',
        "messages" jsonb NOT NULL,
        "brief_draft" jsonb,
        "result_text" text,
        "report_draft" jsonb,
        "trace" jsonb,
        "error_message" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_analysis_sessions_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_analysis_sessions_updated_at"
      ON "analysis_sessions" ("updated_at")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_analysis_sessions_status"
      ON "analysis_sessions" ("status")
    `);
  }

  async down(queryRunner: MigrationQueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "IDX_analysis_sessions_status"');
    await queryRunner.query('DROP INDEX "IDX_analysis_sessions_updated_at"');
    await queryRunner.query('DROP TABLE "analysis_sessions"');
  }
}
