<template>
  <div class="page">
    <van-nav-bar title="修改密码" left-arrow @click-left="$router.back()" />
    <van-form class="form" @submit="handleSubmit">
      <van-cell-group inset>
        <van-field
          v-model="form.oldPassword"
          type="password"
          label="原密码"
          placeholder="请输入原密码"
          :rules="[{ required: true, message: '请输入原密码' }]"
        />
        <van-field
          v-model="form.newPassword"
          type="password"
          label="新密码"
          placeholder="8-12 位，含数字/大小写/下划线中至少三种"
          :rules="[{ required: true, message: '请输入新密码' }]"
        />
        <van-field
          v-model="form.confirmPassword"
          type="password"
          label="确认新密码"
          placeholder="再次输入新密码"
          :rules="[{ required: true, message: '请确认新密码' }]"
        />
      </van-cell-group>
      <div class="actions">
        <van-button round block type="primary" native-type="submit" :loading="saving">
          确认修改
        </van-button>
      </div>
    </van-form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { updatePassword } from '@/api/user'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const saving = ref(false)

const form = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

async function handleSubmit() {
  if (form.newPassword !== form.confirmPassword) {
    showToast('两次密码不一致')
    return
  }
  saving.value = true
  try {
    await updatePassword({
      oldPassword: form.oldPassword,
      newPassword: form.newPassword,
    })
    showToast('修改成功，请重新登录')
    userStore.logout()
    router.replace({ name: 'Login' })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.form {
  margin-top: 12px;
}

.actions {
  margin: 24px 16px;
}
</style>
