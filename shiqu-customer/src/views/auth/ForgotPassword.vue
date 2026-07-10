<template>
  <div class="auth-page">
    <van-nav-bar title="忘记密码" left-arrow @click-left="$router.back()" />
    <p class="tip">请输入注册时的用户名和手机号，验证通过后可重置密码</p>

    <van-form class="form" @submit="handleSubmit">
      <van-cell-group inset>
        <van-field
          v-model="form.username"
          name="username"
          label="用户名"
          placeholder="请输入用户名"
          :rules="[{ required: true, message: '请输入用户名' }]"
        />
        <van-field
          v-model="form.phone"
          name="phone"
          type="tel"
          label="手机号"
          placeholder="请输入注册时的手机号"
          maxlength="11"
          :rules="[
            { required: true, message: '请输入手机号' },
            { pattern: /^1\d{10}$/, message: '请输入正确的手机号' },
          ]"
        />
        <van-field
          v-model="form.newPassword"
          type="password"
          name="newPassword"
          label="新密码"
          placeholder="至少 6 位"
          :rules="[{ required: true, message: '请输入新密码' }]"
        />
        <van-field
          v-model="form.confirmPassword"
          type="password"
          name="confirmPassword"
          label="确认密码"
          placeholder="再次输入新密码"
          :rules="[{ required: true, message: '请确认新密码' }]"
        />
      </van-cell-group>
      <div class="actions">
        <van-button round block type="primary" native-type="submit" :loading="loading">
          重置密码
        </van-button>
      </div>
    </van-form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { forgotPassword } from '@/api/auth'

const router = useRouter()
const loading = ref(false)

const form = reactive({
  username: '',
  phone: '',
  newPassword: '',
  confirmPassword: '',
})

async function handleSubmit() {
  if (form.newPassword !== form.confirmPassword) {
    showToast('两次密码不一致')
    return
  }

  loading.value = true
  try {
    await forgotPassword(form)
    showToast('密码已重置，请登录')
    router.replace({ name: 'Login' })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.tip {
  margin: 12px 16px 0;
  font-size: 14px;
  line-height: 1.5;
  color: #969799;
}

.form {
  margin-top: 16px;
}

.actions {
  margin: 24px 16px 0;
}
</style>
