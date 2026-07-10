<template>
  <div class="page chat-page">
    <van-nav-bar title="AI 对话" left-arrow @click-left="$router.back()" />
    <div class="messages">
      <div v-for="(msg, index) in messages" :key="index" class="msg" :class="msg.role">
        <div class="bubble">{{ msg.content }}</div>
      </div>
      <van-empty v-if="!messages.length" description="开始和 AI 聊聊吧" />
    </div>
    <div class="composer">
      <van-field
        v-model="input"
        rows="1"
        autosize
        type="textarea"
        placeholder="输入消息"
      />
      <van-button type="primary" size="small" :loading="loading" @click="send">
        发送
      </van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { showToast } from 'vant'
import { aiChat } from '@/api/ai'

const input = ref('')
const loading = ref(false)
const sessionId = ref(`s-${Date.now()}`)
const messages = ref<{ role: 'user' | 'assistant'; content: string }[]>([])

async function send() {
  const text = input.value.trim()
  if (!text) return

  messages.value.push({ role: 'user', content: text })
  input.value = ''
  loading.value = true
  try {
    const data = await aiChat({ message: text, sessionId: sessionId.value })
    const reply =
      typeof data === 'string'
        ? data
        : ((data as { reply?: string; message?: string; content?: string }).reply ||
          (data as { message?: string }).message ||
          (data as { content?: string }).content ||
          JSON.stringify(data))
    messages.value.push({ role: 'assistant', content: String(reply) })
  } catch {
    showToast('AI 服务暂不可用')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.messages {
  flex: 1;
  overflow: auto;
  padding: 12px;
}

.msg {
  display: flex;
  margin-bottom: 12px;
}

.msg.user {
  justify-content: flex-end;
}

.bubble {
  max-width: 80%;
  padding: 10px 12px;
  border-radius: 10px;
  background: #fff;
  font-size: 16px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.msg.user .bubble {
  background: #07c160;
  color: #fff;
}

.composer {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 8px 12px calc(8px + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 1px solid #ebedf0;
}

.composer :deep(.van-field) {
  flex: 1;
  background: #f7f8fa;
  border-radius: 8px;
  padding: 6px 10px;
}
</style>
