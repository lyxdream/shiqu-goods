<template>
  <div class="page">
    <van-nav-bar :title="isEdit ? '编辑地址' : '新增地址'" left-arrow @click-left="$router.back()" />
    <van-form class="form" @submit="handleSubmit">
      <van-cell-group inset>
        <van-field
          v-model="form.contactName"
          label="联系人"
          placeholder="请输入联系人"
          :rules="[{ required: true, message: '请输入联系人' }]"
        />
        <van-field
          v-model="form.phone"
          label="电话"
          placeholder="请输入联系电话"
          :rules="[{ required: true, message: '请输入电话' }]"
        />
        <van-field
          v-model="form.address"
          rows="3"
          autosize
          type="textarea"
          label="地址"
          placeholder="请输入自提/收货地址"
          :rules="[{ required: true, message: '请输入地址' }]"
        />
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
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { createAddress, getAddressList, updateAddress } from '@/api/address'

const route = useRoute()
const router = useRouter()
const saving = ref(false)
const isEdit = computed(() => !!route.params.id)

const form = reactive({
  contactName: '',
  phone: '',
  address: '',
})

async function loadDetail() {
  if (!isEdit.value) return
  const id = Number(route.params.id)
  const list = await getAddressList()
  const target = list.find((item) => item.id === id)
  if (!target) {
    showToast('地址不存在')
    router.back()
    return
  }
  form.contactName = target.contactName
  form.phone = target.phone
  form.address = target.address
}

async function handleSubmit() {
  saving.value = true
  try {
    if (isEdit.value) {
      await updateAddress(Number(route.params.id), form)
    } else {
      await createAddress(form)
    }
    showToast('保存成功')
    router.replace({ name: 'AddressList' })
  } finally {
    saving.value = false
  }
}

onMounted(loadDetail)
</script>

<style scoped>
.form {
  margin-top: 12px;
}

.actions {
  margin: 24px 16px;
}
</style>
