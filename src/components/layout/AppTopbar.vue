<script setup>
// Barra superior: marca + acceso a atenciones + menú de usuario (con salir).
import { ref } from 'vue'
import { useAuthStore } from '../../stores/auth'
import AppIcon from './../ui/AppIcon.vue'

const emit = defineEmits(['logout', 'ver-atenciones'])
const auth = useAuthStore()

const menuAbierto = ref(false)
function alternarMenu() { menuAbierto.value = !menuAbierto.value }
function cerrarMenu() { menuAbierto.value = false }
function salir() {
  cerrarMenu()
  emit('logout')
}
</script>

<template>
  <header class="topbar no-print">
    <div class="topbar__brand">
      <span class="topbar__logo">SAATF</span>
      <span class="topbar__sub">Atención en fila</span>
    </div>

    <div class="topbar__right">
      <!-- 1) Atenciones -->
      <button class="c-btn c-btn--ghost" type="button" @click="emit('ver-atenciones')">
        <AppIcon name="list" :size="18" />
        <span>Atenciones</span>
      </button>

      <!-- 2) Menú de usuario (con Cerrar sesión) -->
      <div v-if="auth.nombre" class="topbar__user-menu">
        <!-- Backdrop transparente: cierra el menú al tocar fuera -->
        <div v-if="menuAbierto" class="menu-backdrop" @click="cerrarMenu"></div>

        <button class="topbar__user" type="button" :class="{ 'is-open': menuAbierto }"
          @click="alternarMenu" aria-haspopup="menu" :aria-expanded="menuAbierto">
          <AppIcon name="user" :size="18" />
          <span class="topbar__user-info">
            <span class="topbar__name">{{ auth.nombre }}</span>
            <span v-if="auth.kioscoTexto" class="topbar__kiosco">Kiosco: {{ auth.kioscoTexto }}</span>
          </span>
          <AppIcon name="chevron-down" :size="16" class="topbar__chevron" />
        </button>

        <div v-if="menuAbierto" class="topbar__menu" role="menu">
          <button class="topbar__menu-item" type="button" role="menuitem" @click="salir">
            <AppIcon name="logout" :size="18" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-3xl);
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow-xs);
}
.topbar__brand { display: flex; align-items: baseline; gap: var(--spacing-sm); }
.topbar__logo { font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); color: var(--primary-color); letter-spacing: var(--letter-spacing-tight); }
.topbar__sub { font-size: var(--font-size-sm); color: var(--text-tertiary); }
.topbar__right { display: flex; align-items: center; gap: var(--spacing-lg); }

/* Menú de usuario */
.topbar__user-menu { position: relative; }
.topbar__user {
  display: flex; align-items: center; gap: var(--spacing-sm);
  padding: 6px 10px; border-radius: var(--border-radius-md);
  background: transparent; border: 1px solid transparent; cursor: pointer;
  color: var(--text-secondary); font-family: inherit; min-height: 44px;
  transition: background-color var(--transition-fast), border-color var(--transition-fast);
}
.topbar__user:hover, .topbar__user.is-open { background: var(--bg-tertiary); border-color: var(--border-color); }
.topbar__user:focus-visible { outline: none; box-shadow: var(--shadow-focus); }
.topbar__user-info { display: flex; flex-direction: column; line-height: 1.2; text-align: left; }
.topbar__name { font-weight: var(--font-weight-semibold); color: var(--text-primary); font-size: var(--font-size-base); }
.topbar__kiosco { font-size: var(--font-size-xs); color: var(--text-tertiary); }
.topbar__chevron { color: var(--text-tertiary); transition: transform var(--transition-fast); }
.topbar__user.is-open .topbar__chevron { transform: rotate(180deg); }

.menu-backdrop { position: fixed; inset: 0; z-index: calc(var(--z-dropdown) - 1); background: transparent; }
.topbar__menu {
  position: absolute; top: calc(100% + 6px); right: 0; z-index: var(--z-dropdown);
  min-width: 210px; padding: var(--spacing-xs);
  background: var(--bg-primary); border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md); box-shadow: var(--shadow-lg);
}
.topbar__menu-item {
  display: flex; align-items: center; gap: var(--spacing-sm); width: 100%;
  padding: 11px 12px; min-height: 44px;
  background: transparent; border: none; cursor: pointer;
  color: var(--text-primary); font-size: var(--font-size-base); font-family: inherit;
  border-radius: var(--border-radius-sm); text-align: left;
  transition: background-color var(--transition-fast), color var(--transition-fast);
}
.topbar__menu-item:hover { background: var(--danger-subtle); color: var(--danger-dark); }
</style>
