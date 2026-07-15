<template>
  <div>
    <van-nav-bar title="我的订单" />
    <van-list
      v-model:loading="loadingMore"
      v-model:error="loadError"
      :immediate-check="false"
      error-text="加载失败，点击重试"
      :finished="finished"
      finished-text="没有更多了"
      @load="loadMore"
    >
      <van-empty
        v-if="!loadingMore && !list.length && (finished || loadError)"
        description="暂无订单"
      />
      <div class="list">
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
    </van-list>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getOrderList } from '@/api/order'
import { getOrderStatusMeta } from '@/constants/status'
import type { Order } from '@/types'
import { formatDateTime } from '@/utils/date'
import { formatPrice } from '@/utils/money'

const list = ref<Order[]>([])
const loadingMore = ref(false)
const loadError = ref(false)
const finished = ref(false)
const pageNum = ref(1)
const pageSize = 10
let fetching = false

async function loadMore() {
  if (fetching || finished.value) return
  fetching = true
  loadingMore.value = true
  try {
    const data = await getOrderList({ pageNum: pageNum.value, pageSize })
    list.value.push(...data.list)
    pageNum.value++
    if (list.value.length >= data.total) {
      finished.value = true
    }
  } catch {
    loadError.value = true
  } finally {
    loadingMore.value = false
    fetching = false
  }
}

onMounted(() => {
  loadMore()
})
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
