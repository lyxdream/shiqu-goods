<template>
  <div class="page">
    <van-nav-bar
      title="收货地址"
      left-arrow
      @click-left="$router.back()"
    >
      <template #right>
        <span class="link" @click="$router.push({ name: 'AddressCreate' })">新增</span>
      </template>
    </van-nav-bar>

    <van-empty v-if="!loading && !list.length" description="暂无地址" />
    <van-cell-group v-else inset class="list">
      <van-cell
        v-for="item in list"
        :key="item.id"
        :title="item.contactName"
        :label="`${item.phone} · ${item.address}`"
        is-link
        @click="$router.push({ name: 'AddressEdit', params: { id: item.id } })"
      >
        <template #right-icon>
          <van-button size="mini" type="danger" plain @click.stop="handleDelete(item.id)">
            删除
          </van-button>
        </template>
      </van-cell>
    </van-cell-group>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { showConfirmDialog, showToast } from 'vant'
import { deleteAddress, getAddressList } from '@/api/address'
import type { Address } from '@/types'

const loading = ref(false)
const list = ref<Address[]>([])

async function fetchList() {
  loading.value = true
  try {
    list.value = await getAddressList()
  } finally {
    loading.value = false
  }
}

async function handleDelete(id: number) {
  await showConfirmDialog({ title: '确认删除该地址？' })
  await deleteAddress(id)
  showToast('已删除')
  fetchList()
}

onMounted(fetchList)
</script>

<style scoped>
.link {
  color: #07c160;
  font-size: 15px;
}

.list {
  margin-top: 12px;
}
</style>
