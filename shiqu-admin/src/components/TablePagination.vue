<template>
  <div class="table-pagination">
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="currentPageSize"
      :total="total"
      :page-sizes="pageSizes"
      :layout="layout"
      background
      @current-change="emit('page-change')"
      @size-change="emit('size-change')"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    pageNum: number
    pageSize: number
    total: number
    pageSizes?: number[]
    layout?: string
  }>(),
  {
    pageSizes: () => [10, 20, 50, 100],
    layout: 'total, sizes, prev, pager, next, jumper',
  },
)

const emit = defineEmits<{
  'update:pageNum': [value: number]
  'update:pageSize': [value: number]
  'page-change': []
  'size-change': []
}>()

const currentPage = computed({
  get: () => props.pageNum,
  set: (value) => emit('update:pageNum', value),
})

const currentPageSize = computed({
  get: () => props.pageSize,
  set: (value) => emit('update:pageSize', value),
})
</script>
