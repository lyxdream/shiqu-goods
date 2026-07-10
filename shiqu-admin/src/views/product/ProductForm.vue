<template>
  <el-card v-loading="loading">
    <template #header>
      <div class="card-header">{{ isEdit ? '编辑商品' : '新增商品' }}</div>
    </template>

    <el-form :model="form" label-width="90px" style="max-width: 640px">
      <el-form-item label="商品名称" required>
        <el-input v-model="form.name" />
      </el-form-item>
      <el-form-item label="价格" required>
        <el-input-number v-model="form.price" :min="0" :precision="2" />
      </el-form-item>
      <el-form-item label="库存" required>
        <el-input-number v-model="form.stock" :min="0" />
      </el-form-item>
      <el-form-item label="商品图片">
        <ImageUpload v-model="form.image" />
      </el-form-item>
      <el-form-item label="简介">
        <el-input v-model="form.description" type="textarea" :rows="4" />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="form.status" style="width: 200px">
          <el-option
            v-for="item in PRODUCT_STATUS_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="saving" @click="onSave">保存</el-button>
        <el-button @click="$router.back()">返回</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  createProduct,
  getProductDetail,
  updateProduct,
} from '@/api/product'
import ImageUpload from '@/components/ImageUpload.vue'
import { useDetailForm, useSaveForm } from '@/composables/useFormPage'
import { PRODUCT_STATUS_OPTIONS } from '@/constants/status'
import type { Product } from '@/types'

const route = useRoute()
const isEdit = computed(() => !!route.params.id)

const { loading, form, getId } = useDetailForm(
  () => ({
    name: '',
    price: 0,
    stock: 0,
    image: '',
    description: '',
    status: 'on_sale' as Product['status'],
  }),
  async (id) => {
    const data = await getProductDetail(id)
    return {
      name: data.name,
      price: Number(data.price),
      stock: data.stock,
      image: data.image,
      description: data.description || '',
      status: data.status,
    }
  },
  { skip: () => !isEdit.value },
)

const { saving, handleSave } = useSaveForm(async () => {
  if (isEdit.value) {
    await updateProduct(getId(), form)
  } else {
    await createProduct(form)
  }
}, { name: 'ProductList' })

function onSave() {
  if (!form.name) {
    ElMessage.warning('请填写商品名称')
    return
  }
  return handleSave()
}
</script>
