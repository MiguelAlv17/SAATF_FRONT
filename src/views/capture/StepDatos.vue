<script setup>
import { ref, reactive, computed, watch, onBeforeUnmount } from 'vue'
import { useAtencionStore } from '../../stores/atencion'
import {
  detectarForma, normalizarCampos, normalizarOpciones,
  construirDatos, validarCampos, valorTelefono,
} from '../../utils/esquema'
import CampoDinamico from './CampoDinamico.vue'
import ConsultaCurp from './ConsultaCurp.vue'
import AppIcon from '../../components/ui/AppIcon.vue'
import AppHelp from '../../components/ui/AppHelp.vue'

const props = defineProps({
  mostrarErrores: { type: Boolean, default: false },
  // Sección a mostrar: 'solicitante' | 'acta' (Actas) o 'datos' (los demás).
  seccion: { type: String, default: 'datos' },
})

const atencion = useAtencionStore()
const tramite = computed(() => atencion.tramite)
const esquema = computed(() => tramite.value?.esquemaCampos || null)
const forma = computed(() => detectarForma(esquema.value))
// La ayuda de consulta CURP (gob.mx) va SOLO en el trámite de consulta de CURP.
const esConsultaCurp = computed(() => tramite.value?.clave === 'consulta_curp')

const tituloSeccion = computed(() => {
  if (props.seccion === 'solicitante') return 'Datos del solicitante'
  if (props.seccion === 'acta') return 'Tipo de acta'
  return 'Captura de datos'
})

// --- Estado de captura ---
const modoActivo = ref('')
const tipoActivo = ref('')
const valores = reactive({})

// Rehidrata el borrador guardado (formulario a medio llenar), si existe.
{
  const d = atencion.draft
  if (d && typeof d === 'object') {
    if (d.modoActivo) modoActivo.value = d.modoActivo
    if (d.tipoActivo) tipoActivo.value = d.tipoActivo
    if (d.valores && typeof d.valores === 'object') Object.assign(valores, d.valores)
  }
}

// --- Modos ---
const modos = computed(() => {
  if (forma.value !== 'modos') return []
  return Object.entries(esquema.value.modos).map(([key, m]) => ({
    key, label: m.label || key, campos: normalizarCampos(m.campos),
  }))
})

// --- Ramificado ---
const camposComunes = computed(() => (forma.value === 'ramificado' ? normalizarCampos(esquema.value.camposComunes) : []))
const selectorTipo = computed(() => (forma.value === 'ramificado' ? esquema.value.selectorTipo || null : null))
const tiposOpciones = computed(() => (selectorTipo.value ? normalizarOpciones(selectorTipo.value.opciones) : []))
const camposTipo = computed(() => {
  if (forma.value !== 'ramificado' || !tipoActivo.value) return []
  return normalizarCampos(esquema.value.tipos?.[tipoActivo.value]?.campos)
})

// --- Simple ---
const camposSimples = computed(() => (forma.value === 'simple' ? normalizarCampos(esquema.value.campos) : []))

// Todos los campos relevantes (incluye ocultos) según la forma.
const camposActivos = computed(() => {
  if (forma.value === 'modos') return modos.value.find((x) => x.key === modoActivo.value)?.campos || []
  if (forma.value === 'ramificado') return [...camposComunes.value, ...camposTipo.value]
  if (forma.value === 'simple') return camposSimples.value
  return []
})

// Campos de la sección actual (para Limpiar y validar por paso).
const camposSeccion = computed(() => {
  if (props.seccion === 'solicitante') return camposComunes.value
  if (props.seccion === 'acta') return camposTipo.value
  return camposActivos.value
})

// Visibles (sin ocultos) para renderizar.
const camposComunesVis = computed(() => camposComunes.value.filter((c) => !c.oculto))
const camposTipoVis = computed(() => camposTipo.value.filter((c) => !c.oculto))
const camposActivosVis = computed(() => camposActivos.value.filter((c) => !c.oculto))

// Inicializa el primer modo si hay varios (o el único).
watch(modos, (m) => {
  if (forma.value === 'modos' && !modoActivo.value && m.length) modoActivo.value = m[0].key
}, { immediate: true })

// Siembra los ocultos con valorFijo en los valores.
watch(camposActivos, (campos) => {
  for (const c of campos) {
    if (c.oculto && c.valorFijo !== null && c.valorFijo !== undefined && valores[c.key] === undefined) {
      valores[c.key] = c.valorFijo
    }
  }
}, { immediate: true })

// Al cambiar de tipo de acta, limpia los campos específicos (los comunes se quedan).
watch(tipoActivo, (nuevo, viejo) => {
  if (!viejo || forma.value !== 'ramificado') return
  for (const c of normalizarCampos(esquema.value.tipos?.[viejo]?.campos)) delete valores[c.key]
})

// Persiste el borrador conforme se escribe (con debounce), para reanudar
// el formulario a medio llenar tras recargar.
function snapshotBorrador() {
  return { valores: { ...valores }, modoActivo: modoActivo.value, tipoActivo: tipoActivo.value }
}
let draftTimer = null
watch([valores, modoActivo, tipoActivo], () => {
  clearTimeout(draftTimer)
  draftTimer = setTimeout(() => atencion.guardarBorrador(snapshotBorrador()), 400)
}, { deep: true })
// Flush al salir del paso, para no perder los últimos ms de captura.
onBeforeUnmount(() => {
  clearTimeout(draftTimer)
  atencion.guardarBorrador(snapshotBorrador())
})

// Limpia los campos de la sección actual (vacía inputs; re-siembra ocultos).
function limpiar() {
  for (const c of camposSeccion.value) delete valores[c.key]
  for (const c of camposSeccion.value) {
    if (c.oculto && c.valorFijo !== null && c.valorFijo !== undefined) valores[c.key] = c.valorFijo
  }
}
const puedeLimpiar = computed(() =>
  camposSeccion.value.filter((c) => !c.oculto).some((c) => {
    const v = valores[c.key]
    return v !== undefined && v !== null && v !== ''
  })
)

// --- Reutilizar datos del solicitante en los campos del tipo (Actas) ---
// Solo para tipos con campos de nombre propios (matrimonio / nacimiento por datos).
const REUSO = {
  tipos: ['matrimonio', 'nacimiento_datos'],
  mapa: [
    ['solicitante.nombre', 'nombre'],
    ['solicitante.apPaterno', 'primerApellido'],
    ['solicitante.apMaterno', 'segundoApellido'],
  ],
}
const noVacio = (v) => v !== undefined && v !== null && String(v).trim() !== ''
const mostrarReuso = computed(() =>
  forma.value === 'ramificado' && REUSO.tipos.includes(tipoActivo.value)
)
const puedeReutilizar = computed(() => {
  if (!mostrarReuso.value) return false
  const hayFuente = REUSO.mapa.some(([src]) => noVacio(valores[src]))
  const destinosVacios = REUSO.mapa.every(([, dst]) => !noVacio(valores[dst]))
  return hayFuente && destinosVacios
})
function reutilizar() {
  if (!puedeReutilizar.value) return
  for (const [src, dst] of REUSO.mapa) valores[dst] = valores[src] ?? ''
}

// Errores por campo (para resaltar).
const faltantesKeys = computed(() => new Set(validarCampos(camposActivos.value, valores).map((c) => c.key)))
function esInvalido(c) {
  return props.mostrarErrores && faltantesKeys.value.has(c.key)
}

// --- API expuesta al padre (CaptureView) ---
function validar() {
  if (props.seccion === 'solicitante') {
    return { ok: validarCampos(camposComunes.value, valores).length === 0, faltaTipo: false }
  }
  if (props.seccion === 'acta') {
    const faltaTipo = !tipoActivo.value
    const faltan = validarCampos(camposTipo.value, valores)
    return { ok: !faltaTipo && faltan.length === 0, faltaTipo }
  }
  const faltan = validarCampos(camposActivos.value, valores)
  return { ok: faltan.length === 0 && forma.value !== 'vacio', faltaTipo: false }
}

function construir() {
  const extra = {}
  if (forma.value === 'modos') extra.modo = modoActivo.value
  if (forma.value === 'ramificado' && selectorTipo.value) extra[selectorTipo.value.key] = tipoActivo.value

  const datos = construirDatos(camposActivos.value, valores, extra)

  // CURP en espejo: el campo tipo curp también va al nivel raíz del body.
  const curpCampo = camposActivos.value.find((c) => c.tipo === 'curp')
  const curp = curpCampo ? String(valores[curpCampo.key] || '').toUpperCase() : ''

  // Teléfono capturado (para prefill de WhatsApp en el ticket).
  const telefono = valorTelefono(camposActivos.value, valores)

  return { datos, curp, telefono, resumen: construirResumen() }
}

// Una fila { label, valor } a partir de un campo (resuelve label de selects).
function fila(c) {
  let v = valores[c.key]
  if (c.tipo === 'select') { const op = c.opciones.find((o) => o.valor === v); v = op ? op.label : v }
  return { label: c.label, valor: v === undefined || v === '' ? '—' : String(v) }
}
// ¿El campo pertenece al solicitante? (por convención de la llave)
function esSolicitante(key) {
  return key === 'solicitante' || String(key).startsWith('solicitante.')
}

// Resumen agrupado para la pantalla de revisión: separa "Solicitante" de
// "Datos del trámite" para que se distingan a simple vista.
function construirResumen() {
  const solicitante = []
  const tram = []

  if (forma.value === 'modos' && modos.value.length > 1) {
    const m = modos.value.find((x) => x.key === modoActivo.value)
    if (m) tram.push({ label: 'Modo de búsqueda', valor: m.label })
  }
  if (forma.value === 'ramificado' && selectorTipo.value) {
    const op = tiposOpciones.value.find((o) => o.valor === tipoActivo.value)
    tram.push({ label: selectorTipo.value.label, valor: op ? op.label : tipoActivo.value })
  }

  for (const c of camposActivos.value) {
    if (c.oculto) continue
    ;(esSolicitante(c.key) ? solicitante : tram).push(fila(c))
  }

  const secciones = []
  if (solicitante.length) secciones.push({ titulo: 'Solicitante', filas: solicitante })
  secciones.push({ titulo: 'Datos del trámite', filas: tram })
  return secciones
}

defineExpose({ validar, construir })
</script>

<template>
  <section>
    <header class="step-head">
      <div class="step-head__main">
        <h2 class="step-title">{{ tituloSeccion }}</h2>
        <p class="step-desc">{{ tramite?.nombre }}</p>
        <div v-if="esquema?.gratuito || esquema?.documentoExterno" class="badges">
          <span v-if="esquema?.gratuito" class="c-badge c-badge--success">Gratuito</span>
          <span v-if="esquema?.documentoExterno" class="c-badge c-badge--info">Documento externo</span>
        </div>
      </div>
      <button v-if="forma !== 'vacio'" class="c-btn c-btn--ghost c-btn--sm" type="button"
        @click="limpiar" :disabled="!puedeLimpiar" title="Vaciar el formulario">
        <AppIcon name="trash" :size="16" />
        <span>Limpiar</span>
      </button>
    </header>

    <div v-if="forma === 'vacio'" class="c-alert c-alert--warning">
      Este trámite aún no tiene captura definida.
    </div>

    <!-- Sección: Solicitante (Actas) -->
    <template v-else-if="seccion === 'solicitante'">
      <div class="form-grid">
        <CampoDinamico v-for="c in camposComunesVis" :key="c.key" :campo="c" :valores="valores" :invalido="esInvalido(c)" />
      </div>
    </template>

    <!-- Sección: Tipo de acta (Actas) -->
    <template v-else-if="seccion === 'acta'">
      <div class="c-field">
        <label class="c-label">{{ selectorTipo?.label }}<span class="req">*</span></label>
        <div class="tipo-grid">
          <button v-for="op in tiposOpciones" :key="String(op.valor)" type="button"
            class="select-card tipo-card" :class="{ 'is-selected': tipoActivo === op.valor }"
            @click="tipoActivo = op.valor">
            <span class="select-card__title">{{ op.label }}</span>
          </button>
        </div>
        <span v-if="mostrarErrores && !tipoActivo" class="c-hint u-text-danger">Selecciona el tipo de acta.</span>
      </div>

      <template v-if="tipoActivo">
        <div v-if="mostrarReuso" class="reuso-bar">
          <button class="c-btn c-btn--outline c-btn--sm" type="button" @click="reutilizar" :disabled="!puedeReutilizar">
            <AppIcon name="copy" :size="16" />
            <span>Reutilizar datos del solicitante</span>
          </button>
          <AppHelp>
            El botón «Reutilizar datos del solicitante» vuelve a escribir aquí el nombre y apellidos
            que capturaste en el paso anterior (Solicitante). Si ya escribiste algo abajo, se deshabilita.
          </AppHelp>
        </div>

        <div class="form-grid">
          <CampoDinamico v-for="c in camposTipoVis" :key="c.key" :campo="c" :valores="valores" :invalido="esInvalido(c)" />
        </div>
      </template>
    </template>

    <!-- Sección: Datos (modos / simple, no ramificado) -->
    <template v-else>
      <template v-if="forma === 'modos'">
        <div v-if="modos.length > 1" class="modo-tabs">
          <button v-for="m in modos" :key="m.key" type="button" class="modo-tab"
            :class="{ 'modo-tab--active': modoActivo === m.key }" @click="modoActivo = m.key">{{ m.label }}</button>
        </div>
        <div class="form-grid">
          <CampoDinamico v-for="c in camposActivosVis" :key="c.key" :campo="c" :valores="valores" :invalido="esInvalido(c)" />
        </div>
      </template>
      <div v-else class="form-grid">
        <CampoDinamico v-for="c in camposActivosVis" :key="c.key" :campo="c" :valores="valores" :invalido="esInvalido(c)" />
      </div>

      <ConsultaCurp v-if="esConsultaCurp" />
    </template>
  </section>
</template>

<style scoped>
.step-head { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--spacing-lg); margin-bottom: var(--spacing-2xl); }
.step-head__main { min-width: 0; }
.step-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-semibold); }
.step-desc { margin: var(--spacing-xs) 0 0; color: var(--text-tertiary); font-size: var(--font-size-md); }
.badges { display: flex; gap: var(--spacing-sm); margin-top: var(--spacing-sm); }

.form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-lg) var(--spacing-2xl); }
@media (max-width: 767.98px) { .form-grid { grid-template-columns: 1fr; } }

.req { color: var(--danger-color); margin-left: 2px; }

.modo-tabs { display: flex; gap: 4px; padding: 4px; background: var(--bg-tertiary); border-radius: var(--border-radius-md); margin-bottom: var(--spacing-xl); width: fit-content; }
.modo-tab { min-height: 44px; padding: 0 var(--spacing-xl); border: none; background: transparent; cursor: pointer; border-radius: var(--border-radius-sm); font-weight: var(--font-weight-medium); color: var(--text-secondary); }
.modo-tab--active { background: var(--bg-primary); color: var(--primary-color); box-shadow: var(--shadow-xs); }

/* Botones de tipo de acta */
.tipo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: var(--spacing-md); margin-top: var(--spacing-xs); }
.tipo-card { min-height: 68px; justify-content: center; }

.reuso-bar { display: flex; align-items: center; gap: var(--spacing-sm); margin: var(--spacing-xl) 0 var(--spacing-lg); }
</style>
