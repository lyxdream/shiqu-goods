import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { login as loginApi } from '@/api/auth'
import { tokenStorage, usernameStorage } from '@/utils/storage'

export const useAdminStore = defineStore('admin', () => {
  const token = ref(tokenStorage.get())
  const username = ref(usernameStorage.get())

  const isLoggedIn = computed(() => !!token.value)

  async function login(form: { username: string; password: string }) {
    const data = await loginApi(form)
    token.value = data.accessToken
    username.value = form.username
    tokenStorage.set(data.accessToken)
    usernameStorage.set(form.username)
  }

  function logout() {
    token.value = ''
    username.value = ''
    tokenStorage.remove()
    usernameStorage.remove()
  }

  return {
    token,
    username,
    isLoggedIn,
    login,
    logout,
  }
})
