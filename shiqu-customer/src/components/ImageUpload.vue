<template>
  <div class="upload">
    <van-uploader
      :max-count="1"
      :after-read="handleUpload"
      accept="image/jpeg,image/png,image/gif,image/webp"
    >
      <van-image
        v-if="modelValue"
        :src="previewUrl"
        width="88"
        height="88"
        fit="cover"
        radius="8"
      />
      <div v-else class="upload-placeholder">
        <van-icon name="photograph" size="24" />
        <span>上传图片</span>
      </div>
    </van-uploader>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { showToast, type UploaderFileListItem } from 'vant'
import { uploadImage } from '@/api/upload'
import { resolveAssetUrl } from '@/utils/url'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const previewUrl = computed(() => resolveAssetUrl(props.modelValue))

async function handleUpload(item: UploaderFileListItem | UploaderFileListItem[]) {
  const fileItem = Array.isArray(item) ? item[0] : item
  const file = fileItem.file
  if (!file) return

  try {
    const data = await uploadImage(file)
    emit('update:modelValue', data.url)
    showToast('上传成功')
  } catch {
    // 错误已在拦截器提示
  }
}
</script>

<style scoped>
.upload-placeholder {
  width: 88px;
  height: 88px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #969799;
  background: #f7f8fa;
  border-radius: 8px;
  font-size: 12px;
}
</style>
