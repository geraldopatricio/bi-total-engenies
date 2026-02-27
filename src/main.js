import { createApp } from 'vue'
import App from './App.vue'
import router from './router' // <--- Importar Router
import './assets/main.scss'
import 'bootstrap'

const app = createApp(App)

app.use(router) // <--- Usar Router
app.mount('#app')