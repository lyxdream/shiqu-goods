/** 金额按分计算，避免浮点误差 */
export function toCents(amount: number | string): number {
  return Math.round(Number(amount) * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

export function calcLineAmount(
  unitPrice: number | string,
  quantity: number,
): number {
  return fromCents(toCents(unitPrice) * quantity);
}
