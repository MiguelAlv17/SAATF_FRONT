<script setup>
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useCatalogosStore } from '../../stores/catalogos'
import { useUiStore } from '../../stores/ui'

const props = defineProps({
  modelValue: { type: Object, default: null }, // trámite seleccionado
})
const emit = defineEmits(['update:modelValue'])

const catalogos = useCatalogosStore()
const ui = useUiStore()
const { tramites, cargando } = storeToRefs(catalogos)

onMounted(async () => {
  try {
    await catalogos.cargarTramites()
  } catch (e) {
    ui.error(e.mensaje || 'No se pudo cargar el catálogo de trámites.', e.codigo)
  }
})

function elegir(t) {
  emit('update:modelValue', t)
}
</script>

<template>
  <section>
    <header class="step-head">
      <h2 class="step-title">Selecciona el trámite</h2>
      <p class="step-desc">Elige el trámite que va a realizar el ciudadano.</p>
    </header>

    <div v-if="cargando" class="step-loading">
      <span class="c-spinner"></span>
      <span>Cargando trámites…</span>
    </div>

    <div v-else-if="!tramites.length" class="c-alert c-alert--info">
      No hay trámites habilitados en el catálogo.
    </div>

    <div v-else class="select-grid">
      <button
        v-for="t in tramites" :key="t.tramiteId" type="button"
        class="select-card" :class="{ 'is-selected': modelValue?.tramiteId === t.tramiteId }"
        @click="elegir(t)"
      >
        <span class="select-card__title">{{ t.nombre }}</span>
        <span class="select-card__meta">
          <span v-if="t.requiereCurp" class="c-badge c-badge--neutral">CURP</span>
          <span v-if="t.requiereActa" class="c-badge c-badge--neutral">Acta</span>
          <span v-if="t.capturaPropia" class="c-badge c-badge--accent">Formulario</span>
        </span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.step-head { margin-bottom: var(--spacing-2xl); }
.step-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-semibold); }
.step-desc { margin: var(--spacing-xs) 0 0; color: var(--text-tertiary); font-size: var(--font-size-md); }
.step-loading { display: flex; align-items: center; gap: var(--spacing-md); color: var(--text-tertiary); padding: var(--spacing-3xl); }
.select-card__meta { display: flex; gap: var(--spacing-xs); flex-wrap: wrap; margin-top: auto; }
</style>
