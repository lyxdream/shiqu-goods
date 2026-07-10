import type { RouteRecordRaw } from 'vue-router'

const Login = () => import('@/views/auth/Login.vue')
const Register = () => import('@/views/auth/Register.vue')
const ForgotPassword = () => import('@/views/auth/ForgotPassword.vue')
const MainLayout = () => import('@/layouts/MainLayout.vue')
const ProductList = () => import('@/views/home/ProductList.vue')
const OrderList = () => import('@/views/order/OrderList.vue')
const Profile = () => import('@/views/profile/Profile.vue')
const ProductDetail = () => import('@/views/product/ProductDetail.vue')
const AddressList = () => import('@/views/address/AddressList.vue')
const AddressForm = () => import('@/views/address/AddressForm.vue')
const OrderDetail = () => import('@/views/order/OrderDetail.vue')
const EditProfile = () => import('@/views/profile/EditProfile.vue')
const ChangePassword = () => import('@/views/profile/ChangePassword.vue')
const AiChat = () => import('@/views/ai/Chat.vue')
const AiDocument = () => import('@/views/ai/Document.vue')

export const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { public: true, title: '登录' },
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { public: true, title: '注册' },
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: ForgotPassword,
    meta: { public: true, title: '忘记密码' },
  },
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'Home',
        component: ProductList,
        meta: { public: true, title: '首页' },
      },
      {
        path: 'orders',
        name: 'OrderList',
        component: OrderList,
        meta: { title: '订单' },
      },
      {
        path: 'profile',
        name: 'Profile',
        component: Profile,
        meta: { title: '我的' },
      },
    ],
  },
  {
    path: '/product/:id',
    name: 'ProductDetail',
    component: ProductDetail,
    meta: { public: true, title: '商品详情' },
  },
  {
    path: '/addresses',
    name: 'AddressList',
    component: AddressList,
    meta: { title: '收货地址' },
  },
  {
    path: '/addresses/new',
    name: 'AddressCreate',
    component: AddressForm,
    meta: { title: '新增地址' },
  },
  {
    path: '/addresses/:id/edit',
    name: 'AddressEdit',
    component: AddressForm,
    meta: { title: '编辑地址' },
  },
  {
    path: '/orders/:id',
    name: 'OrderDetail',
    component: OrderDetail,
    meta: { title: '订单详情' },
  },
  {
    path: '/profile/edit',
    name: 'EditProfile',
    component: EditProfile,
    meta: { title: '编辑资料' },
  },
  {
    path: '/profile/password',
    name: 'ChangePassword',
    component: ChangePassword,
    meta: { title: '修改密码' },
  },
  {
    path: '/ai/chat',
    name: 'AiChat',
    component: AiChat,
    meta: { title: 'AI 对话' },
  },
  {
    path: '/ai/document',
    name: 'AiDocument',
    component: AiDocument,
    meta: { title: '文档解析' },
  },
]
