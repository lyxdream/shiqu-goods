<template>
  <el-card>
    <template #header>
      <div class="card-header">首页</div>
    </template>
    <p>欢迎使用拾趣好物管理后台。</p>
    <el-row :gutter="16" class="stats">
      <el-col v-for="item in DASHBOARD_MENUS" :key="item.path" :span="8">
        <el-card shadow="hover">
          <div class="stat-title">{{ item.title }}</div>
          <el-button type="primary" link @click="$router.push({ name: item.name })">
            进入
          </el-button>
        </el-card>
      </el-col>
    </el-row>
  </el-card>
</template>

<script setup lang="ts">
import { DASHBOARD_MENUS } from '@/constants/menus'
</script>

<style scoped>
.stats {
  margin-top: 20px;
}

.stat-title {
  margin-bottom: 8px;
  font-size: 16px;
}
</style>
