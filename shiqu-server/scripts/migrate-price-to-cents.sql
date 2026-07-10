-- 将金额字段从「元 decimal」迁移为「分 int」
-- 执行前请备份数据库；若已是分则勿重复执行

USE shiqu_goods;

UPDATE products SET price = ROUND(price * 100);
UPDATE orders SET total_amount = ROUND(total_amount * 100);
UPDATE order_items SET unit_price = ROUND(unit_price * 100);

ALTER TABLE products MODIFY COLUMN price INT NOT NULL;
ALTER TABLE orders MODIFY COLUMN total_amount INT NOT NULL;
ALTER TABLE order_items MODIFY COLUMN unit_price INT NOT NULL;
