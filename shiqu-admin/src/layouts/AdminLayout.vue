<template>
  <el-container class="admin-layout">
    <el-aside width="220px" class="aside">
      <div class="logo">拾趣好物 · 管理端</div>
      <el-menu :default-active="activeMenu" router class="aside-menu">
        <el-menu-item v-for="item in MENUS" :key="item.path" :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.title }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-title">{{ currentTitle }}</div>
        <div class="header-actions">
          <span class="username">{{ displayName }}</span>
          <el-button type="danger" link @click="handleLogout">退出登录</el-button>
        </div>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { MENUS } from '@/constants/menus'
import { useAdminStore } from '@/stores/admin'

const route = useRoute()
const router = useRouter()
const adminStore = useAdminStore()
const { username } = storeToRefs(adminStore)

const activeMenu = computed(() => {
  const hit = MENUS.filter(
    (item) =>
      route.path === item.path || route.path.startsWith(`${item.path}/`),
  ).sort((a, b) => b.path.length - a.path.length)[0]

  return hit?.path ?? route.path
})

const currentTitle = computed(
  () => (route.meta.title as string | undefined) || '管理后台',
)

const displayName = computed(() => username.value || '管理员')

function handleLogout() {
  adminStore.logout()
  router.push({ name: 'Login' })
}
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
}

.aside {
  background: #1f2d3d;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.aside-menu {
  border-right: none;
  --el-menu-bg-color: #1f2d3d;
  --el-menu-text-color: #bfcbd9;
  --el-menu-active-color: #409eff;
  --el-menu-hover-bg-color: rgba(255, 255, 255, 0.06);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.username {
  color: #606266;
}

.main {
  background: #f5f7fa;
}
</style>
