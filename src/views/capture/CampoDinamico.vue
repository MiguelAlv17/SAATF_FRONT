<script setup>
// Renderiza un campo del esquema según su `tipo`. Escribe directo en el objeto
// reactivo `valores` (compartido con el padre) usando la `key` del campo.
import { computed } from 'vue'

const props = defineProps({
  campo: { type: Object, required: true },
  valores: { type: Object, required: true },
  invalido: { type: Boolean, default: false },
})

function onMayus(e) {
  props.valores[props.campo.key] = e.target.value.toUpperCase()
}

// Teléfono: solo dígitos, máximo 10.
function onTelefono(e) {
  props.valores[props.campo.key] = e.target.value.replace(/\D/g, '').slice(0, 10)
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
  <div class="c-field">
    <label class="c-label" :for="`f_${campo.key}`">
      {{ campo.label }}<span v-if="campo.obligatorio" class="req">*</span>
    </label>

    <!-- select -->
    <select v-if="campo.tipo === 'select'" :id="`f_${campo.key}`" class="c-select"
      v-model="valores[campo.key]" :class="{ 'is-invalid': invalido }">
      <option value="" disabled>Selecciona…</option>
      <option v-for="op in campo.opciones" :key="String(op.valor)" :value="op.valor">{{ op.label }}</option>
    </select>

    <!-- fecha -->
    <input v-else-if="campo.tipo === 'fecha'" :id="`f_${campo.key}`" class="c-input" type="date"
      v-model="valores[campo.key]" :class="{ 'is-invalid': invalido }" />

    <!-- numero -->
    <input v-else-if="campo.tipo === 'numero'" :id="`f_${campo.key}`" class="c-input" type="number"
      v-model="valores[campo.key]" :class="{ 'is-invalid': invalido }" />

    <!-- curp -->
    <input v-else-if="campo.tipo === 'curp'" :id="`f_${campo.key}`" class="c-input"
      :value="valores[campo.key]" @input="onMayus" maxlength="18" placeholder="18 caracteres"
      :class="{ 'is-invalid': invalido }" />

    <!-- placa -->
    <input v-else-if="campo.tipo === 'placa'" :id="`f_${campo.key}`" class="c-input"
      :value="valores[campo.key]" @input="onMayus" :maxlength="campo.maxLength || undefined"
      placeholder="Placa" :class="{ 'is-invalid': invalido }" />

    <!-- telefono -->
    <input v-else-if="campo.tipo === 'telefono'" :id="`f_${campo.key}`" class="c-input"
      type="tel" inputmode="numeric" :value="valores[campo.key]" @input="onTelefono"
      maxlength="10" placeholder="10 dígitos" :class="{ 'is-invalid': invalido }" />

    <!-- texto (default) -->
    <input v-else :id="`f_${campo.key}`" class="c-input" type="text"
      v-model="valores[campo.key]" :maxlength="campo.maxLength || undefined"
      :class="{ 'is-invalid': invalido }" />

    <span v-if="campo.ayuda" class="c-hint">{{ campo.ayuda }}</span>
    <span v-if="invalido" class="c-hint u-text-danger">{{ mensajeError }}</span>
  </div>
</template>

<style scoped>
.req { color: var(--danger-color); margin-left: 2px; }
</style>
