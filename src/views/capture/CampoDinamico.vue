<script setup>
// Renderiza un campo del esquema según su `tipo`. Escribe directo en el objeto
// reactivo `valores` (compartido con el padre) usando la `key` del campo.
import { computed } from 'vue'
import CampoFecha from './CampoFecha.vue'
import { mayusNombre, mayusPlaca, mayusCorreo, mayusCurp } from '../../utils/texto'

const props = defineProps({
  campo: { type: Object, required: true },
  valores: { type: Object, required: true },
  invalido: { type: Boolean, default: false },
})

function set(v) {
  props.valores[props.campo.key] = v
}

// CURP: MAYÚSCULAS alfanumérico, máx 18.
function onCurp(e) {
  set(mayusCurp(e.target.value).slice(0, 18))
}

// Texto: MAYÚSCULAS sin acentos. Según el campo: nombre (solo letras),
// placa (alfanumérico, máx 8) o correo (conserva símbolos de email).
function onTexto(e) {
  const t = props.campo.transform
  const v = e.target.value
  set(t === 'correo' ? mayusCorreo(v) : t === 'placa' ? mayusPlaca(v).slice(0, 8) : mayusNombre(v))
}

// Largo máximo del input de texto (la placa se limita a 8).
const maxLenTexto = computed(() =>
  props.campo.transform === 'placa' ? 8 : props.campo.maxLength || undefined
)

// Teléfono: solo dígitos, máximo 10.
function onTelefono(e) {
  set(e.target.value.replace(/\D/g, '').slice(0, 10))
}

// Mensaje de error según el tipo y si hay valor escrito.
const mensajeError = computed(() => {
  const v = props.valores[props.campo.key]
  const vacio = v === undefined || v === null || String(v).trim() === ''
  if (!vacio && props.campo.tipo === 'curp') return 'CURP inválida (18 caracteres).'
  if (!vacio && props.campo.tipo === 'telefono') return 'El teléfono debe tener 10 dígitos.'
  return 'Este campo es obligatorio.'
})
</script>

<template>
  <!-- fecha → captura con 3 campos (Día / Mes / Año) -->
  <CampoFecha v-if="campo.tipo === 'fecha'" :campo="campo" :valores="valores" :invalido="invalido" />

  <div v-else class="c-field">
    <label class="c-label" :for="`f_${campo.key}`">
      {{ campo.label }}<span v-if="campo.obligatorio" class="req">*</span>
    </label>

    <!-- select con pocas opciones → botones (más táctil) -->
    <div v-if="campo.tipo === 'select' && campo.opciones.length <= 4"
      class="opt-group" :class="{ 'opt-group--invalid': invalido }">
      <button v-for="op in campo.opciones" :key="String(op.valor)" type="button" class="opt-btn"
        :class="{ 'opt-btn--active': valores[campo.key] === op.valor }" @click="valores[campo.key] = op.valor">
        {{ op.label }}
      </button>
    </div>

    <!-- select con muchas opciones → dropdown -->
    <select v-else-if="campo.tipo === 'select'" :id="`f_${campo.key}`" class="c-select"
      v-model="valores[campo.key]" :class="{ 'is-invalid': invalido }">
      <option value="" disabled>Selecciona…</option>
      <option v-for="op in campo.opciones" :key="String(op.valor)" :value="op.valor">{{ op.label }}</option>
    </select>

    <!-- numero -->
    <input v-else-if="campo.tipo === 'numero'" :id="`f_${campo.key}`" class="c-input" type="number"
      v-model="valores[campo.key]" :class="{ 'is-invalid': invalido }" />

    <!-- curp -->
    <input v-else-if="campo.tipo === 'curp'" :id="`f_${campo.key}`" class="c-input"
      :value="valores[campo.key]" @input="onCurp" maxlength="18" placeholder="18 caracteres"
      :class="{ 'is-invalid': invalido }" />

    <!-- telefono -->
    <input v-else-if="campo.tipo === 'telefono'" :id="`f_${campo.key}`" class="c-input"
      type="tel" inputmode="numeric" :value="valores[campo.key]" @input="onTelefono"
      maxlength="10" placeholder="10 dígitos" :class="{ 'is-invalid': invalido }" />

    <!-- texto (default): mayúsculas sin acentos según el tipo de campo -->
    <input v-else :id="`f_${campo.key}`" class="c-input" type="text"
      :value="valores[campo.key]" @input="onTexto" :maxlength="maxLenTexto"
      :class="{ 'is-invalid': invalido }" />

    <span v-if="campo.ayuda" class="c-hint">{{ campo.ayuda }}</span>
    <span v-if="invalido" class="c-hint u-text-danger">{{ mensajeError }}</span>
  </div>
</template>

<style scoped>
.req { color: var(--danger-color); margin-left: 2px; }

/* Selección por botones (para selects con pocas opciones) */
.opt-group { display: flex; flex-wrap: wrap; gap: var(--spacing-sm); }
.opt-btn {
  min-height: 46px; padding: 0 var(--spacing-xl);
  border: 1.5px solid var(--border-color-medium); border-radius: var(--border-radius-md);
  background: var(--bg-primary); color: var(--text-secondary);
  font-size: var(--font-size-md); font-weight: var(--font-weight-medium); cursor: pointer;
  transition: border-color var(--transition-fast), background-color var(--transition-fast), color var(--transition-fast);
}
.opt-btn:hover { border-color: var(--primary-light); }
.opt-btn--active { border-color: var(--primary-color); background: var(--primary-subtle); color: var(--primary-color); box-shadow: var(--shadow-focus); }
.opt-group--invalid .opt-btn { border-color: var(--danger-color); }
</style>
