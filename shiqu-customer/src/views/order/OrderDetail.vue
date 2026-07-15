<template>
  <div class="page">
    <van-nav-bar title="订单详情" left-arrow @click-left="$router.back()" />

    <template v-if="order">
      <div class="section-card">
        <div class="row">
          <span>订单状态</span>
          <van-tag :type="getOrderStatusMeta(order.status).type">
            {{ getOrderStatusMeta(order.status).label }}
          </van-tag>
        </div>
        <div class="muted">订单号 {{ order.orderNo }}</div>
        <div class="muted">下单时间 {{ formatDateTime(order.createdAt) }}</div>
      </div>

      <div class="section-card">
        <div class="label">自提信息</div>
        <div>{{ order.contactName }} {{ order.contactPhone }}</div>
        <div class="muted">{{ order.pickupAddress }}</div>
      </div>

      <div class="section-card">
        <div class="label">商品明细</div>
        <div v-for="item in order.items" :key="item.id" class="item-row">
          <div>
            <div>{{ item.productName }}</div>
            <div class="muted">¥{{ formatPrice(item.unitPrice) }} x {{ item.quantity }}</div>
          </div>
          <div>¥{{ formatPrice(Number(item.unitPrice) * item.quantity) }}</div>
        </div>
        <div class="total">合计 ¥{{ formatPrice(order.totalAmount) }}</div>
      </div>

      <div class="actions">
        <van-button
          round
          plain
          type="primary"
          icon="chat-o"
          class="action-btn"
          @click="openOrderHelp"
        >
          咨询
        </van-button>
        <van-button
          v-if="order.status === 'pending_payment'"
          round
          plain
          type="danger"
          class="action-btn"
          :loading="cancelling"
          @click="handleCancel"
        >
          取消订单
        </van-button>
        <van-button
          v-if="order.status === 'pending_payment'"
          round
          type="primary"
          class="action-btn"
          :loading="paying"
          @click="handlePay"
        >
          模拟付款
        </van-button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showConfirmDialog, showToast } from 'vant'
import { getOrderDetail, payOrder, cancelOrder } from '@/api/order'
import { getOrderStatusMeta } from '@/constants/status'
import type { Order } from '@/types'
import { formatDateTime } from '@/utils/date'
import { formatPrice } from '@/utils/money'

const route = useRoute()
const router = useRouter()
const order = ref<Order | null>(null)
const paying = ref(false)
const cancelling = ref(false)

async function fetchDetail() {
  order.value = await getOrderDetail(Number(route.params.id))
}

function openOrderHelp() {
  if (!order.value) return
  router.push({
    name: 'AiChat',
    query: {
      scene: 'order_help',
      orderId: String(order.value.id),
    },
  })
}

async function handlePay() {
  if (!order.value) return
  await showConfirmDialog({ title: '确认模拟付款？' })
  paying.value = true
  try {
    order.value = await payOrder(order.value.id)
    showToast('付款成功')
  } finally {
    paying.value = false
  }
}

async function handleCancel() {
  if (!order.value) return
  await showConfirmDialog({
    title: '确认取消订单？',
    message: '取消后库存将释放，可重新下单',
  })
  cancelling.value = true
  try {
    order.value = await cancelOrder(order.value.id)
    showToast('订单已取消')
  } finally {
    cancelling.value = false
  }
}

onMounted(fetchDetail)
</script>

<style scoped>
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.label {
  margin-bottom: 8px;
  font-weight: 600;
}

.item-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 15px;
  border-bottom: 1px solid #f2f3f5;
}

.total {
  margin-top: 12px;
  font-size: 18px;
  text-align: right;
  color: #ee0a24;
  font-weight: 600;
}

.actions {
  display: flex;
  gap: 8px;
  margin: 24px 16px;
}

.action-btn {
  flex: 1;
  min-width: 0;
  padding: 0 8px;
  font-size: 13px;
}
</style>
