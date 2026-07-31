<script setup>
import { computed } from 'vue'
import { useAtencionStore } from '../../stores/atencion'
import { normalizarEsquema, camposFaltantes, curpValida } from '../../utils/esquema'

const props = defineProps({
  mostrarErrores: { type: Boolean, default: false },
})

const atencion = useAtencionStore()
const tramite = computed(() => atencion.tramite)
const campos = computed(() => normalizarEsquema(tramite.value?.esquemaCampos))
const requiereCurp = computed(() => !!tramite.value?.requiereCurp)

// Trámite sin formulario propio y sin CURP: se resuelve con servicios externos.
const sinCaptura = computed(() => !requiereCurp.value && campos.value.length === 0)

const faltantes = computed(() => camposFaltantes(campos.value, atencion.datos))
const curpMal = computed(() => requiereCurp.value && !curpValida(atencion.curp))

function esInvalido(clave) {
  return props.mostrarErrores && faltantes.value.includes(clave)
}
</script>

<template>
  <section>
    <header class="step-head">
      <h2 class="step-title">Captura de datos</h2>
      <p class="step-desc">{{ tramite?.nombre }}</p>
    </header>

    <div v-if="sinCaptura" class="c-alert c-alert--info">
      Este trámite no requiere captura adicional; los datos se obtienen de los servicios externos.
    </div>

    <div class="form-grid">
      <!-- CURP -->
      <div v-if="requiereCurp" class="c-field form-grid__full">
        <label class="c-label" for="curp">CURP</label>
        <input
          id="curp" class="c-input" v-model="atencion.curp" maxlength="18"
          placeholder="18 caracteres" :class="{ 'is-invalid': mostrarErrores && curpMal }"
          @input="atencion.curp = atencion.curp.toUpperCase()"
        />
        <span v-if="mostrarErrores && curpMal" class="c-hint u-text-danger">CURP inválida (18 caracteres).</span>
      </div>

      <!-- Campos dinámicos -->
      <div
        v-for="c in campos" :key="c.clave" class="c-field"
        :class="{ 'form-grid__full': c.tipo === 'textarea' }"
      >
        <label class="c-label" :for="`f_${c.clave}`">
          {{ c.etiqueta }}<span v-if="c.requerido" class="req">*</span>
        </label>

        <select v-if="c.tipo === 'select'" :id="`f_${c.clave}`" class="c-select"
          v-model="atencion.datos[c.clave]" :class="{ 'is-invalid': esInvalido(c.clave) }">
          <option value="" disabled>Selecciona…</option>
          <option v-for="op in c.opciones" :key="op.valor" :value="op.valor">{{ op.etiqueta }}</option>
        </select>

        <textarea v-else-if="c.tipo === 'textarea'" :id="`f_${c.clave}`" class="c-textarea"
          v-model="atencion.datos[c.clave]" :placeholder="c.placeholder" :class="{ 'is-invalid': esInvalido(c.clave) }" />

        <label v-else-if="c.tipo === 'checkbox'" class="check-row">
          <input type="checkbox" v-model="atencion.datos[c.clave]" />
          <span>{{ c.placeholder || 'Sí' }}</span>
        </label>

        <input v-else :id="`f_${c.clave}`" class="c-input" :type="c.tipo"
          v-model="atencion.datos[c.clave]" :placeholder="c.placeholder"
          :maxlength="c.max || undefined" :class="{ 'is-invalid': esInvalido(c.clave) }" />

        <span v-if="c.ayuda" class="c-hint">{{ c.ayuda }}</span>
        <span v-if="esInvalido(c.clave)" class="c-hint u-text-danger">Este campo es obligatorio.</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.step-head { margin-bottom: var(--spacing-2xl); }
.step-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-semibold); }
.step-desc { margin: var(--spacing-xs) 0 0; color: var(--text-tertiary); font-size: var(--font-size-md); }
.form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-lg) var(--spacing-2xl); }
.form-grid__full { grid-column: 1 / -1; }
.req { color: var(--danger-color); margin-left: 2px; }
.check-row { display: flex; align-items: center; gap: var(--spacing-sm); min-height: 48px; cursor: pointer; }
.check-row input { width: 20px; height: 20px; }
@media (max-width: 767.98px) { .form-grid { grid-template-columns: 1fr; } }
</style>
