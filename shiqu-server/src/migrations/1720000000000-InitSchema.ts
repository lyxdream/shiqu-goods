import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1720000000000 implements MigrationInterface {
  name = 'InitSchema1720000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`users\` (
        \`id\`         int          NOT NULL AUTO_INCREMENT,
        \`created_at\` datetime(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`username\`   varchar(50)  NOT NULL,
        \`password\`   varchar(255) NOT NULL,
        \`nickname\`   varchar(50)  NOT NULL DEFAULT '',
        \`avatar\`     varchar(500) NOT NULL DEFAULT '',
        \`phone\`      varchar(20)  NOT NULL DEFAULT '',
        \`status\`     enum('enabled','disabled') NOT NULL DEFAULT 'enabled',
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_users_username\` (\`username\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE \`admins\` (
        \`id\`         int          NOT NULL AUTO_INCREMENT,
        \`created_at\` datetime(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`username\`   varchar(50)  NOT NULL,
        \`password\`   varchar(255) NOT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_admins_username\` (\`username\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE \`biz_sequences\` (
        \`name\`  varchar(32) NOT NULL,
        \`value\` bigint      NOT NULL DEFAULT 0,
        PRIMARY KEY (\`name\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE \`products\` (
        \`id\`          int          NOT NULL AUTO_INCREMENT,
        \`created_at\`  datetime(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\`  datetime(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`product_no\`  varchar(20)  NOT NULL,
        \`name\`        varchar(100) NOT NULL,
        \`price\`       int          NOT NULL,
        \`stock\`       int          NOT NULL DEFAULT 0,
        \`image\`       varchar(500) NOT NULL DEFAULT '',
        \`description\` text         NULL,
        \`status\`      enum('on_sale','off_sale') NOT NULL DEFAULT 'on_sale',
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_products_product_no\` (\`product_no\`),
        INDEX \`IDX_products_status_created\` (\`status\`, \`created_at\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE \`addresses\` (
        \`id\`           int         NOT NULL AUTO_INCREMENT,
        \`created_at\`   datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\`   datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`user_id\`      int         NOT NULL,
        \`contact_name\` varchar(50) NOT NULL,
        \`phone\`        varchar(20) NOT NULL,
        \`address\`      text        NOT NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_addresses_user_id\` (\`user_id\`),
        CONSTRAINT \`FK_addresses_user_id\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE \`orders\` (
        \`id\`             int         NOT NULL AUTO_INCREMENT,
        \`created_at\`     datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\`     datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`order_no\`       varchar(32) NOT NULL,
        \`user_id\`        int         NOT NULL,
        \`contact_name\`   varchar(50) NOT NULL,
        \`contact_phone\`  varchar(20) NOT NULL,
        \`pickup_address\` text        NOT NULL,
        \`total_amount\`   int         NOT NULL,
        \`status\`         enum('pending_payment','paid','picked_up','cancelled') NOT NULL DEFAULT 'pending_payment',
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_orders_order_no\` (\`order_no\`),
        INDEX \`IDX_orders_user_id_created\` (\`user_id\`, \`created_at\`),
        CONSTRAINT \`FK_orders_user_id\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE \`order_items\` (
        \`id\`           int         NOT NULL AUTO_INCREMENT,
        \`created_at\`   datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\`   datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`order_id\`     int         NOT NULL,
        \`product_id\`   int         NOT NULL,
        \`product_no\`   varchar(20) NOT NULL,
        \`product_name\` varchar(100) NOT NULL,
        \`quantity\`     int         NOT NULL,
        \`unit_price\`   int         NOT NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_order_items_order_id\` (\`order_id\`),
        CONSTRAINT \`FK_order_items_order_id\`   FOREIGN KEY (\`order_id\`)   REFERENCES \`orders\`   (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_order_items_product_id\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\` (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `order_items`');
    await queryRunner.query('DROP TABLE IF EXISTS `addresses`');
    await queryRunner.query('DROP TABLE IF EXISTS `orders`');
    await queryRunner.query('DROP TABLE IF EXISTS `products`');
    await queryRunner.query('DROP TABLE IF EXISTS `biz_sequences`');
    await queryRunner.query('DROP TABLE IF EXISTS `admins`');
    await queryRunner.query('DROP TABLE IF EXISTS `users`');
  }
}
