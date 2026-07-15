import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdminAuditLogs1720000000003 implements MigrationInterface {
  name = 'AddAdminAuditLogs1720000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`admin_audit_logs\` (
        \`id\`             int          NOT NULL AUTO_INCREMENT,
        \`created_at\`     datetime(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\`     datetime(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`admin_id\`       int          NOT NULL,
        \`admin_username\` varchar(50)  NOT NULL,
        \`action\`         varchar(50)  NOT NULL,
        \`target_type\`    varchar(50)  NOT NULL,
        \`target_id\`      int          NOT NULL,
        \`target_label\`   varchar(200) NOT NULL DEFAULT '',
        \`detail\`         json         NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_admin_audit_logs_admin_created\` (\`admin_id\`, \`created_at\`),
        INDEX \`IDX_admin_audit_logs_target\` (\`target_type\`, \`target_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `admin_audit_logs`');
  }
}
