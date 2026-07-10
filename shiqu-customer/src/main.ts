import { createApp } from 'vue'
import { createPinia } from 'pinia'
import {
  ActionSheet,
  Button,
  Cell,
  CellGroup,
  Dialog,
  Empty,
  Field,
  Form,
  Icon,
  Image as VanImage,
  NavBar,
  Stepper,
  SubmitBar,
  Tabbar,
  TabbarItem,
  Tag,
  Toast,
  Uploader,
} from 'vant'
import 'vant/lib/index.css'
import App from './App.vue'
import router from './router'
import './styles/index.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

;[
  ActionSheet,
  Button,
  Cell,
  CellGroup,
  Dialog,
  Empty,
  Field,
  Form,
  Icon,
  VanImage,
  NavBar,
  Stepper,
  SubmitBar,
  Tabbar,
  TabbarItem,
  Tag,
  Toast,
  Uploader,
].forEach((comp) => app.use(comp))

app.mount('#app')
