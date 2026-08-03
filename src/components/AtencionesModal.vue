<script setup>
// Listado de atenciones del facilitador (modal con lista de cards).
import { ref, reactive, watch, nextTick } from 'vue'
import { listarAtenciones } from '../services/atenciones.service'
import { useUiStore } from '../stores/ui'
import AppIcon from './ui/AppIcon.vue'
import TicketPrint from './TicketPrint.vue'
import { formatFechaHora, formatMonto } from '../utils/format'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])
const ui = useUiStore()

const TAMANO = 20

const ESTADOS = {
  en_captura: { label: 'En captura', badge: 'c-badge--info' },
  capturada: { label: 'Capturada', badge: 'c-badge--warning' },
  disponible: { label: 'Disponible', badge: 'c-badge--success' },
  finalizada: { label: 'Finalizada', badge: 'c-badge--neutral' },
  cancelada: { label: 'Cancelada', badge: 'c-badge--danger' },
  recuperada: { label: 'Recuperada', badge: 'c-badge--accent' },
  vencida: { label: 'Vencida', badge: 'c-badge--neutral' },
}
const FILTROS = [
  { key: '', label: 'Todos' },
  { key: 'en_captura', label: 'En captura' },
  { key: 'capturada', label: 'Capturada' },
  { key: 'disponible', label: 'Disponible' },
  { key: 'finalizada', label: 'Finalizada' },
  { key: 'cancelada', label: 'Cancelada' },
]

const items = ref([])
const meta = reactive({ pagina: 1, totalItems: 0, totalPaginas: 1, tieneAnterior: false, tieneSiguiente: false })
const estadoFiltro = ref('')
const cargando = ref(false)
const itemImprimir = ref(null)

const estadoLabel = (e) => ESTADOS[e]?.label || e
const estadoBadge = (e) => ESTADOS[e]?.badge || 'c-badge--neutral'

async function cargar(pagina = 1) {
  cargando.value = true
  try {
    const data = await listarAtenciones({ pagina, tamano: TAMANO, estado: estadoFiltro.value || undefined })
    items.value = data?.items || []
    meta.pagina = data?.pagina ?? pagina
    meta.totalItems = data?.totalItems ?? items.value.length
    meta.totalPaginas = data?.totalPaginas ?? 1
    meta.tieneAnterior = !!data?.tieneAnterior
    meta.tieneSiguiente = !!data?.tieneSiguiente
  } catch (e) {
    items.value = []
    ui.error(e.mensaje || 'No se pudo cargar el listado de atenciones.', e.codigo)
  } finally {
    cargando.value = false
  }
}

function filtrar(key) {
  if (estadoFiltro.value === key) return
  estadoFiltro.value = key
  cargar(1)
}

async function copiarFolio(folio) {
  try {
    await navigator.clipboard.writeText(folio)
    ui.success(`Folio ${folio} copiado.`)
  } catch {
    ui.warning('No se pudo copiar automáticamente. Folio: ' + folio)
  }
}

async function reimprimir(item) {
  itemImprimir.value = item
  await nextTick()
  window.print()
}

function cerrar() {
  emit('update:modelValue', false)
}

// Carga al abrir; reinicia filtro y página.
watch(() => props.modelValue, (abierto) => {
  if (abierto) {
    estadoFiltro.value = ''
    cargar(1)
  }
})
</script>

<template>
  <transition name="modal">
    <div v-if="modelValue" class="modal-backdrop no-print" @click.self="cerrar">
      <div class="at-panel u-anim-scale" role="dialog" aria-modal="true">
        <!-- Encabezado -->
        <header class="at-head">
          <div>
            <h3 class="at-title"><AppIcon name="list" :size="20" /> Atenciones generadas</h3>
            <p class="at-sub">{{ meta.totalItems }} atención(es)</p>
          </div>
          <div class="at-head__actions">
            <button class="c-btn c-btn--ghost c-btn--sm" type="button" @click="cargar(meta.pagina)" :disabled="cargando" title="Refrescar">
              <AppIcon name="refresh" :size="16" /> Refrescar
            </button>
            <button class="at-x" type="button" @click="cerrar" aria-label="Cerrar"><AppIcon name="x" :size="18" /></button>
          </div>
        </header>

        <!-- Filtros -->
        <div class="at-filtros">
          <button v-for="f in FILTROS" :key="f.key" type="button" class="chip"
            :class="{ 'chip--active': estadoFiltro === f.key }" @click="filtrar(f.key)">{{ f.label }}</button>
        </div>

        <!-- Lista -->
        <div class="at-body">
          <div v-if="cargando" class="at-state"><span class="c-spinner"></span><span>Cargando…</span></div>
          <div v-else-if="!items.length" class="at-state at-state--empty">No hay atenciones para este filtro.</div>

          <div v-else class="at-list">
            <div v-for="it in items" :key="it.atencionId" class="at-card">
              <div class="at-card__folio">
                <span class="at-folio">{{ it.folio || '—' }}</span>
                <span class="at-idnum">#{{ it.atencionId }}</span>
              </div>

              <div class="at-card__main">
                <span class="at-tramite">{{ it.tramiteNombre }}</span>
                <div class="at-badges">
                  <span class="c-badge" :class="estadoBadge(it.estado)">{{ estadoLabel(it.estado) }}</span>
                  <span v-if="it.gratuito" class="c-badge c-badge--success">Gratuito</span>
                  <span v-else-if="it.monto != null" class="c-badge c-badge--neutral">{{ formatMonto(it.monto) }}</span>
                  <span v-if="it.documentoListo" class="c-badge c-badge--accent">Doc. listo</span>
                </div>
              </div>

              <div class="at-card__fechas">
                <div><span>Inicio</span><strong>{{ formatFechaHora(it.fechaInicio) }}</strong></div>
                <div v-if="it.fechaTicket"><span>Ticket</span><strong>{{ formatFechaHora(it.fechaTicket) }}</strong></div>
                <div v-if="it.vigenciaHasta"><span>Vigencia</span><strong>{{ formatFechaHora(it.vigenciaHasta) }}</strong></div>
              </div>

              <div class="at-card__acciones">
                <button v-if="it.folio" class="tbl-btn tbl-btn--primary" type="button" title="Copiar folio" @click="copiarFolio(it.folio)">
                  <AppIcon name="copy" :size="18" />
                </button>
                <button v-if="it.folio" class="tbl-btn" type="button" title="Reimprimir ticket" @click="reimprimir(it)">
                  <AppIcon name="print" :size="18" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Paginación -->
        <footer class="at-foot">
          <button class="c-btn c-btn--secondary c-btn--sm" type="button" :disabled="!meta.tieneAnterior || cargando" @click="cargar(meta.pagina - 1)">
            <AppIcon name="arrow-left" :size="16" /> Anterior
          </button>
          <span class="at-pag">Página {{ meta.pagina }} de {{ meta.totalPaginas }}</span>
          <button class="c-btn c-btn--secondary c-btn--sm" type="button" :disabled="!meta.tieneSiguiente || cargando" @click="cargar(meta.pagina + 1)">
            Siguiente <AppIcon name="arrow-right" :size="16" />
          </button>
        </footer>
      </div>
    </div>
  </transition>

  <!-- Ticket imprimible para la reimpresión -->
  <TicketPrint v-if="itemImprimir"
    :folio="itemImprimir.folio"
    :tramite="itemImprimir.tramiteNombre"
    :monto="itemImprimir.monto"
    :vigencia-hasta="itemImprimir.vigenciaHasta"
  />
</template>

<style scoped>
.modal-backdrop {
  position: fixed; inset: 0; z-index: var(--z-modal);
  background: rgba(15, 23, 42, 0.45);
  display: flex; align-items: center; justify-content: center;
  padding: var(--spacing-2xl);
}
.at-panel {
  display: flex; flex-direction: column;
  width: min(880px, 96vw); height: min(86vh, 820px);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
}

.at-head { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--spacing-lg); padding: var(--spacing-xl) var(--spacing-2xl); border-bottom: 1px solid var(--border-color); }
.at-title { display: flex; align-items: center; gap: var(--spacing-sm); font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); color: var(--text-primary); }
.at-sub { margin: 4px 0 0; font-size: var(--font-size-sm); color: var(--text-tertiary); }
.at-head__actions { display: flex; align-items: center; gap: var(--spacing-sm); }
.at-x { background: transparent; border: none; cursor: pointer; color: var(--text-tertiary); padding: 6px; border-radius: var(--border-radius-sm); display: inline-flex; }
.at-x:hover { background: var(--bg-tertiary); color: var(--text-primary); }

.at-filtros { display: flex; flex-wrap: wrap; gap: var(--spacing-sm); padding: var(--spacing-md) var(--spacing-2xl); border-bottom: 1px solid var(--border-color-light); background: var(--bg-secondary); }
.chip { padding: 6px 14px; min-height: 36px; border: 1px solid var(--border-color-medium); background: var(--bg-primary); border-radius: var(--border-radius-full); font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); color: var(--text-secondary); cursor: pointer; transition: all var(--transition-fast); }
.chip:hover { border-color: var(--primary-light); }
.chip--active { background: var(--primary-color); border-color: var(--primary-color); color: #fff; }

.at-body { flex: 1 1 auto; overflow-y: auto; padding: var(--spacing-lg) var(--spacing-2xl); }
.at-state { display: flex; align-items: center; justify-content: center; gap: var(--spacing-md); color: var(--text-tertiary); padding: var(--spacing-5xl); }
.at-state--empty { font-size: var(--font-size-md); }

.at-list { display: flex; flex-direction: column; gap: var(--spacing-md); }
.at-card {
  display: flex; align-items: center; gap: var(--spacing-xl);
  padding: var(--spacing-lg);
  border: 1px solid var(--border-color); border-radius: var(--border-radius-md);
  background: var(--bg-primary); transition: box-shadow var(--transition-fast), border-color var(--transition-fast);
}
.at-card:hover { box-shadow: var(--shadow-sm); border-color: var(--border-color-strong); }

.at-card__folio { flex: 0 0 150px; display: flex; flex-direction: column; gap: 2px; }
.at-folio { font-family: var(--font-family-mono); font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); color: var(--primary-color); letter-spacing: 0.04em; }
.at-idnum { font-size: var(--font-size-xs); color: var(--text-muted); }

.at-card__main { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: var(--spacing-sm); }
.at-tramite { font-weight: var(--font-weight-semibold); color: var(--text-primary); }
.at-badges { display: flex; flex-wrap: wrap; gap: var(--spacing-xs); }

.at-card__fechas { flex: 0 0 auto; display: flex; gap: var(--spacing-xl); }
.at-card__fechas div { display: flex; flex-direction: column; gap: 1px; }
.at-card__fechas span { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: var(--letter-spacing-wide); }
.at-card__fechas strong { font-size: var(--font-size-sm); color: var(--text-secondary); font-weight: var(--font-weight-medium); white-space: nowrap; }

.at-card__acciones { flex: 0 0 auto; display: flex; gap: var(--spacing-sm); }

.at-foot { display: flex; align-items: center; justify-content: space-between; gap: var(--spacing-lg); padding: var(--spacing-md) var(--spacing-2xl); border-top: 1px solid var(--border-color); background: var(--bg-secondary); }
.at-pag { font-size: var(--font-size-sm); color: var(--text-secondary); font-weight: var(--font-weight-medium); }

.modal-enter-active, .modal-leave-active { transition: opacity var(--transition-fast); }
.modal-enter-from, .modal-leave-to { opacity: 0; }

@media (max-width: 767.98px) {
  .at-card { flex-wrap: wrap; }
  .at-card__fechas { flex-basis: 100%; }
}
</style>
