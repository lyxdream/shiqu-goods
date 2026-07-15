/** 与数据库列定义对齐的字段长度（varchar / text） */
export const FieldLength = {
  PRODUCT_NAME: 100,
  PRODUCT_IMAGE: 500,
  /** MySQL TEXT 上限（字节），与 products.description 列一致 */
  PRODUCT_DESCRIPTION: 65535,
  ADDRESS_CONTACT_NAME: 50,
  ADDRESS_PHONE: 20,
  /** MySQL TEXT 上限，与 addresses.address 列一致 */
  ADDRESS_DETAIL: 65535,
} as const;
