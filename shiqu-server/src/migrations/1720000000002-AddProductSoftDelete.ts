import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductSoftDelete1720000000002 implements MigrationInterface {
  name = 'AddProductSoftDelete1720000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `products` ADD `deleted_at` datetime(6) NULL',
    );
    await queryRunner.query(
      'CREATE INDEX `IDX_products_deleted_at` ON `products` (`deleted_at`)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX `IDX_products_deleted_at` ON `products`',
    );
    await queryRunner.query('ALTER TABLE `products` DROP COLUMN `deleted_at`');
  }
}
