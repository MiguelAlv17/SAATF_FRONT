<script setup>
import { computed } from 'vue'
import { useAtencionStore } from '../../stores/atencion'

const atencion = useAtencionStore()
const tramite = computed(() => atencion.tramite)
const filas = computed(() => atencion.resumen || [])
</script>

<template>
  <section>
    <header class="step-head">
      <h2 class="step-title">Revisa la captura</h2>
      <p class="step-desc">Confirma que los datos son correctos antes de finalizar.</p>
    </header>

    <div class="c-card c-card--flat resumen">
      <div class="resumen__row resumen__row--head">
        <span class="resumen__k">Trámite</span>
        <span class="resumen__v">{{ tramite?.nombre }}</span>
      </div>
      <div v-for="(f, i) in filas" :key="i" class="resumen__row">
        <span class="resumen__k">{{ f.label }}</span>
        <span class="resumen__v">{{ f.valor }}</span>
      </div>
    </div>

    <div class="c-alert c-alert--info u-mt-4">
      Al finalizar, la captura pasa a <strong>capturada</strong> y podrás generar el folio.
    </div>
  </section>
</template>

<style scoped>
.step-head { margin-bottom: var(--spacing-2xl); }
.step-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-semibold); }
.step-desc { margin: var(--spacing-xs) 0 0; color: var(--text-tertiary); font-size: var(--font-size-md); }
.resumen { padding: 0; overflow: hidden; }
.resumen__row { display: flex; gap: var(--spacing-lg); padding: var(--spacing-md) var(--spacing-xl); border-bottom: 1px solid var(--border-color-light); }
.resumen__row:last-child { border-bottom: none; }
.resumen__row--head { background: var(--bg-secondary); }
.resumen__k { flex: 0 0 220px; color: var(--text-tertiary); font-weight: var(--font-weight-medium); }
.resumen__v { flex: 1 1 auto; color: var(--text-primary); font-weight: var(--font-weight-medium); word-break: break-word; }
</style>
