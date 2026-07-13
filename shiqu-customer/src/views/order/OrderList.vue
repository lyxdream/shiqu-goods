<template>
  <div>
    <van-nav-bar title="我的订单" />
    <van-empty v-if="!loading && !list.length" description="暂无订单" />
    <div v-else class="list">
      <div
        v-for="item in list"
        :key="item.id"
        class="section-card order-card"
        @click="$router.push({ name: 'OrderDetail', params: { id: item.id } })"
      >
        <div class="row">
          <span>订单号 {{ item.orderNo }}</span>
          <van-tag :type="getOrderStatusMeta(item.status).type">
            {{ getOrderStatusMeta(item.status).label }}
          </van-tag>
        </div>
        <div class="muted">{{ formatDateTime(item.createdAt) }}</div>
        <div class="goods">
          {{ item.items.map((g) => `${g.productName} x${g.quantity}`).join('、') }}
        </div>
        <div class="amount">合计 ¥{{ formatPrice(item.totalAmount) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getOrderList } from '@/api/order'
import { getOrderStatusMeta } from '@/constants/status'
import type { Order } from '@/types'
import { formatDateTime } from '@/utils/date'
import { formatPrice } from '@/utils/money'

const loading = ref(false)
const list = ref<Order[]>([])

async function fetchList() {
  loading.value = true
  try {
    list.value = await getOrderList()
  } finally {
    loading.value = false
  }
}

onMounted(fetchList)
</script>

<style scoped>
.list {
  padding-bottom: 12px;
}

.order-card {
  cursor: pointer;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.goods {
  margin-top: 8px;
  font-size: 15px;
}

.amount {
  margin-top: 8px;
  font-size: 16px;
  text-align: right;
  color: #ee0a24;
  font-weight: 600;
}
</style>
