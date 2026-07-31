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

const form = reactive({ metodo: 'correo', usuario: '', contrasena: '' })
const cargando = ref(false)

const usuarioLabel = computed(() => (form.metodo === 'correo' ? 'Correo electrónico' : 'Número de empleado'))
const usuarioType = computed(() => (form.metodo === 'correo' ? 'email' : 'text'))
const puedeEnviar = computed(() => form.usuario.trim() && form.contrasena.trim() && !cargando.value)

async function enviar() {
  if (!puedeEnviar.value) return
  cargando.value = true
  try {
    await auth.login({
      metodo: form.metodo,
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
        <!-- Método de identificación -->
        <div class="c-field">
          <span class="c-label">Identificarme con</span>
          <div class="seg">
            <button
              type="button" class="seg__btn" :class="{ 'seg__btn--active': form.metodo === 'correo' }"
              @click="form.metodo = 'correo'"
            >Correo</button>
            <button
              type="button" class="seg__btn" :class="{ 'seg__btn--active': form.metodo === 'empleado' }"
              @click="form.metodo = 'empleado'"
            >N° de empleado</button>
          </div>
        </div>

        <div class="c-field">
          <label class="c-label" for="usuario">{{ usuarioLabel }}</label>
          <input
            id="usuario" class="c-input" :type="usuarioType" v-model="form.usuario"
            autocomplete="username" :placeholder="usuarioLabel" required
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

/* Segmented control para el método */
.seg { display: flex; gap: 4px; padding: 4px; background: var(--bg-tertiary); border-radius: var(--border-radius-md); }
.seg__btn {
  flex: 1 1 0; min-height: 44px; border: none; background: transparent; cursor: pointer;
  border-radius: var(--border-radius-sm); font-weight: var(--font-weight-medium);
  color: var(--text-secondary); font-size: var(--font-size-base);
  transition: background-color var(--transition-fast), color var(--transition-fast);
}
.seg__btn--active { background: var(--bg-primary); color: var(--primary-color); box-shadow: var(--shadow-xs); }
</style>
