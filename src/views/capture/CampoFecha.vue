<script setup>
// Captura de fecha con 3 campos (Día / Mes / Año), pensada para tablet y para
// fechas viejas (nacimientos): sin calendario. Escribe internamente un string
// "yyyy-MM-dd" en valores[campo.key] (igual que un <input type="date">), así el
// resto del código —incluido el formato por campo— no cambia.
// Reglas: día 1–31 y válido para el mes, año 1900–actual, sin fechas futuras.
import { ref, computed, watch } from 'vue'

const props = defineProps({
  campo: { type: Object, required: true },
  valores: { type: Object, required: true },
  invalido: { type: Boolean, default: false },
})

const MESES = [
  { v: 1, n: 'Enero' }, { v: 2, n: 'Febrero' }, { v: 3, n: 'Marzo' }, { v: 4, n: 'Abril' },
  { v: 5, n: 'Mayo' }, { v: 6, n: 'Junio' }, { v: 7, n: 'Julio' }, { v: 8, n: 'Agosto' },
  { v: 9, n: 'Septiembre' }, { v: 10, n: 'Octubre' }, { v: 11, n: 'Noviembre' }, { v: 12, n: 'Diciembre' },
]
const ANIO_MIN = 1900
const hoy = new Date()
hoy.setHours(0, 0, 0, 0)
const ANIO_MAX = hoy.getFullYear()

const dia = ref('')
const mes = ref('')
const anio = ref('')

// --- Inicializa desde el valor existente (yyyy-MM-dd) ---
function parseISO(v) {
  const m = String(v || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (m) {
    anio.value = m[1]
    mes.value = parseInt(m[2], 10)
    dia.value = String(parseInt(m[3], 10))
  } else {
    dia.value = ''
    mes.value = ''
    anio.value = ''
  }
}
parseISO(props.valores[props.campo.key])

// Días del mes (maneja bisiestos).
function diasDelMes(m, y) {
  return new Date(y, m, 0).getDate()
}

// Arma el ISO solo si la fecha es completa, real, en rango y no futura.
function computarISO() {
  const d = parseInt(dia.value, 10)
  const m = parseInt(mes.value, 10)
  const y = parseInt(anio.value, 10)
  if (!d || !m || !y) return ''
  if (m < 1 || m > 12) return ''
  if (y < ANIO_MIN || y > ANIO_MAX) return ''
  if (d < 1 || d > diasDelMes(m, y)) return ''
  const f = new Date(y, m - 1, d)
  f.setHours(0, 0, 0, 0)
  if (f.getTime() > hoy.getTime()) return ''
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function onDia(e) { dia.value = e.target.value.replace(/\D/g, '').slice(0, 2) }
function onAnio(e) { anio.value = e.target.value.replace(/\D/g, '').slice(0, 4) }

// Escribe el ISO (o '') en los valores cuando cambian los campos.
watch([dia, mes, anio], () => { props.valores[props.campo.key] = computarISO() })

// Refleja cambios externos (limpiar / reset / reutilizar).
watch(() => props.valores[props.campo.key], (nv) => {
  if (nv === computarISO()) return
  parseISO(nv)
})

// Mensaje de error específico según lo capturado.
const mensajeError = computed(() => {
  if (!dia.value || !mes.value || !anio.value) return 'Completa la fecha (día, mes y año).'
  const d = parseInt(dia.value, 10)
  const m = parseInt(mes.value, 10)
  const y = parseInt(anio.value, 10)
  if (y < ANIO_MIN || y > ANIO_MAX) return `El año debe estar entre ${ANIO_MIN} y ${ANIO_MAX}.`
  if (d < 1 || d > 31) return 'El día debe estar entre 1 y 31.'
  if (d > diasDelMes(m, y)) return 'Ese día no existe en el mes elegido.'
  const f = new Date(y, m - 1, d)
  f.setHours(0, 0, 0, 0)
  if (f.getTime() > hoy.getTime()) return 'La fecha no puede ser futura.'
  return 'Fecha inválida.'
})
</script>

<template>
  <div class="c-field">
    <label class="c-label" :for="`f_${campo.key}`">
      {{ campo.label }}<span v-if="campo.obligatorio" class="req">*</span>
    </label>

    <div class="fecha-row">
      <input :id="`f_${campo.key}`" class="c-input fecha-dia" type="text" inputmode="numeric"
        maxlength="2" placeholder="Día" :value="dia" @input="onDia" :class="{ 'is-invalid': invalido }" />
      <select class="c-select fecha-mes" v-model="mes" :class="{ 'is-invalid': invalido }" aria-label="Mes">
        <option value="" disabled>Mes</option>
        <option v-for="m in MESES" :key="m.v" :value="m.v">{{ m.n }}</option>
      </select>
      <input class="c-input fecha-anio" type="text" inputmode="numeric"
        maxlength="4" placeholder="Año" :value="anio" @input="onAnio" :class="{ 'is-invalid': invalido }" />
    </div>

    <span v-if="campo.ayuda" class="c-hint">{{ campo.ayuda }}</span>
    <span v-if="invalido" class="c-hint u-text-danger">{{ mensajeError }}</span>
  </div>
</template>

<style scoped>
.req { color: var(--danger-color); margin-left: 2px; }
.fecha-row { display: flex; gap: var(--spacing-sm); }
.fecha-dia { flex: 0 0 84px; text-align: center; }
.fecha-anio { flex: 0 0 104px; text-align: center; }
.fecha-mes { flex: 1 1 auto; min-width: 0; }
</style>
