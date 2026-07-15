<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>商品管理</span>
        <el-button type="primary" @click="$router.push({ name: 'ProductCreate' })">
          新增商品
        </el-button>
      </div>
    </template>

    <el-form :inline="true" :model="query" class="search-form">
      <el-form-item label="商品名称">
        <el-input v-model="query.name" clearable placeholder="请输入商品名称" />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" clearable placeholder="全部" style="width: 140px">
          <el-option
            v-for="item in PRODUCT_STATUS_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="search">查询</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="list" border>
      <el-table-column label="商品编号" width="140">
        <template #default="{ row }">{{ row.productNo }}</template>
      </el-table-column>
      <el-table-column label="图片" width="90">
        <template #default="{ row }">
          <el-image
            v-if="row.image"
            :src="resolveAssetUrl(row.image)"
            style="width: 48px; height: 48px"
            fit="cover"
          />
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="名称" min-width="140" />
      <el-table-column label="价格" width="100">
        <template #default="{ row }">¥{{ formatPrice(row.price) }}</template>
      </el-table-column>
      <el-table-column prop="stock" label="库存" width="90" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getProductStatusMeta(row.status).tagType">
            {{ getProductStatusMeta(row.status).label }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="240" fixed="right">
        <template #default="{ row }">
          <el-button
            type="primary"
            link
            @click="$router.push({ name: 'ProductEdit', params: { id: row.id } })"
          >
            编辑
          </el-button>
          <el-button type="warning" link @click="toggleStatus(row)">
            {{ row.status === 'on_sale' ? '下架' : '上架' }}
          </el-button>
          <el-button type="danger" link @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <TablePagination
      v-model:page-num="query.pageNum"
      v-model:page-size="query.pageSize"
      :total="total"
      @page-change="fetchList"
      @size-change="search"
    />
  </el-card>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  deleteProduct,
  getProductList,
  updateProductStatus,
  type ProductListQuery,
} from '@/api/product'
import TablePagination from '@/components/TablePagination.vue'
import { useTable } from '@/composables/useTable'
import { getProductStatusMeta, PRODUCT_STATUS_OPTIONS } from '@/constants/status'
import type { Product } from '@/types'
import { applyStatusChange } from '@/utils/status'
import { resolveAssetUrl } from '@/utils/url'
import { formatPrice } from '@/utils/money'

const { loading, list, total, query, fetchList, search } = useTable<
  Product,
  ProductListQuery
>(getProductList, {
  pageNum: 1,
  pageSize: 10,
  name: '',
  status: '',
})

function toggleStatus(row: Product) {
  const status = row.status === 'on_sale' ? 'off_sale' : 'on_sale'
  return applyStatusChange(() => updateProductStatus(row.id, status), fetchList)
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm(
    '删除后商品将从列表隐藏，历史订单数据不受影响。存在未完结订单时将无法删除。确认删除吗？',
    '提示',
    { type: 'warning' },
  )
  try {
    await deleteProduct(id)
    ElMessage.success('删除成功')
    fetchList()
  } catch {
    // 错误信息由 request 拦截器统一提示
  }
}
</script>
