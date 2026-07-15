import { OrderStatusEnum, UNFINISHED_ORDER_STATUSES } from 'src/common/enums';
import { OrderItem } from 'src/modules/order/entities/order-item.entity';
import { EntityManager } from 'typeorm';

export type ProductReservedStock = {
  pendingReserved: number;
  paidReserved: number;
  reservedStock: number;
};

export async function getProductReservedStock(
  manager: EntityManager,
  productId: number,
): Promise<ProductReservedStock> {
  const rows = await manager
    .createQueryBuilder(OrderItem, 'item')
    .innerJoin('item.order', 'order')
    .select('order.status', 'status')
    .addSelect('COALESCE(SUM(item.quantity), 0)', 'qty')
    .where('item.productId = :productId', { productId })
    .andWhere('order.status IN (:...statuses)', {
      statuses: UNFINISHED_ORDER_STATUSES,
    })
    .groupBy('order.status')
    .getRawMany<{ status: OrderStatusEnum; qty: string }>();

  let pendingReserved = 0;
  let paidReserved = 0;
  for (const row of rows) {
    const qty = Number(row.qty);
    if (row.status === OrderStatusEnum.PENDING_PAYMENT) {
      pendingReserved = qty;
    } else if (row.status === OrderStatusEnum.PAID) {
      paidReserved = qty;
    }
  }

  return {
    pendingReserved,
    paidReserved,
    reservedStock: pendingReserved + paidReserved,
  };
}

/** 实物库存 → 可售库存（扣除未完结订单预占） */
export function toSellableStock(
  physicalStock: number,
  reservedStock: number,
): number {
  return Math.max(0, physicalStock - reservedStock);
}

/** 可售库存 → 实物库存（管理端展示） */
export function toPhysicalStock(
  sellableStock: number,
  reservedStock: number,
): number {
  return sellableStock + reservedStock;
}
