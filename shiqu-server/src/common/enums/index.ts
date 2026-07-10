export enum UserStatusEnum {
  ENABLED = 'enabled',
  DISABLED = 'disabled',
}

export enum ProductStatusEnum {
  ON_SALE = 'on_sale',
  OFF_SALE = 'off_sale',
}

export enum OrderStatusEnum {
  PENDING_PAYMENT = 'pending_payment',
  PAID = 'paid',
  PICKED_UP = 'picked_up',
  CANCELLED = 'cancelled',
}

/** 订单状态合法流转 */
export const ORDER_STATUS_TRANSITIONS: Record<
  OrderStatusEnum,
  OrderStatusEnum[]
> = {
  [OrderStatusEnum.PENDING_PAYMENT]: [
    OrderStatusEnum.PAID,
    OrderStatusEnum.CANCELLED,
  ],
  [OrderStatusEnum.PAID]: [
    OrderStatusEnum.PICKED_UP,
    OrderStatusEnum.CANCELLED,
  ],
  [OrderStatusEnum.PICKED_UP]: [],
  [OrderStatusEnum.CANCELLED]: [],
};
