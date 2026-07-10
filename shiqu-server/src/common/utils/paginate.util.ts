import { SelectQueryBuilder, ObjectLiteral } from 'typeorm';

export interface PageResult<T> {
  list: T[];
  total: number;
  pageNum: number;
  pageSize: number;
}

export interface PageParams {
  pageNum?: number;
  pageSize?: number;
}

export function normalizePage(params: PageParams) {
  const pageNum = Math.max(1, Number(params.pageNum) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(params.pageSize) || 10));
  return { pageNum, pageSize };
}

export async function paginate<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  params: PageParams,
): Promise<PageResult<T>> {
  const { pageNum, pageSize } = normalizePage(params);
  qb.skip((pageNum - 1) * pageSize).take(pageSize);
  const [list, total] = await qb.getManyAndCount();
  return { list, total, pageNum, pageSize };
}
