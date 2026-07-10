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
          placeholder="至少 6 位"
          :rules="[{ required: true, message: '请输入新密码' }]"
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
})

async function handleSubmit() {
  if (form.newPassword.length < 6) {
    showToast('新密码至少 6 位')
    return
  }
  saving.value = true
  try {
    await updatePassword(form)
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
