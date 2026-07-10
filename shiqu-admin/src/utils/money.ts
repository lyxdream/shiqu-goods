/** 将 API 返回的元格式化为展示字符串 */
export function formatPrice(yuan: number | string): string {
  const value = Number(yuan);
  if (Number.isNaN(value)) return '0.00';
  return value.toFixed(2);
}
