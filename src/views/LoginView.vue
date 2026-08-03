<script setup>
import { reactive, ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useUiStore } from '../stores/ui'
import AppIcon from '../components/ui/AppIcon.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const ui = useUiStore()

// Por ahora solo login por correo (el método por número de empleado está
// desactivado en el backend).
const form = reactive({ usuario: '', contrasena: '' })
const cargando = ref(false)

const puedeEnviar = computed(() => form.usuario.trim() && form.contrasena.trim() && !cargando.value)

async function enviar() {
  if (!puedeEnviar.value) return
  cargando.value = true
  try {
    await auth.login({
      metodo: 'correo',
      usuario: form.usuario.trim(),
      contrasena: form.contrasena,
    })
    const destino = route.query.redirect || { name: 'captura' }
    router.push(destino)
  } catch (e) {
    ui.error(e.mensaje || 'No se pudo iniciar sesión.', e.codigo)
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <div class="app-center">
    <div class="login-card c-card u-anim-up">
      <div class="login-head">
        <div class="login-logo">SAATF</div>
        <h1 class="login-title">Sistema de Atención en Fila</h1>
        <p class="login-sub">Ingresa para capturar trámites</p>
      </div>

      <form class="login-form" @submit.prevent="enviar">
        <div class="c-field">
          <label class="c-label" for="usuario">Correo electrónico</label>
          <input
            id="usuario" class="c-input" type="email" v-model="form.usuario"
            autocomplete="username" placeholder="Correo electrónico" required
          />
        </div>

        <div class="c-field">
          <label class="c-label" for="contrasena">Contraseña</label>
          <input
            id="contrasena" class="c-input" type="password" v-model="form.contrasena"
            autocomplete="current-password" placeholder="••••••••" required
          />
        </div>

        <button class="c-btn c-btn--primary c-btn--lg c-btn--block u-mt-2" type="submit" :disabled="!puedeEnviar">
          <span v-if="cargando" class="c-spinner" style="border-top-color:#fff;border-color:rgba(255,255,255,.4)"></span>
          <span>{{ cargando ? 'Ingresando…' : 'Ingresar' }}</span>
          <AppIcon v-if="!cargando" name="arrow-right" :size="18" />
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-card { width: min(440px, 100%); padding: var(--spacing-4xl); }
.login-head { text-align: center; margin-bottom: var(--spacing-3xl); }
.login-logo {
  display: inline-block; font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold);
  color: var(--primary-color); letter-spacing: var(--letter-spacing-tight); margin-bottom: var(--spacing-lg);
}
.login-title { font-size: var(--font-size-xl); font-weight: var(--font-weight-semibold); }
.login-sub { margin: var(--spacing-sm) 0 0; color: var(--text-tertiary); font-size: var(--font-size-base); }
.login-form { display: flex; flex-direction: column; gap: var(--spacing-lg); }
</style>
