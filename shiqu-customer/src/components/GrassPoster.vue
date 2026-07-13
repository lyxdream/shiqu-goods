<template>
  <Teleport to="body">
    <div class="poster-mask" @click.self="close">
      <div class="poster-dialog">
        <!-- 头部 -->
        <div class="dialog-header">
          <span class="dialog-title">生成种草海报</span>
          <button class="dialog-close" @click="close">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 3l12 12M15 3L3 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <!-- Tab 切换 -->
        <div class="tab-row">
          <button
            :class="['tab-item', template === 'xhs' && 'tab-active']"
            @click="switchTab('xhs')"
          >
            <span class="tab-icon">📖</span> 小红书竖版
          </button>
          <button
            :class="['tab-item', template === 'moments' && 'tab-active']"
            @click="switchTab('moments')"
          >
            <span class="tab-icon">📷</span> 朋友圈方图
          </button>
        </div>

        <!-- 预览区 -->
        <div class="preview-wrap">
          <transition name="fade" mode="out-in">
            <div v-if="loading" key="loading" class="loading-wrap">
              <van-loading color="#07c160" size="32px" vertical>生成中…</van-loading>
            </div>
            <div v-else-if="previewUrl" key="preview" class="preview-container">
              <img
                class="preview"
                :class="template === 'xhs' ? 'preview-xhs' : 'preview-moments'"
                :src="previewUrl"
                alt="种草海报"
              />
            </div>
            <div v-else key="empty" class="empty-wrap">
              <van-empty image="error" description="暂无法生成海报" />
            </div>
          </transition>
        </div>

        <!-- 操作区 -->
        <div class="actions">
          <button
            class="save-btn"
            :class="{ 'save-btn--disabled': !previewUrl || loading }"
            :disabled="!previewUrl || loading"
            @click="handleSave"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="margin-right:6px">
              <path d="M12 16l-6-6h4V4h4v6h4l-6 6z" fill="currentColor"/>
              <path d="M4 18h16v2H4z" fill="currentColor"/>
            </svg>
            保存海报
          </button>
          <p class="tip">手机端可长按预览图保存到相册</p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { showToast } from 'vant'
import {
  downloadPosterDataUrl,
  renderGrassPoster,
  type PosterTemplate,
} from '@/utils/grass-poster'

const props = withDefaults(
  defineProps<{
    name: string
    price: number | string
    image?: string | null
    summary: string
    /** 商品 ID，用于生成二维码跳转链接 */
    productId?: number | string | null
  }>(),
  { image: '', summary: '', productId: null },
)

const emit = defineEmits<{ close: [] }>()

const template = ref<PosterTemplate>('xhs')
const previewUrl = ref('')
const loading = ref(false)

function close() {
  emit('close')
}

function switchTab(t: PosterTemplate) {
  if (template.value !== t) template.value = t
}

function buildProductUrl(): string | undefined {
  if (!props.productId) return undefined
  return `${window.location.origin}/product/${props.productId}`
}

async function render() {
  loading.value = true
  previewUrl.value = ''
  try {
    previewUrl.value = await renderGrassPoster({
      name: props.name,
      price: props.price,
      image: props.image,
      summary: props.summary,
      template: template.value,
      productUrl: buildProductUrl(),
    })
  } catch {
    showToast('海报生成失败')
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  if (!previewUrl.value) return
  try {
    await downloadPosterDataUrl(previewUrl.value, `拾趣好物-种草海报-${Date.now()}.png`)
    showToast('已开始下载，手机可长按图片保存')
  } catch {
    showToast('请长按预览图保存到相册')
  }
}

onMounted(() => void render())
watch(template, () => void render())
</script>

<style scoped>
/* ── 遮罩 ── */
.poster-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(3px);
}

/* ── 弹窗卡片 ── */
.poster-dialog {
  background: #fff;
  border-radius: 20px;
  width: min(92vw, 400px);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
}

/* ── 头部 ── */
.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 16px;
  flex-shrink: 0;
  border-bottom: 1px solid #f2f2f2;
}

.dialog-title {
  font-size: 17px;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: 0.3px;
}

.dialog-close {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f5f5f5;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
  cursor: pointer;
  transition: background 0.2s;
  padding: 0;
}
.dialog-close:hover { background: #ebebeb; }

/* ── Tab ── */
.tab-row {
  display: flex;
  gap: 10px;
  padding: 16px 20px 12px;
  flex-shrink: 0;
}

.tab-item {
  flex: 1;
  text-align: center;
  font-size: 13px;
  padding: 9px 4px;
  border-radius: 10px;
  border: 1.5px solid #ebebeb;
  background: #fafafa;
  color: #666;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.tab-icon { font-size: 14px; }

.tab-active {
  background: linear-gradient(135deg, #09d361, #07c160);
  border-color: transparent;
  color: #fff;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(7, 193, 96, 0.35);
}

/* ── 预览区 ── */
.preview-wrap {
  flex: 1;
  overflow-y: auto;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 12px 16px;
  background: #f7f8fa;
  min-height: 200px;
}

.loading-wrap,
.empty-wrap {
  width: 100%;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-container {
  width: 100%;
  display: flex;
  justify-content: center;
}

.preview {
  display: block;
  border-radius: 12px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
}

.preview-xhs {
  /* 竖版：限高，等比缩放 */
  max-width: 240px;
  width: 100%;
}

.preview-moments {
  /* 方图：铺满预览区 */
  max-width: 320px;
  width: 100%;
}

/* ── 操作区 ── */
.actions {
  padding: 14px 20px 20px;
  flex-shrink: 0;
  border-top: 1px solid #f2f2f2;
}

.save-btn {
  width: 100%;
  height: 48px;
  border-radius: 24px;
  background: linear-gradient(135deg, #1890ff, #096dd9);
  color: #fff;
  border: none;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s, transform 0.1s;
  box-shadow: 0 4px 14px rgba(24, 144, 255, 0.4);
}

.save-btn:active { transform: scale(0.98); }
.save-btn--disabled { opacity: 0.45; cursor: not-allowed; }

.tip {
  margin: 10px 0 0;
  text-align: center;
  font-size: 12px;
  color: #aaa;
}

/* ── 过渡动画 ── */
.fade-enter-active,
.fade-leave-active { transition: opacity 0.25s; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }
</style>
