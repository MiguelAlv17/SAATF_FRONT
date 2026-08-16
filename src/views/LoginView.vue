<script setup>
import { reactive, ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useUiStore } from '../stores/ui'
import AppIcon from '../components/ui/AppIcon.vue'
import logoUrl from '../assets/logo.png'
import bgUrl from '../assets/background.jpg'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const ui = useUiStore()

// Por ahora solo login por correo (el método por número de empleado está
// desactivado en el backend).
const form = reactive({ usuario: '', contrasena: '' })
const cargando = ref(false)
const verContrasena = ref(false)

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
  <div class="login-page" :style="{ backgroundImage: `url(${bgUrl})` }">
    <div class="login-card c-card u-anim-up">
      <div class="login-head">
        <img :src="logoUrl" class="login-logo" alt="SAATF" />
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
          <div class="pw-wrap">
            <input
              id="contrasena" class="c-input pw-input" :type="verContrasena ? 'text' : 'password'"
              v-model="form.contrasena" autocomplete="current-password" placeholder="••••••••" required
            />
            <button
              type="button" class="pw-toggle" @click="verContrasena = !verContrasena"
              :aria-label="verContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              :title="verContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'"
            >
              <AppIcon :name="verContrasena ? 'eye-off' : 'eye'" :size="20" />
            </button>
          </div>
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
/* Fondo con imagen + capa azul corporativa semitransparente (filtro azulado)
   para que el foco quede en el formulario y no en la imagen. */
.login-page {
  position: relative;
  flex: 1 1 auto;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
.login-page::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--primary-color);
  opacity: 0.62;
}

.login-card { position: relative; z-index: 1; width: min(440px, 100%); padding: var(--spacing-4xl); }
.login-head { text-align: center; margin-bottom: var(--spacing-3xl); }
.login-logo {
  display: block;
  height: auto; width: auto;
  max-height: 72px; max-width: 220px;
  margin: 0 auto var(--spacing-lg);
  object-fit: contain;
}
.login-title { font-size: var(--font-size-xl); font-weight: var(--font-weight-semibold); }
.login-sub { margin: var(--spacing-sm) 0 0; color: var(--text-tertiary); font-size: var(--font-size-base); }
.login-form { display: flex; flex-direction: column; gap: var(--spacing-lg); }

/* Campo de contraseña con botón mostrar/ocultar */
.pw-wrap { position: relative; }
.pw-input { padding-right: 48px; }
.pw-toggle {
  position: absolute; top: 50%; right: 6px; transform: translateY(-50%);
  display: inline-flex; align-items: center; justify-content: center;
  width: 38px; height: 38px; padding: 0;
  background: transparent; border: none; cursor: pointer;
  color: var(--text-tertiary); border-radius: var(--border-radius-sm);
  transition: color var(--transition-fast), background-color var(--transition-fast);
}
.pw-toggle:hover { color: var(--primary-color); background: var(--bg-tertiary); }
.pw-toggle:focus-visible { outline: none; box-shadow: var(--shadow-focus); }
</style>
