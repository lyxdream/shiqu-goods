<template>
  <div class="page chat-page">
    <van-nav-bar :title="pageTitle" left-arrow @click-left="$router.back()" />
    <div v-if="hint" class="hint muted">{{ hint }}</div>
    <div class="messages" ref="messagesEl">
      <div v-for="(msg, index) in messages" :key="index" class="msg" :class="msg.role">
        <div class="bubble-wrap">
          <div class="bubble" :class="{ 'bubble-copyable': msg.copyable }">
            <div class="bubble-text">{{ msg.content }}</div>
            <div v-if="msg.copyable" class="copy-row">
              <span class="copy-link" @click="copyText(msg.content)">复制文案</span>
              <span class="copy-link" @click="openPoster(msg.content)">生成海报</span>
            </div>
          </div>
          <div v-if="msg.productIds?.length" class="product-links">
            <van-button
              v-for="id in msg.productIds"
              :key="id"
              size="small"
              type="primary"
              plain
              @click="goProduct(id)"
            >
              查看推荐商品 #{{ id }}
            </van-button>
          </div>
        </div>
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

    <GrassPoster
      v-if="posterVisible"
      :name="posterProduct?.name || '好物推荐'"
      :price="posterProduct?.price ?? 0"
      :image="posterProduct?.image"
      :summary="posterSummary"
      :product-id="posterProduct?.id"
      @close="posterVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { aiChat, type AiScene } from '@/api/ai'
import { getOrderDetail } from '@/api/order'
import { getProductDetail } from '@/api/product'
import GrassPoster from '@/components/GrassPoster.vue'
import type { Product } from '@/types'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
  productIds?: number[]
  copyable?: boolean
}

const route = useRoute()
const router = useRouter()
const input = ref('')
const loading = ref(false)
const messagesEl = ref<HTMLElement | null>(null)
const sessionId = ref(`s-${Date.now()}`)
const messages = ref<ChatMessage[]>([])
const linkedProductLabel = ref('')
const linkedOrderLabel = ref('')
const posterProduct = ref<Product | null>(null)
const posterVisible = ref(false)
const posterSummary = ref('')

const scene = computed<AiScene>(() => {
  const s = String(route.query.scene || '')
  if (
    s === 'product_qa' ||
    s === 'order_help' ||
    s === 'assistant' ||
    s === 'product_recommend' ||
    s === 'grass_copy'
  ) {
    return s
  }
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
  if (scene.value === 'grass_copy') return 'AI 种草文案'
  if (scene.value === 'product_recommend') return '商品推荐'
  return '购物 AI 助手'
})

const hint = computed(() => {
  if (scene.value === 'product_qa' && linkedProductLabel.value) {
    return `已关联商品 ${linkedProductLabel.value}，可问价格、用法、场景、保养等`
  }
  if (scene.value === 'grass_copy' && linkedProductLabel.value) {
    return `正在为 ${linkedProductLabel.value} 生成种草文案，可指定朋友圈/小红书/简短风格`
  }
  if (scene.value === 'order_help' && linkedOrderLabel.value) {
    return `已关联订单 ${linkedOrderLabel.value}，可问自提、状态、下单步骤等`
  }
  if ((scene.value === 'product_qa' || scene.value === 'grass_copy') && productId.value) {
    return '正在加载商品信息…'
  }
  if (scene.value === 'order_help' && orderId.value) {
    return '正在加载订单信息…'
  }
  if (scene.value === 'product_recommend' || scene.value === 'assistant') {
    return '可描述需求或预算，例如「推荐个200以内的礼物」'
  }
  return ''
})

onMounted(async () => {
  const greet =
    scene.value === 'product_qa'
      ? '你好，我是商品顾问。关于这件商品想了解什么？'
      : scene.value === 'order_help'
        ? '你好，我是订单助手。想了解自提、付款还是订单状态？'
        : scene.value === 'grass_copy'
          ? '你好，我可以帮你写种草文案。直接发送，或说明要朋友圈/小红书/简短风格。'
          : scene.value === 'product_recommend'
            ? '你好，告诉我你的需求或预算，我会从站内商品里为你推荐。'
            : '你好，我是购物 AI 助手。可以问商品推荐、购物流程或订单问题。'
  messages.value.push({ role: 'assistant', content: greet })

  try {
    if (productId.value) {
      const product = await getProductDetail(productId.value)
      posterProduct.value = product
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

function openPoster(summary: string) {
  if (!posterProduct.value) {
    showToast('商品信息未加载，暂无法生成海报')
    return
  }
  posterSummary.value = summary
  posterVisible.value = true
}

function goProduct(id: number) {
  router.push({ name: 'ProductDetail', params: { id: String(id) } })
}

async function copyText(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.left = '-9999px'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    showToast('已复制到剪贴板')
  } catch {
    showToast('复制失败，请长按文案手动复制')
  }
}

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
      productIds: data?.productIds?.length ? data.productIds : undefined,
      copyable: scene.value === 'grass_copy',
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

.bubble-wrap {
  max-width: 80%;
}

.bubble {
  padding: 10px 12px;
  border-radius: 10px;
  background: #fff;
  font-size: 16px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.bubble-copyable {
  padding-bottom: 8px;
}

.bubble-text {
  white-space: pre-wrap;
  word-break: break-word;
}

.copy-row {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid #ebedf0;
}

.copy-link {
  font-size: 13px;
  color: #1989fa;
  cursor: pointer;
  user-select: none;
}

.copy-link:active {
  opacity: 0.7;
}

.msg.user .bubble-wrap {
  margin-left: auto;
}

.msg.user .bubble {
  background: #07c160;
  color: #fff;
}

.product-links {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
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
