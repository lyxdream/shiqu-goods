import { onMounted, reactive, ref, type Ref } from 'vue'
import { useRoute, useRouter, type RouteLocationRaw } from 'vue-router'
import { ElMessage } from 'element-plus'

/** 详情页：按路由 id 拉取数据并写入 form */
export function useDetailForm<T extends object>(
  createForm: () => T,
  fetcher: (id: number) => Promise<Partial<T>>,
  options?: { skip?: () => boolean },
) {
  const route = useRoute()
  const loading = ref(false)
  const form = reactive(createForm()) as T

  function getId() {
    return Number(route.params.id)
  }

  async function fetchDetail() {
    if (options?.skip?.()) return
    loading.value = true
    try {
      const data = await fetcher(getId())
      Object.assign(form, data)
    } finally {
      loading.value = false
    }
  }

  onMounted(fetchDetail)

  return {
    loading,
    form,
    getId,
    fetchDetail,
  }
}

/** 保存表单：统一 saving / 成功提示 / 跳转 */
export function useSaveForm(
  saveFn: () => Promise<unknown>,
  redirect?: RouteLocationRaw,
) {
  const router = useRouter()
  const saving = ref(false)

  async function handleSave() {
    saving.value = true
    try {
      await saveFn()
      ElMessage.success('保存成功')
      if (redirect) {
        await router.push(redirect)
      }
    } finally {
      saving.value = false
    }
  }

  return {
    saving,
    handleSave,
  }
}

/** 详情页：直接持有整份详情对象 */
export function useDetail<T>(fetcher: (id: number) => Promise<T>) {
  const route = useRoute()
  const loading = ref(false)
  const detail = ref<T | null>(null) as Ref<T | null>

  function getId() {
    return Number(route.params.id)
  }

  async function fetchDetail() {
    loading.value = true
    try {
      detail.value = await fetcher(getId())
    } finally {
      loading.value = false
    }
  }

  onMounted(fetchDetail)

  return {
    loading,
    detail,
    getId,
    fetchDetail,
  }
}
