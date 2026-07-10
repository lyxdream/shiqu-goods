<template>
  <div>
    <van-nav-bar title="拾趣好物" />
    <van-empty v-if="!loading && !list.length" description="暂无商品" />
    <div v-else class="product-list">
      <div
        v-for="item in list"
        :key="item.id"
        class="product-card"
        @click="$router.push({ name: 'ProductDetail', params: { id: item.id } })"
      >
        <van-image
          :src="resolveAssetUrl(item.image) || placeholder"
          width="100%"
          height="140"
          fit="cover"
          radius="8"
        />
        <div class="info">
          <div class="name">{{ item.name }}</div>
          <div class="meta">
            <span class="price">¥{{ item.price }}</span>
            <span class="muted">库存 {{ item.stock }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getProductList } from '@/api/product'
import type { Product } from '@/types'
import { resolveAssetUrl } from '@/utils/url'

const loading = ref(false)
const list = ref<Product[]>([])
const placeholder =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="140"><rect fill="#f2f3f5" width="200" height="140"/><text x="100" y="75" text-anchor="middle" fill="#c8c9cc" font-size="14">暂无图片</text></svg>',
  )

async function fetchList() {
  loading.value = true
  try {
    list.value = await getProductList()
  } finally {
    loading.value = false
  }
}

onMounted(fetchList)
</script>

<style scoped>
.product-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 12px;
}

.product-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.info {
  padding: 10px;
}

.name {
  font-size: 15px;
  line-height: 1.4;
  height: 42px;
  overflow: hidden;
}

.meta {
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.price {
  color: #ee0a24;
  font-weight: 600;
}
</style>
