<template>
  <div class="page">
    <van-nav-bar title="商品详情" left-arrow @click-left="$router.back()" />

    <template v-if="product">
      <van-image
        :src="resolveAssetUrl(product.image) || placeholder"
        width="100%"
        height="280"
        fit="cover"
      />
      <div class="section-card">
        <div class="price">¥{{ formatPrice(product.price) }}</div>
        <div class="name">{{ product.name }}</div>
        <div class="muted">商品编号 {{ product.productNo }}</div>
        <div class="muted">库存 {{ product.stock }}</div>
      </div>
      <div class="section-card">
        <div class="label">商品简介</div>
        <p class="desc">{{ product.description || '暂无简介' }}</p>
      </div>
      <div class="section-card">
        <van-button
          round
          block
          type="primary"
          plain
          icon="chat-o"
          @click="openAiConsult"
        >
          AI 咨询好物
        </van-button>
      </div>
      <div class="section-card">
        <div class="row">
          <span>购买数量</span>
          <van-stepper v-model="quantity" :min="1" :max="Math.max(product.stock, 1)" />
        </div>
      </div>
      <div class="section-card">
        <van-cell
          title="自提地址"
          :value="selectedAddress ? selectedAddress.contactName : '请选择'"
          is-link
          @click="showAddressPicker = true"
        />
        <div v-if="selectedAddress" class="address-preview muted">
          {{ selectedAddress.phone }} · {{ selectedAddress.address }}
        </div>
      </div>
      <div class="bottom-space" />
      <van-submit-bar
        :price="toCents(product.price) * quantity"
        button-text="提交订单"
        :disabled="!product.stock"
        :loading="submitting"
        @submit="handleSubmit"
      />
    </template>

    <van-action-sheet v-model:show="showAddressPicker" title="选择地址">
      <van-cell
        v-for="item in addresses"
        :key="item.id"
        :title="item.contactName"
        :label="`${item.phone} · ${item.address}`"
        clickable
        @click="selectAddress(item)"
      />
      <div class="sheet-actions">
        <van-button
          block
          type="primary"
          plain
          @click="$router.push({ name: 'AddressCreate' })"
        >
          新增地址
        </van-button>
      </div>
    </van-action-sheet>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showConfirmDialog, showToast } from 'vant'
import { getAddressList } from '@/api/address'
import { createOrder } from '@/api/order'
import { getProductDetail } from '@/api/product'
import type { Address, Product } from '@/types'
import { useUserStore } from '@/stores/user'
import { resolveAssetUrl } from '@/utils/url'
import { formatPrice, toCents } from '@/utils/money'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const product = ref<Product | null>(null)
const addresses = ref<Address[]>([])
const selectedAddress = ref<Address | null>(null)
const quantity = ref(1)
const submitting = ref(false)
const showAddressPicker = ref(false)

const placeholder =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="280"><rect fill="#f2f3f5" width="400" height="280"/><text x="200" y="150" text-anchor="middle" fill="#c8c9cc" font-size="16">暂无图片</text></svg>',
  )

function selectAddress(item: Address) {
  selectedAddress.value = item
  showAddressPicker.value = false
}

function openAiConsult() {
  if (!product.value) return
  if (!userStore.isLoggedIn) {
    router.push({
      name: 'Login',
      query: {
        redirect: `/ai/chat?scene=product_qa&productId=${product.value.id}`,
      },
    })
    return
  }
  router.push({
    name: 'AiChat',
    query: {
      scene: 'product_qa',
      productId: String(product.value.id),
    },
  })
}

async function handleSubmit() {
  if (!userStore.isLoggedIn) {
    router.push({ name: 'Login', query: { redirect: route.fullPath } })
    return
  }
  if (!product.value) return
  if (!selectedAddress.value) {
    showToast('请选择自提地址')
    return
  }
  if (product.value.stock < quantity.value) {
    showToast('库存不足')
    return
  }

  await showConfirmDialog({
    title: '确认下单',
    message: `购买 ${product.value.name} x ${quantity.value}`,
  })

  submitting.value = true
  try {
    const order = await createOrder({
      productId: product.value.id,
      quantity: quantity.value,
      addressId: selectedAddress.value.id,
    })
    showToast('下单成功')
    router.replace({ name: 'OrderDetail', params: { id: order.id } })
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  const id = Number(route.params.id)
  product.value = await getProductDetail(id)
  if (userStore.isLoggedIn) {
    addresses.value = await getAddressList()
    selectedAddress.value = addresses.value[0] || null
  }
})
</script>

<style scoped>
.price {
  color: #ee0a24;
  font-size: 24px;
  font-weight: 600;
}

.name {
  margin-top: 8px;
  font-size: 18px;
  font-weight: 600;
}

.label {
  margin-bottom: 8px;
  font-weight: 600;
}

.desc {
  margin: 0;
  font-size: 15px;
  line-height: 1.6;
  color: #646566;
  white-space: pre-wrap;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.address-preview {
  padding: 0 16px 12px;
}

.bottom-space {
  height: 70px;
}

.sheet-actions {
  padding: 12px 16px 24px;
}
</style>
