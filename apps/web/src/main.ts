import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './styles/main.scss'
import App from './App.vue'
import { router } from './router/index.ts'

createApp(App).use(ElementPlus).use(router).mount('#app')
