import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { login as loginApi, logout as logoutApi, register as registerApi } from '@/api/auth'
import { getProfile } from '@/api/user'
import type { UserProfile } from '@/types'
import { tokenStorage, usernameStorage } from '@/utils/storage'

export const useUserStore = defineStore('user', () => {
  const token = ref(tokenStorage.get())
  const username = ref(usernameStorage.get())
  const profile = ref<UserProfile | null>(null)

  const isLoggedIn = computed(() => !!token.value)

  async function login(form: { username: string; password: string }) {
    const data = await loginApi(form)
    token.value = data.accessToken
    username.value = form.username
    tokenStorage.set(data.accessToken)
    usernameStorage.set(form.username)
  }

  async function register(form: {
    username: string
    phone: string
    password: string
    confirmPassword: string
  }) {
    const data = await registerApi(form)
    token.value = data.accessToken
    username.value = form.username
    tokenStorage.set(data.accessToken)
    usernameStorage.set(form.username)
  }

  async function fetchProfile() {
    profile.value = await getProfile()
    return profile.value
  }

  async function logout() {
    try {
      await logoutApi()
    } catch {
      // 即使服务端调用失败也继续清本地状态
    }
    token.value = ''
    username.value = ''
    profile.value = null
    tokenStorage.remove()
    usernameStorage.remove()
  }

  return {
    token,
    username,
    profile,
    isLoggedIn,
    login,
    register,
    fetchProfile,
    logout,
  }
})
