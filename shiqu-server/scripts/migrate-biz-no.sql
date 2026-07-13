-- 业务编号入库：商品 product_no、订单 order_no、发号器 biz_sequences
-- 执行前请备份；若列已存在请跳过对应 ALTER
-- DBeaver：Alt+X 整脚本执行，并 Commit

USE shiqu_goods;

-- 商品编号（列不存在时执行）
-- ALTER TABLE products ADD COLUMN product_no VARCHAR(20) NULL;
UPDATE products SET product_no = CONCAT('100', LPAD(id, 9, '0'))
WHERE product_no IS NULL OR product_no = '';
-- ALTER TABLE products MODIFY COLUMN product_no VARCHAR(20) NOT NULL;
-- ALTER TABLE products ADD UNIQUE KEY uk_products_product_no (product_no);

-- 订单号
-- ALTER TABLE orders ADD COLUMN order_no VARCHAR(32) NULL;
UPDATE orders SET order_no = CONCAT(
  '267',
  DATE_FORMAT(created_at, '%y%m%d'),
  LPAD(id, 10, '0')
) WHERE order_no IS NULL OR order_no = '';
-- ALTER TABLE orders MODIFY COLUMN order_no VARCHAR(32) NOT NULL;
-- ALTER TABLE orders ADD UNIQUE KEY uk_orders_order_no (order_no);

-- 订单明细快照商品编号
-- ALTER TABLE order_items ADD COLUMN product_no VARCHAR(20) NULL;
UPDATE order_items oi
JOIN products p ON p.id = oi.product_id
SET oi.product_no = p.product_no
WHERE oi.product_no IS NULL OR oi.product_no = '';
-- ALTER TABLE order_items MODIFY COLUMN product_no VARCHAR(20) NOT NULL;

-- 发号器表
CREATE TABLE IF NOT EXISTS biz_sequences (
  name VARCHAR(32) NOT NULL PRIMARY KEY,
  value BIGINT NOT NULL DEFAULT 0
);

INSERT INTO biz_sequences (name, value)
SELECT 'product', COALESCE(MAX(CAST(SUBSTRING(product_no, 4) AS UNSIGNED)), 0)
FROM products
ON DUPLICATE KEY UPDATE value = VALUES(value);

INSERT INTO biz_sequences (name, value)
SELECT CONCAT('order_', t.order_date),
       MAX(CAST(SUBSTRING(t.order_no, 10) AS UNSIGNED))
FROM (
  SELECT
    DATE_FORMAT(created_at, '%y%m%d') AS order_date,
    order_no
  FROM orders
  WHERE order_no IS NOT NULL AND order_no != ''
) t
GROUP BY t.order_date
ON DUPLICATE KEY UPDATE value = GREATEST(biz_sequences.value, VALUES(value));
