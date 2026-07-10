-- 修复商品价格为「分」（数据丢失后重建用）
-- DBeaver 请用 Alt+X 执行整个脚本，执行后点 Commit 提交

USE shiqu_goods;

UPDATE products SET price = CASE name
  WHEN '黄豆' THEN 500
  WHEN '小米手环 8' THEN 19900
  WHEN 'AirPods Pro 2' THEN 189900
  WHEN '罗技 MX Master 3S' THEN 69900
  WHEN 'iPad Air 11' THEN 479900
  WHEN '机械键盘 青轴' THEN 29900
  WHEN '戴森 V12 吸尘器' THEN 399000
  WHEN '北欧风落地灯' THEN 16800
  WHEN '记忆棉乳胶枕' THEN 8900
  WHEN '不锈钢保温杯 500ml' THEN 5900
  WHEN '云南小粒咖啡豆 1kg' THEN 12800
  WHEN '有机燕麦片 1kg' THEN 3990
  WHEN '进口黑巧克力礼盒' THEN 8800
  WHEN '跑步运动鞋 男款' THEN 39900
  WHEN '瑜伽垫 加厚 10mm' THEN 7900
  WHEN '防晒衣 女款' THEN 12900
  WHEN 'A5 皮质笔记本' THEN 4500
  WHEN '人体工学办公椅' THEN 89900
  WHEN '桌面收纳置物架' THEN 6800
  WHEN '已下架测试商品' THEN 990
  ELSE price
END;

UPDATE order_items oi
JOIN products p ON p.id = oi.product_id
SET oi.unit_price = p.price;

UPDATE orders o
JOIN (
  SELECT order_id, SUM(unit_price * quantity) AS amount
  FROM order_items
  GROUP BY order_id
) t ON t.order_id = o.id
SET o.total_amount = t.amount;

SELECT id, name, price FROM products ORDER BY id;
