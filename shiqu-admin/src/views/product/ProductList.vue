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
      <el-table-column prop="id" label="ID" width="80" />
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
      <el-table-column prop="price" label="价格" width="100" />
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

    <div class="pager">
      <el-pagination
        v-model:current-page="query.pageNum"
        v-model:page-size="query.pageSize"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        :total="total"
        @current-change="fetchList"
        @size-change="search"
      />
    </div>
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
import { useTable } from '@/composables/useTable'
import { getProductStatusMeta, PRODUCT_STATUS_OPTIONS } from '@/constants/status'
import type { Product } from '@/types'
import { applyStatusChange } from '@/utils/status'
import { resolveAssetUrl } from '@/utils/url'

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
  await ElMessageBox.confirm('确认删除该商品吗？', '提示', { type: 'warning' })
  await deleteProduct(id)
  ElMessage.success('删除成功')
  fetchList()
}
</script>
