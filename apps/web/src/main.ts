import { createApp } from 'vue'
import './styles/main.scss'
import App from './App.vue'
import { router } from './app/router'

createApp(App).use(router).mount('#app')
