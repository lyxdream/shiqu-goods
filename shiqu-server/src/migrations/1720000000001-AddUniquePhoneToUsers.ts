import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniquePhoneToUsers1720000000001 implements MigrationInterface {
  name = 'AddUniquePhoneToUsers1720000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `users` ADD UNIQUE KEY `UQ_users_phone` (`phone`)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `users` DROP INDEX `UQ_users_phone`');
  }
}
