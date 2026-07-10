<template>
  <el-card v-loading="loading">
    <template #header>
      <div class="card-header">编辑用户</div>
    </template>

    <el-form :model="form" label-width="90px" style="max-width: 520px">
      <el-form-item label="用户名">
        <el-input v-model="form.username" disabled />
      </el-form-item>
      <el-form-item label="昵称">
        <el-input v-model="form.nickname" />
      </el-form-item>
      <el-form-item label="手机号">
        <el-input v-model="form.phone" />
      </el-form-item>
      <el-form-item label="头像 URL">
        <el-input v-model="form.avatar" placeholder="可填上传后的图片地址" />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="form.status" style="width: 200px">
          <el-option
            v-for="item in USER_STATUS_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
        <el-button @click="$router.back()">返回</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { getUserDetail, updateUser } from '@/api/user'
import { useDetailForm, useSaveForm } from '@/composables/useFormPage'
import { USER_STATUS_OPTIONS } from '@/constants/status'
import type { AdminUser } from '@/types'

const { loading, form, getId } = useDetailForm(
  () => ({
    username: '',
    nickname: '',
    phone: '',
    avatar: '',
    status: 'enabled' as AdminUser['status'],
  }),
  async (id) => {
    const data = await getUserDetail(id)
    return {
      username: data.username,
      nickname: data.nickname,
      phone: data.phone,
      avatar: data.avatar,
      status: data.status,
    }
  },
)

const { saving, handleSave } = useSaveForm(
  () =>
    updateUser(getId(), {
      nickname: form.nickname,
      phone: form.phone,
      avatar: form.avatar,
      status: form.status,
    }),
  { name: 'UserList' },
)
</script>
