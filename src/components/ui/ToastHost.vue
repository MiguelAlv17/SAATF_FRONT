<script setup>
// Contenedor global de notificaciones (esquina superior derecha).
import { storeToRefs } from 'pinia'
import { useUiStore } from '../../stores/ui'
import AppIcon from './AppIcon.vue'

const ui = useUiStore()
const { toasts } = storeToRefs(ui)

const ICON = { success: 'check-circle', danger: 'alert', warning: 'alert', info: 'info' }
</script>

<template>
  <div class="toast-host no-print" aria-live="polite">
    <transition-group name="toast">
      <div v-for="t in toasts" :key="t.id" class="c-alert toast" :class="`c-alert--${t.tipo}`">
        <AppIcon :name="ICON[t.tipo] || 'info'" :size="18" />
        <div class="toast__body">
          <div class="toast__msg">{{ t.mensaje }}</div>
          <div v-if="t.codigo" class="toast__code">{{ t.codigo }}</div>
        </div>
        <button class="toast__close" type="button" @click="ui.dismiss(t.id)" aria-label="Cerrar">
          <AppIcon name="x" :size="16" />
        </button>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toast-host {
  position: fixed;
  top: var(--spacing-lg);
  right: var(--spacing-lg);
  z-index: var(--z-notification);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  width: min(400px, calc(100vw - 32px));
}
.toast {
  box-shadow: var(--shadow-lg);
  align-items: center;
}
.toast__body { flex: 1 1 auto; min-width: 0; }
.toast__msg { font-weight: var(--font-weight-medium); }
.toast__code { font-size: var(--font-size-xs); opacity: 0.7; font-family: var(--font-family-mono); margin-top: 2px; }
.toast__close {
  background: transparent; border: none; cursor: pointer; color: inherit;
  opacity: 0.6; padding: 4px; display: inline-flex; border-radius: var(--border-radius-sm);
}
.toast__close:hover { opacity: 1; }

.toast-enter-active, .toast-leave-active { transition: all var(--transition-normal); }
.toast-enter-from { opacity: 0; transform: translateX(20px); }
.toast-leave-to { opacity: 0; transform: translateX(20px); }
</style>
