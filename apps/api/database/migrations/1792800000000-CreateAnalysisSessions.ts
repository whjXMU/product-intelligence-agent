import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateAnalysisSessions1792800000000
  implements MigrationInterface
{
  name = 'CreateAnalysisSessions1792800000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
    await queryRunner.createTable(
      new Table({
        name: 'analysis_sessions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '200',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '40',
            default: "'drafting'",
          },
          {
            name: 'messages',
            type: 'jsonb',
          },
          {
            name: 'brief_draft',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'result_text',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'report_draft',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'trace',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
          },
        ],
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('analysis_sessions');
  }
}
