interface MigrationQueryRunner {
  query(query: string): Promise<unknown>;
}

export class CreateAnalysisTasks1719020000000 {
  name = 'CreateAnalysisTasks1719020000000';

  async up(queryRunner: MigrationQueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await queryRunner.query(`
      CREATE TABLE "analysis_tasks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying(200) NOT NULL,
        "product_name" character varying(120) NOT NULL,
        "competitor_name" character varying(120) NOT NULL,
        "analysis_goal" text NOT NULL,
        "source_type" character varying(40) NOT NULL,
        "input" jsonb NOT NULL,
        "status" character varying(40) NOT NULL DEFAULT 'created',
        "result" jsonb,
        "trace" jsonb,
        "error_message" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_analysis_tasks_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_analysis_tasks_created_at" ON "analysis_tasks" ("created_at")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_analysis_tasks_status" ON "analysis_tasks" ("status")
    `);
  }

  async down(queryRunner: MigrationQueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "IDX_analysis_tasks_status"');
    await queryRunner.query('DROP INDEX "IDX_analysis_tasks_created_at"');
    await queryRunner.query('DROP TABLE "analysis_tasks"');
  }
}
