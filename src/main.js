import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import { useAuthStore } from './stores/auth'
import { useUiStore } from './stores/ui'
import { setUnauthorizedHandler } from './services/http'

import './assets/styles/theme.css'
import './assets/styles/base.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Manejo global de 401: cierra sesión local y regresa al login.
setUnauthorizedHandler(() => {
  const auth = useAuthStore()
  const ui = useUiStore()
  if (auth.isAuthenticated) {
    auth.clearLocal()
    ui.warning('Tu sesión expiró. Vuelve a iniciar sesión.', 'AUTH-401')
    router.push({ name: 'login' })
  }
})

app.mount('#app')
