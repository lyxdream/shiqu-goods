<template>
  <div class="page">
    <van-nav-bar title="编辑资料" left-arrow @click-left="$router.back()" />
    <van-form class="form" @submit="handleSubmit">
      <van-cell-group inset>
        <van-field label="头像">
          <template #input>
            <ImageUpload v-model="form.avatar" />
          </template>
        </van-field>
        <van-field v-model="form.nickname" label="昵称" placeholder="请输入昵称" />
        <van-field v-model="form.phone" label="手机号" placeholder="选填" />
      </van-cell-group>
      <div class="actions">
        <van-button round block type="primary" native-type="submit" :loading="saving">
          保存
        </van-button>
      </div>
    </van-form>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { updateProfile } from '@/api/user'
import ImageUpload from '@/components/ImageUpload.vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const saving = ref(false)

const form = reactive({
  nickname: '',
  avatar: '',
  phone: '',
})

onMounted(async () => {
  const profile = await userStore.fetchProfile()
  form.nickname = profile.nickname
  form.avatar = profile.avatar
  form.phone = profile.phone
})

async function handleSubmit() {
  saving.value = true
  try {
    await updateProfile(form)
    showToast('保存成功')
    router.back()
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
