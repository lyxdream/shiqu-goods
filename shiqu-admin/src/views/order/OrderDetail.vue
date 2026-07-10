<template>
  <el-card v-loading="loading">
    <template #header>
      <div class="card-header">
        <span>订单详情</span>
        <el-button @click="$router.back()">返回</el-button>
      </div>
    </template>

    <template v-if="detail">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="订单ID">{{ detail.id }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-select
            :model-value="detail.status"
            style="width: 160px"
            :loading="statusUpdating"
            @change="handleStatusChange"
          >
            <el-option
              v-for="item in ORDER_STATUS_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-descriptions-item>
        <el-descriptions-item label="联系人">{{ detail.contactName }}</el-descriptions-item>
        <el-descriptions-item label="电话">{{ detail.contactPhone }}</el-descriptions-item>
        <el-descriptions-item label="自提地址" :span="2">
          {{ detail.pickupAddress }}
        </el-descriptions-item>
        <el-descriptions-item label="总价">¥{{ formatPrice(detail.totalAmount) }}</el-descriptions-item>
        <el-descriptions-item label="下单时间">
          {{ formatDateTime(detail.createdAt) }}
        </el-descriptions-item>
      </el-descriptions>

      <h3 class="section-title">商品明细</h3>
      <el-table :data="detail.items" border>
        <el-table-column prop="productName" label="商品" />
        <el-table-column label="单价" width="120">
          <template #default="{ row }">¥{{ formatPrice(row.unitPrice) }}</template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量" width="100" />
      </el-table>
    </template>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getOrderDetail, updateOrderStatus } from '@/api/order'
import { useDetail } from '@/composables/useFormPage'
import { ORDER_STATUS_OPTIONS } from '@/constants/status'
import type { Order } from '@/types'
import { formatDateTime } from '@/utils/date'
import { formatPrice } from '@/utils/money'

const { loading, detail } = useDetail(getOrderDetail)
const statusUpdating = ref(false)

async function handleStatusChange(status: Order['status']) {
  if (!detail.value || status === detail.value.status) return

  const previousStatus = detail.value.status
  statusUpdating.value = true
  try {
    await updateOrderStatus(detail.value.id, status)
    detail.value.status = status
    ElMessage.success('订单状态已更新')
  } catch {
    detail.value.status = previousStatus
  } finally {
    statusUpdating.value = false
  }
}
</script>

<style scoped>
.section-title {
  margin: 24px 0 12px;
  font-size: 16px;
}
</style>
