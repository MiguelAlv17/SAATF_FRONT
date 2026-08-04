<script setup>
import { computed } from 'vue'
import { useAtencionStore } from '../../stores/atencion'

const atencion = useAtencionStore()
const tramite = computed(() => atencion.tramite)

// Acepta el nuevo formato por secciones [{ titulo, filas }] o (legado) filas planas.
const secciones = computed(() => {
  const r = atencion.resumen || []
  if (r.length && r[0] && Array.isArray(r[0].filas)) return r
  return r.length ? [{ titulo: 'Datos del trámite', filas: r }] : []
})
</script>

<template>
  <section>
    <header class="step-head">
      <h2 class="step-title">Revisa la captura</h2>
      <p class="step-desc">
        <strong>{{ tramite?.nombre }}</strong> — confirma que los datos son correctos antes de finalizar.
      </p>
    </header>

    <div class="resumen-cols">
      <div v-for="(sec, i) in secciones" :key="i" class="c-card c-card--flat resumen-card">
        <h3 class="resumen-card__title">{{ sec.titulo }}</h3>
        <div class="resumen">
          <div v-for="(f, j) in sec.filas" :key="j" class="resumen__row">
            <span class="resumen__k">{{ f.label }}</span>
            <span class="resumen__v">{{ f.valor }}</span>
          </div>
          <p v-if="!sec.filas.length" class="resumen__empty">Sin datos.</p>
        </div>
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

.resumen-cols {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--spacing-lg);
  align-items: start;
}
.resumen-card { padding: 0; overflow: hidden; }
.resumen-card__title {
  margin: 0;
  padding: var(--spacing-md) var(--spacing-xl);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wide);
  color: var(--primary-dark);
  background: var(--primary-subtle);
  border-bottom: 1px solid var(--border-color);
}

.resumen__row { display: flex; gap: var(--spacing-lg); padding: var(--spacing-md) var(--spacing-xl); border-bottom: 1px solid var(--border-color-light); }
.resumen__row:last-child { border-bottom: none; }
.resumen__k { flex: 0 0 45%; color: var(--text-tertiary); font-weight: var(--font-weight-medium); }
.resumen__v { flex: 1 1 auto; color: var(--text-primary); font-weight: var(--font-weight-medium); word-break: break-word; }
.resumen__empty { padding: var(--spacing-md) var(--spacing-xl); color: var(--text-muted); font-size: var(--font-size-sm); margin: 0; }
</style>
