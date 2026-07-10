<template>
  <div class="auth-page">
    <h1 class="brand">拾趣好物</h1>
    <p class="subtitle">登录后继续购物</p>

    <van-form @submit="handleSubmit">
      <van-cell-group inset>
        <van-field
          v-model="form.username"
          name="username"
          label="账号"
          placeholder="请输入用户名"
          :rules="[{ required: true, message: '请输入用户名' }]"
        />
        <van-field
          v-model="form.password"
          type="password"
          name="password"
          label="密码"
          placeholder="请输入密码"
          :rules="[{ required: true, message: '请输入密码' }]"
        />
      </van-cell-group>
      <div class="forgot-link">
        <span @click="$router.push({ name: 'ForgotPassword' })">忘记密码？</span>
      </div>
      <div class="actions">
        <van-button round block type="primary" native-type="submit" :loading="loading">
          登录
        </van-button>
        <van-button round block plain type="primary" class="mt" @click="$router.push({ name: 'Register' })">
          去注册
        </van-button>
      </div>
    </van-form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
})

async function handleSubmit() {
  loading.value = true
  try {
    await userStore.login(form)
    showToast('登录成功')
    const redirect = (route.query.redirect as string) || '/'
    router.replace(redirect)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  padding: 72px 16px 32px;
  background: linear-gradient(180deg, #e8f8ef 0%, #f7f8fa 40%);
}

.brand {
  margin: 0;
  text-align: center;
  font-size: 32px;
  color: #07c160;
}

.subtitle {
  margin: 8px 0 32px;
  text-align: center;
  font-size: 15px;
  color: #969799;
}

.actions {
  margin: 24px 16px 0;
}

.forgot-link {
  margin: 12px 16px 0;
  text-align: right;
  font-size: 14px;
  color: #07c160;
}

.mt {
  margin-top: 12px;
}
</style>
