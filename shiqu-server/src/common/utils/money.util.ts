/** 元 → 分（整数，避免浮点误差） */
export function toCents(yuan: number | string): number {
  return Math.round(Number(yuan) * 100);
}

/** 分 → 元 */
export function fromCents(cents: number | string): number {
  return Number(cents) / 100;
}

/** 按分计算行金额 */
export function calcLineAmountCents(
  unitPriceCents: number,
  quantity: number,
): number {
  return unitPriceCents * quantity;
}

export function mapProductToApi<T extends { price: number | string }>(
  product: T,
): T {
  return { ...product, price: fromCents(product.price) };
}

export function mapProductsToApi<T extends { price: number | string }>(
  products: T[],
): T[] {
  return products.map(mapProductToApi);
}

type OrderItemLike = { unitPrice: number | string };
type OrderLike = {
  totalAmount: number | string;
  items?: OrderItemLike[];
};

export function mapOrderToApi<T extends OrderLike>(order: T): T {
  return {
    ...order,
    totalAmount: fromCents(order.totalAmount),
    items: order.items?.map((item) => ({
      ...item,
      unitPrice: fromCents(item.unitPrice),
    })),
  };
}

export function mapOrdersToApi<T extends OrderLike>(orders: T[]): T[] {
  return orders.map(mapOrderToApi);
}

export function mapPageProductsToApi<T extends { price: number | string }>(
  page: { list: T[]; total: number; pageNum: number; pageSize: number },
) {
  return { ...page, list: mapProductsToApi(page.list) };
}

export function mapPageOrdersToApi<T extends OrderLike>(
  page: { list: T[]; total: number; pageNum: number; pageSize: number },
) {
  return { ...page, list: mapOrdersToApi(page.list) };
}
