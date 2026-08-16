<script setup>
// Ícono (?) que despliega un tooltip al tocarlo (pensado para tablet: click,
// no hover). Se cierra al tocar fuera. El texto va en el slot.
import { ref, onBeforeUnmount } from 'vue'
import AppIcon from './AppIcon.vue'

const abierto = ref(false)
const root = ref(null)

function onFuera(e) {
  if (root.value && !root.value.contains(e.target)) cerrar()
}
function abrir() {
  abierto.value = true
  document.addEventListener('mousedown', onFuera)
}
function cerrar() {
  abierto.value = false
  document.removeEventListener('mousedown', onFuera)
}
function alternar() {
  abierto.value ? cerrar() : abrir()
}
onBeforeUnmount(() => document.removeEventListener('mousedown', onFuera))
</script>

<template>
  <span class="help" ref="root">
    <button type="button" class="help__btn" :class="{ 'is-open': abierto }" @click="alternar" aria-label="Ayuda">
      <AppIcon name="help" :size="18" />
    </button>
    <transition name="help-fade">
      <div v-if="abierto" class="help__tip" role="tooltip">
        <slot />
      </div>
    </transition>
  </span>
</template>

<style scoped>
.help { position: relative; display: inline-flex; }
.help__btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 30px; height: 30px; padding: 0;
  background: transparent; border: none; cursor: pointer;
  color: var(--text-tertiary); border-radius: var(--border-radius-full);
  transition: color var(--transition-fast), background-color var(--transition-fast);
}
.help__btn:hover, .help__btn.is-open { color: var(--primary-color); background: var(--primary-subtle); }
.help__btn:focus-visible { outline: none; box-shadow: var(--shadow-focus); }

.help__tip {
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  z-index: var(--z-tooltip);
  width: max(220px, 16vw);
  max-width: 300px;
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--bg-dark);
  color: #fff;
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-lg);
}
.help__tip::before {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-bottom-color: var(--bg-dark);
}

.help-fade-enter-active, .help-fade-leave-active { transition: opacity var(--transition-fast), transform var(--transition-fast); }
.help-fade-enter-from, .help-fade-leave-to { opacity: 0; transform: translateX(-50%) translateY(-4px); }
</style>
