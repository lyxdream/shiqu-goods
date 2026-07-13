<template>
  <div class="page chat-page">
    <van-nav-bar :title="pageTitle" left-arrow @click-left="$router.back()" />
    <div v-if="hint" class="hint muted">{{ hint }}</div>
    <div class="messages" ref="messagesEl">
      <div v-for="(msg, index) in messages" :key="index" class="msg" :class="msg.role">
        <div class="bubble">{{ msg.content }}</div>
      </div>
      <van-empty v-if="!messages.length" description="开始提问吧" />
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
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { showToast } from 'vant'
import { aiChat, type AiScene } from '@/api/ai'
import { getOrderDetail } from '@/api/order'
import { getProductDetail } from '@/api/product'

const route = useRoute()
const input = ref('')
const loading = ref(false)
const messagesEl = ref<HTMLElement | null>(null)
const sessionId = ref(`s-${Date.now()}`)
const messages = ref<{ role: 'user' | 'assistant'; content: string }[]>([])
const linkedProductLabel = ref('')
const linkedOrderLabel = ref('')

const scene = computed<AiScene>(() => {
  const s = String(route.query.scene || '')
  if (s === 'product_qa' || s === 'order_help' || s === 'assistant') return s
  if (route.query.productId) return 'product_qa'
  if (route.query.orderId) return 'order_help'
  return 'assistant'
})

const productId = computed(() => {
  const id = Number(route.query.productId)
  return Number.isFinite(id) && id > 0 ? id : undefined
})

const orderId = computed(() => {
  const id = Number(route.query.orderId)
  return Number.isFinite(id) && id > 0 ? id : undefined
})

const pageTitle = computed(() => {
  if (scene.value === 'product_qa') return 'AI 咨询好物'
  if (scene.value === 'order_help') return '订单问题咨询'
  return '购物 AI 助手'
})

const hint = computed(() => {
  if (scene.value === 'product_qa' && linkedProductLabel.value) {
    return `已关联商品 ${linkedProductLabel.value}，可问价格、用法、场景、保养等`
  }
  if (scene.value === 'order_help' && linkedOrderLabel.value) {
    return `已关联订单 ${linkedOrderLabel.value}，可问自提、状态、下单步骤等`
  }
  if (scene.value === 'product_qa' && productId.value) {
    return '正在加载商品信息…'
  }
  if (scene.value === 'order_help' && orderId.value) {
    return '正在加载订单信息…'
  }
  if (scene.value === 'assistant') {
    return '可咨询购物流程、自提规则与订单问题；商品细节请从详情页进入'
  }
  return ''
})

onMounted(async () => {
  const greet =
    scene.value === 'product_qa'
      ? '你好，我是商品顾问。关于这件商品想了解什么？'
      : scene.value === 'order_help'
        ? '你好，我是订单助手。想了解自提、付款还是订单状态？'
        : '你好，我是购物 AI 助手。可以直接问注册、地址、下单或订单问题。'
  messages.value.push({ role: 'assistant', content: greet })

  try {
    if (productId.value) {
      const product = await getProductDetail(productId.value)
      linkedProductLabel.value = `${product.productNo}（${product.name}）`
    }
    if (orderId.value) {
      const order = await getOrderDetail(orderId.value)
      linkedOrderLabel.value = order.orderNo
    }
  } catch {
    // 未登录或加载失败时不展示业务编号
  }
})

async function scrollBottom() {
  await nextTick()
  if (messagesEl.value) {
    messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  }
}

async function send() {
  const text = input.value.trim()
  if (!text) return

  messages.value.push({ role: 'user', content: text })
  input.value = ''
  loading.value = true
  await scrollBottom()
  try {
    const data = await aiChat({
      message: text,
      sessionId: sessionId.value,
      scene: scene.value,
      productId: productId.value,
      orderId: orderId.value,
    })
    messages.value.push({
      role: 'assistant',
      content: data?.reply || '暂时没有得到有效回复',
    })
  } catch {
    showToast('AI 服务暂不可用')
  } finally {
    loading.value = false
    await scrollBottom()
  }
}
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.hint {
  padding: 8px 12px;
  font-size: 13px;
  background: #f7f8fa;
  border-bottom: 1px solid #ebedf0;
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
