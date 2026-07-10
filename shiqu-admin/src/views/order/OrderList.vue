<template>
  <el-card>
    <template #header>
      <div class="card-header">订单管理</div>
    </template>

    <el-form :inline="true" :model="query" class="search-form">
      <el-form-item label="状态">
        <el-select v-model="query.status" clearable placeholder="全部" style="width: 160px">
          <el-option
            v-for="item in ORDER_STATUS_OPTIONS"
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
      <el-table-column prop="id" label="订单ID" width="90" />
      <el-table-column prop="contactName" label="联系人" width="120" />
      <el-table-column prop="contactPhone" label="电话" width="140" />
      <el-table-column label="总价" width="100">
        <template #default="{ row }">¥{{ formatPrice(row.totalAmount) }}</template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="110">
        <template #default="{ row }">
          <el-tag :type="getOrderStatusMeta(row.status).tagType">
            {{ getOrderStatusMeta(row.status).label }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="下单时间" min-width="170">
        <template #default="{ row }">
          {{ formatDateTime(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button
            type="primary"
            link
            @click="$router.push({ name: 'OrderDetail', params: { id: row.id } })"
          >
            详情
          </el-button>
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
import { getOrderList, type OrderListQuery } from '@/api/order'
import TablePagination from '@/components/TablePagination.vue'
import { useTable } from '@/composables/useTable'
import { getOrderStatusMeta, ORDER_STATUS_OPTIONS } from '@/constants/status'
import type { Order } from '@/types'
import { formatDateTime } from '@/utils/date'
import { formatPrice } from '@/utils/money'

const { loading, list, total, query, fetchList, search } = useTable<
  Order,
  OrderListQuery
>(getOrderList, {
  pageNum: 1,
  pageSize: 10,
  status: '',
})
</script>
