<template>
  <div class="auth-page">
    <van-nav-bar title="忘记密码" left-arrow @click-left="$router.back()" />

    <!-- 第一步：输入手机号获取验证码 -->
    <template v-if="step === 1">
      <p class="tip">请输入注册时绑定的手机号，我们将发送验证码</p>
      <van-form class="form" @submit="handleSendCode">
        <van-cell-group inset>
          <van-field
            v-model="phone"
            name="phone"
            type="tel"
            label="手机号"
            placeholder="请输入注册时的手机号"
            maxlength="11"
            :rules="[
              { required: true, message: '请输入手机号' },
              { pattern: /^1\d{10}$/, message: '请输入正确的手机号' },
            ]"
          />
        </van-cell-group>
        <div class="actions">
          <van-button
            round block type="primary" native-type="submit"
            :loading="sending" :disabled="countdown > 0"
          >
            {{ countdown > 0 ? `重新发送 (${countdown}s)` : '获取验证码' }}
          </van-button>
        </div>
      </van-form>
    </template>

    <!-- 第二步：输入验证码 + 新密码 -->
    <template v-else>
      <p class="tip">验证码已发送至 {{ phone }}，请在 5 分钟内完成验证</p>
      <van-form class="form" @submit="handleReset">
        <van-cell-group inset>
          <van-field
            v-model="form.code"
            name="code"
            label="验证码"
            placeholder="请输入 6 位验证码"
            maxlength="6"
            :rules="[
              { required: true, message: '请输入验证码' },
              { pattern: /^\d{6}$/, message: '验证码为 6 位数字' },
            ]"
          >
            <template #button>
              <van-button
                size="small" type="primary" plain
                :disabled="countdown > 0" @click="handleSendCode"
              >
                {{ countdown > 0 ? `${countdown}s` : '重新获取' }}
              </van-button>
            </template>
          </van-field>
          <van-field
            v-model="form.newPassword"
            type="password"
            name="newPassword"
            label="新密码"
            placeholder="至少 6 位"
            :rules="[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少 6 位' },
            ]"
          />
          <van-field
            v-model="form.confirmPassword"
            type="password"
            name="confirmPassword"
            label="确认密码"
            placeholder="再次输入新密码"
            :rules="[{ required: true, message: '请确认新密码' }]"
          />
        </van-cell-group>
        <div class="actions">
          <van-button round block type="primary" native-type="submit" :loading="loading">
            重置密码
          </van-button>
        </div>
      </van-form>
    </template>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { sendForgotOtp, resetPassword } from '@/api/auth'

const router = useRouter()

const step = ref(1)
const phone = ref('')
const sending = ref(false)
const loading = ref(false)
const countdown = ref(0)

const form = reactive({
  code: '',
  newPassword: '',
  confirmPassword: '',
})

let countdownTimer: ReturnType<typeof setInterval> | null = null

function startCountdown() {
  countdown.value = 60
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownTimer!)
      countdownTimer = null
    }
  }, 1000)
}

async function handleSendCode() {
  if (countdown.value > 0) return
  sending.value = true
  try {
    await sendForgotOtp({ phone: phone.value })
    showToast('验证码已发送（开发模式请查看服务端日志）')
    step.value = 2
    startCountdown()
  } finally {
    sending.value = false
  }
}

async function handleReset() {
  if (form.newPassword !== form.confirmPassword) {
    showToast('两次密码不一致')
    return
  }
  loading.value = true
  try {
    await resetPassword({
      phone: phone.value,
      code: form.code,
      newPassword: form.newPassword,
      confirmPassword: form.confirmPassword,
    })
    showToast('密码已重置，请登录')
    router.replace({ name: 'Login' })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.tip {
  margin: 12px 16px 0;
  font-size: 14px;
  line-height: 1.5;
  color: #969799;
}

.form {
  margin-top: 16px;
}

.actions {
  margin: 24px 16px 0;
}
</style>
