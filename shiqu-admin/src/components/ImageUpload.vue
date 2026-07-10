<template>
  <div class="upload-wrap">
    <el-upload
      :show-file-list="false"
      :http-request="handleUpload"
      accept="image/jpeg,image/png,image/gif,image/webp"
    >
      <el-button type="primary" :loading="loading">上传图片</el-button>
    </el-upload>
    <el-image
      v-if="modelValue"
      :src="previewUrl"
      class="preview"
      fit="cover"
    />
    <el-input
      :model-value="modelValue"
      class="url-input"
      placeholder="图片 URL"
      @update:model-value="emit('update:modelValue', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { UploadRequestOptions } from 'element-plus'
import { ElMessage } from 'element-plus'
import { uploadImage } from '@/api/upload'
import { resolveAssetUrl } from '@/utils/url'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const loading = ref(false)
const previewUrl = computed(() => resolveAssetUrl(props.modelValue))

async function handleUpload(options: UploadRequestOptions) {
  loading.value = true
  try {
    const file = options.file as File
    const data = await uploadImage(file)
    emit('update:modelValue', data.url)
    ElMessage.success('上传成功')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.upload-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.preview {
  width: 120px;
  height: 120px;
  border-radius: 6px;
  border: 1px solid #ebeef5;
}

.url-input {
  max-width: 480px;
}
</style>
