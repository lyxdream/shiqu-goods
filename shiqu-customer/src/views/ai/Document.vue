<template>
  <div class="page">
    <van-nav-bar title="文档解析" left-arrow @click-left="$router.back()" />
    <van-form class="form" @submit="handleSubmit">
      <van-cell-group inset>
        <van-field
          v-model="form.content"
          rows="6"
          autosize
          type="textarea"
          label="内容"
          placeholder="粘贴文档内容或 URL"
          :rules="[{ required: true, message: '请输入内容' }]"
        />
        <van-field
          v-model="form.prompt"
          rows="2"
          autosize
          type="textarea"
          label="提示词"
          placeholder="可选，告诉 AI 如何解析"
        />
      </van-cell-group>
      <div class="actions">
        <van-button round block type="primary" native-type="submit" :loading="loading">
          开始解析
        </van-button>
      </div>
    </van-form>

    <div v-if="resultText" class="section-card">
      <div class="label">解析结果</div>
      <pre class="result">{{ resultText }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { showToast } from 'vant'
import { aiParseDocument } from '@/api/ai'

const loading = ref(false)
const resultText = ref('')
const form = reactive({
  content: '',
  prompt: '',
})

async function handleSubmit() {
  loading.value = true
  try {
    const data = await aiParseDocument({
      content: form.content,
      prompt: form.prompt || undefined,
    })
    resultText.value =
      typeof data === 'string' ? data : JSON.stringify(data, null, 2)
  } catch {
    showToast('AI 服务暂不可用')
  } finally {
    loading.value = false
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

.label {
  margin-bottom: 8px;
  font-weight: 600;
}

.result {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 15px;
  line-height: 1.5;
  color: #646566;
}
</style>
