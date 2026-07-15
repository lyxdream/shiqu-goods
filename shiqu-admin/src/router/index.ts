import { createRouter, createWebHistory } from 'vue-router'
import { getMenuTitle } from '@/constants/menus'
import { tokenStorage } from '@/utils/storage'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/login/Login.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: () => import('@/layouts/AdminLayout.vue'),
      redirect: { name: 'Dashboard' },
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/dashboard/Index.vue'),
          meta: { title: getMenuTitle('/dashboard') },
        },
        {
          path: 'users',
          name: 'UserList',
          component: () => import('@/views/user/UserList.vue'),
          meta: { title: getMenuTitle('/users') },
        },
        {
          path: 'users/:id/edit',
          name: 'UserEdit',
          component: () => import('@/views/user/UserEdit.vue'),
          meta: { title: '编辑用户' },
        },
        {
          path: 'products',
          name: 'ProductList',
          component: () => import('@/views/product/ProductList.vue'),
          meta: { title: getMenuTitle('/products') },
        },
        {
          path: 'products/create',
          name: 'ProductCreate',
          component: () => import('@/views/product/ProductForm.vue'),
          meta: { title: '新增商品' },
        },
        {
          path: 'products/:id/edit',
          name: 'ProductEdit',
          component: () => import('@/views/product/ProductForm.vue'),
          meta: { title: '编辑商品' },
        },
        {
          path: 'orders',
          name: 'OrderList',
          component: () => import('@/views/order/OrderList.vue'),
          meta: { title: getMenuTitle('/orders') },
        },
        {
          path: 'orders/:id',
          name: 'OrderDetail',
          component: () => import('@/views/order/OrderDetail.vue'),
          meta: { title: '订单详情' },
        },
        {
          path: 'audit-logs',
          name: 'AuditLogList',
          component: () => import('@/views/audit/AuditLogList.vue'),
          meta: { title: getMenuTitle('/audit-logs') },
        },
      ],
    },
  ],
})

router.beforeEach((to) => {
  const token = tokenStorage.get()

  if (to.name === 'Login' && token) {
    return { name: 'Dashboard' }
  }

  if (to.meta.public) return true
  if (!token) return { name: 'Login' }
  return true
})

export default router
