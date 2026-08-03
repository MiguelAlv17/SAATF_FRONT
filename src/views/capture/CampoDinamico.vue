<script setup>
// Renderiza un campo del esquema según su `tipo`. Escribe directo en el objeto
// reactivo `valores` (compartido con el padre) usando la `key` del campo.
const props = defineProps({
  campo: { type: Object, required: true },
  valores: { type: Object, required: true },
  invalido: { type: Boolean, default: false },
})

function onMayus(e) {
  props.valores[props.campo.key] = e.target.value.toUpperCase()
}
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

    <!-- texto (default) -->
    <input v-else :id="`f_${campo.key}`" class="c-input" type="text"
      v-model="valores[campo.key]" :maxlength="campo.maxLength || undefined"
      :class="{ 'is-invalid': invalido }" />

    <span v-if="campo.ayuda" class="c-hint">{{ campo.ayuda }}</span>
    <span v-if="invalido" class="c-hint u-text-danger">
      {{ campo.tipo === 'curp' ? 'CURP inválida (18 caracteres).' : 'Este campo es obligatorio.' }}
    </span>
  </div>
</template>

<style scoped>
.req { color: var(--danger-color); margin-left: 2px; }
</style>
