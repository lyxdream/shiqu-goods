import { onMounted, reactive, ref, type Ref } from 'vue'
import type { PageResult } from '@/types'

type PageQuery = {
  pageNum: number
  pageSize: number
}

export function useTable<T, Q extends PageQuery>(
  fetcher: (query: Q) => Promise<PageResult<T>>,
  defaultQuery: Q,
) {
  const loading = ref(false)
  const list: Ref<T[]> = ref([])
  const total = ref(0)
  const query = reactive(defaultQuery) as Q

  async function fetchList() {
    loading.value = true
    try {
      const data = await fetcher(query)
      list.value = data.list
      total.value = data.total
    } finally {
      loading.value = false
    }
  }

  /** 查询时重置到第一页，避免筛选后停在空页 */
  function search() {
    query.pageNum = 1
    return fetchList()
  }

  onMounted(fetchList)

  return {
    loading,
    list,
    total,
    query,
    fetchList,
    search,
  }
}
