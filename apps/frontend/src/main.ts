import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { initCsrf } from './services/api'
import './assets/main.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// Initialize CSRF protection before mounting
initCsrf().then(() => {
  app.mount('#app')
}).catch((error) => {
  console.error('Failed to initialize CSRF protection:', error)
  // Mount app anyway - CSRF tokens will be fetched on first request
  app.mount('#app')
})
