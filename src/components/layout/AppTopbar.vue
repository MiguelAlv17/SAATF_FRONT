<script setup>
// Barra superior: marca + datos del facilitador + cerrar sesión.
import { useAuthStore } from '../../stores/auth'
import AppIcon from './../ui/AppIcon.vue'

const emit = defineEmits(['logout', 'ver-atenciones'])
const auth = useAuthStore()
</script>

<template>
  <header class="topbar no-print">
    <div class="topbar__brand">
      <span class="topbar__logo">SAATF</span>
      <span class="topbar__sub">Atención en fila</span>
    </div>

    <div class="topbar__right">
      <div v-if="auth.nombre" class="topbar__user">
        <AppIcon name="user" :size="18" />
        <div class="topbar__user-info">
          <span class="topbar__name">{{ auth.nombre }}</span>
          <span v-if="auth.kioscoActual" class="topbar__kiosco">Kiosco {{ auth.kioscoActual }}</span>
        </div>
      </div>
      <button class="c-btn c-btn--ghost" type="button" @click="emit('ver-atenciones')">
        <AppIcon name="list" :size="18" />
        <span>Atenciones</span>
      </button>
      <button class="c-btn c-btn--ghost" type="button" @click="emit('logout')">
        <AppIcon name="logout" :size="18" />
        <span>Salir</span>
      </button>
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
.topbar__user { display: flex; align-items: center; gap: var(--spacing-sm); color: var(--text-secondary); }
.topbar__user-info { display: flex; flex-direction: column; line-height: 1.2; }
.topbar__name { font-weight: var(--font-weight-semibold); color: var(--text-primary); font-size: var(--font-size-base); }
.topbar__kiosco { font-size: var(--font-size-xs); color: var(--text-tertiary); }
</style>
