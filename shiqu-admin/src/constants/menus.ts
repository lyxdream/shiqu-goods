import type { Component } from 'vue'
import { Goods, List, Odometer, User } from '@element-plus/icons-vue'

export interface MenuItem {
  path: string
  name: string
  title: string
  icon: Component
  /** 是否在首页展示快捷入口 */
  showOnDashboard?: boolean
}

export const MENUS: MenuItem[] = [
  { path: '/dashboard', name: 'Dashboard', title: '首页', icon: Odometer },
  {
    path: '/users',
    name: 'UserList',
    title: '用户管理',
    icon: User,
    showOnDashboard: true,
  },
  {
    path: '/products',
    name: 'ProductList',
    title: '商品管理',
    icon: Goods,
    showOnDashboard: true,
  },
  {
    path: '/orders',
    name: 'OrderList',
    title: '订单管理',
    icon: List,
    showOnDashboard: true,
  },
]

export const DASHBOARD_MENUS = MENUS.filter((item) => item.showOnDashboard)

export function getMenuTitle(path: string) {
  return MENUS.find((item) => item.path === path)?.title
}
