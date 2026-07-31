<script setup>
// Modal simple con backdrop. Controlado por v-model.
import { watch } from 'vue'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  closeOnBackdrop: { type: Boolean, default: true },
})
const emit = defineEmits(['update:modelValue'])

function close() { emit('update:modelValue', false) }

// Cierra con Escape.
watch(() => props.modelValue, (open) => {
  const onKey = (e) => { if (e.key === 'Escape') close() }
  if (open) window.addEventListener('keydown', onKey)
  else window.removeEventListener('keydown', onKey)
})
</script>

<template>
  <transition name="modal">
    <div v-if="modelValue" class="modal-backdrop no-print" @click.self="closeOnBackdrop && close()">
      <div class="modal-panel c-card u-anim-scale" role="dialog" aria-modal="true">
        <div class="modal-head">
          <h3 class="c-card__title">{{ title }}</h3>
          <button class="modal-x" type="button" @click="close" aria-label="Cerrar">
            <AppIcon name="x" :size="18" />
          </button>
        </div>
        <div class="modal-body"><slot /></div>
        <div v-if="$slots.footer" class="modal-foot"><slot name="footer" /></div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.modal-backdrop {
  position: fixed; inset: 0; z-index: var(--z-modal);
  background: rgba(15, 23, 42, 0.45);
  display: flex; align-items: center; justify-content: center;
  padding: var(--spacing-2xl);
}
.modal-panel { width: min(520px, 100%); padding: var(--spacing-2xl); }
.modal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--spacing-md); }
.modal-x { background: transparent; border: none; cursor: pointer; color: var(--text-tertiary); padding: 6px; border-radius: var(--border-radius-sm); display: inline-flex; }
.modal-x:hover { background: var(--bg-tertiary); color: var(--text-primary); }
.modal-body { color: var(--text-secondary); }
.modal-foot { margin-top: var(--spacing-xl); display: flex; justify-content: flex-end; gap: var(--spacing-md); }

.modal-enter-active, .modal-leave-active { transition: opacity var(--transition-fast); }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
