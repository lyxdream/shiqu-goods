import { createRouter, createWebHistory } from 'vue-router'
import { tokenStorage } from '@/utils/storage'
import { routes } from './routes'

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const token = tokenStorage.get()

  if (
    (to.name === 'Login' ||
      to.name === 'Register' ||
      to.name === 'ForgotPassword') &&
    token
  ) {
    return { name: 'Home' }
  }

  if (to.meta.public) return true
  if (!token) {
    return { name: 'Login', query: { redirect: to.fullPath } }
  }
  return true
})

export default router
