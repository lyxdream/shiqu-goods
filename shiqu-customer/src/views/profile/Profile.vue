<template>
  <div>
    <van-nav-bar title="我的" />
    <div class="section-card profile-head">
      <van-image
        round
        width="56"
        height="56"
        :src="avatarUrl"
        fit="cover"
      />
      <div class="info">
        <div class="name">{{ profile?.nickname || userStore.username || '未登录' }}</div>
        <div class="muted">{{ profile?.phone || '暂无手机号' }}</div>
      </div>
    </div>

    <van-cell-group inset>
      <van-cell title="编辑资料" is-link to="/profile/edit" />
      <van-cell title="修改密码" is-link to="/profile/password" />
      <van-cell title="收货地址" is-link to="/addresses" />
      <van-cell
        title="购物 AI 助手"
        label="商品推荐、购物流程与订单问题"
        is-link
        to="/ai/chat?scene=assistant"
      />
      <van-cell
        title="采购清单凑单"
        label="输入清单，对照站内商品一键凑单"
        is-link
        to="/ai/chat?scene=purchase_list"
      />
    </van-cell-group>

    <div class="actions">
      <van-button round block type="danger" plain @click="handleLogout">退出登录</van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showConfirmDialog } from 'vant'
import type { UserProfile } from '@/types'
import { useUserStore } from '@/stores/user'
import { resolveAssetUrl } from '@/utils/url'

const router = useRouter()
const userStore = useUserStore()
const profile = ref<UserProfile | null>(null)

const avatarUrl = computed(
  () =>
    resolveAssetUrl(profile.value?.avatar) ||
    'data:image/svg+xml,' +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56"><rect fill="#07c160" width="56" height="56"/><text x="28" y="34" text-anchor="middle" fill="#fff" font-size="18">拾</text></svg>',
      ),
)

onMounted(async () => {
  profile.value = await userStore.fetchProfile()
})

async function handleLogout() {
  await showConfirmDialog({ title: '确认退出登录？' })
  userStore.logout()
  router.replace({ name: 'Login' })
}
</script>

<style scoped>
.profile-head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.name {
  font-size: 20px;
  font-weight: 600;
}

.actions {
  margin: 24px 16px;
}
</style>
