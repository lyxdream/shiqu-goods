import type { RouteRecordName } from 'vue-router'

export interface TabbarItem {
  name: RouteRecordName
  title: string
  icon: string
}

/** 底部 Tab 配置（与 router 子路由 name 保持一致） */
export const TABBAR_ITEMS: TabbarItem[] = [
  { name: 'Home', title: '首页', icon: 'home-o' },
  { name: 'OrderList', title: '订单', icon: 'orders-o' },
  { name: 'Profile', title: '我的', icon: 'user-o' },
]
