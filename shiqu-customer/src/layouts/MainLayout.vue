<template>
  <div class="page page-with-tabbar">
    <router-view />
    <van-tabbar route safe-area-inset-bottom>
      <van-tabbar-item
        v-for="item in TABBAR_ITEMS"
        :key="String(item.name)"
        replace
        :to="{ name: item.name }"
        :icon="item.icon"
      >
        {{ item.title }}
      </van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup lang="ts">
import { TABBAR_ITEMS } from '@/constants/tabbar'
</script>
