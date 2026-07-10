<template>
  <div class="auth-page">
    <van-nav-bar title="注册" left-arrow @click-left="$router.back()" />
    <van-form class="form" @submit="handleSubmit">
      <van-cell-group inset>
        <van-field
          v-model="form.username"
          name="username"
          label="用户名"
          placeholder="字母开头，3-50 位"
          :rules="[
            { required: true, message: '请输入用户名' },
            {
              pattern: /^[a-zA-Z][a-zA-Z0-9]*$/,
              message: '须以字母开头，只能包含字母和数字',
            },
            {
              validator: (val: string) => val.length >= 3 && val.length <= 50,
              message: '长度为 3-50 个字符',
            },
          ]"
        />
        <van-field
          v-model="form.phone"
          name="phone"
          type="tel"
          label="手机号"
          placeholder="11 位手机号"
          maxlength="11"
          :rules="[
            { required: true, message: '请输入手机号' },
            { pattern: /^1\d{10}$/, message: '请输入正确的手机号' },
          ]"
        />
        <van-field
          v-model="form.password"
          type="password"
          name="password"
          label="密码"
          placeholder="至少 6 位"
          :rules="[{ required: true, message: '请输入密码' }]"
        />
        <van-field
          v-model="form.confirmPassword"
          type="password"
          name="confirmPassword"
          label="确认密码"
          placeholder="再次输入密码"
          :rules="[{ required: true, message: '请确认密码' }]"
        />
      </van-cell-group>
      <div class="actions">
        <van-button round block type="primary" native-type="submit" :loading="loading">
          注册并登录
        </van-button>
      </div>
    </van-form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)

const form = reactive({
  username: '',
  phone: '',
  password: '',
  confirmPassword: '',
})

async function handleSubmit() {
  if (form.password !== form.confirmPassword) {
    showToast('两次密码不一致')
    return
  }
  loading.value = true
  try {
    await userStore.register(form)
    showToast('注册成功')
    router.replace({ name: 'Home' })
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

.form {
  margin-top: 16px;
}

.actions {
  margin: 24px 16px 0;
}
</style>
