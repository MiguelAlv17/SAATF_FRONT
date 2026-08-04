<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useAtencionStore } from '../stores/atencion'
import { useUiStore } from '../stores/ui'
import { useInactivity } from '../composables/useInactivity'

import AppTopbar from '../components/layout/AppTopbar.vue'
import AppModal from '../components/ui/AppModal.vue'
import AppIcon from '../components/ui/AppIcon.vue'
import AtencionesModal from '../components/AtencionesModal.vue'
import StepTramite from './capture/StepTramite.vue'
import StepDatos from './capture/StepDatos.vue'
import StepRevision from './capture/StepRevision.vue'
import StepTicket from './capture/StepTicket.vue'

const router = useRouter()
const auth = useAuthStore()
const atencion = useAtencionStore()
const ui = useUiStore()

const PASOS = [
  { key: 'tramite', label: 'Trámite' },
  { key: 'datos', label: 'Datos' },
  { key: 'revision', label: 'Revisión' },
  { key: 'ticket', label: 'Ticket' },
]

// El paso vive en el store para poder reanudar tras recargar la página.
const paso = computed({ get: () => atencion.paso, set: (v) => atencion.setPaso(v) })
const tramiteSel = ref(atencion.tramite || null)
const stepDatosRef = ref(null)
const mostrarErrores = ref(false)
const confirmCancel = ref(false)
const verAtenciones = ref(false)
const ticketForm = reactive({
  medio: atencion.ticketMedio || 'impresion',
  telefono: (atencion.telefono || '').replace(/\D/g, '').slice(0, 10),
})

const emitido = computed(() => !!atencion.folio)
const puedeCancelar = computed(() => paso.value < 3 && !emitido.value)
const puedeAtras = computed(() => (paso.value === 1 || paso.value === 2) && !emitido.value)

// Auto-logout por inactividad.
useInactivity(() => auth.inactividadMin, () => cerrarSesion({ porInactividad: true }))

// Si al entrar hay una atención persistida, avisa que se reanudó.
onMounted(() => {
  if (atencion.atencionId) {
    ui.info('Se retomó una atención en curso. Puedes continuar o cancelarla.')
  }
})

const textoAccion = computed(() => {
  if (paso.value === 0) return 'Siguiente'
  if (paso.value === 1) return 'Siguiente'
  if (paso.value === 2) return 'Finalizar captura'
  return emitido.value ? 'Nueva atención' : 'Generar folio'
})

function irAtras() {
  if (paso.value > 0) { paso.value--; mostrarErrores.value = false }
}

async function siguiente() {
  mostrarErrores.value = false
  try {
    if (paso.value === 0) return await pasoTramite()
    if (paso.value === 1) return await pasoDatos()
    if (paso.value === 2) return await pasoRevision()
    return await pasoTicket()
  } catch (e) {
    ui.error(e.mensaje || 'Ocurrió un error.', e.codigo)
  }
}

async function pasoTramite() {
  if (!tramiteSel.value) {
    ui.warning('Selecciona un trámite para continuar.')
    return
  }
  if (!atencion.atencionId) {
    await atencion.iniciar({ kioscoCapturaId: auth.kioscoActual })
  }
  await atencion.elegirTramite(tramiteSel.value)
  paso.value = 1
}

async function pasoDatos() {
  const { ok, faltaTipo } = stepDatosRef.value.validar()
  if (!ok) {
    mostrarErrores.value = true
    ui.warning(faltaTipo ? 'Selecciona una opción para continuar.' : 'Completa los campos obligatorios.')
    return
  }
  const { curp, datos, resumen, telefono } = stepDatosRef.value.construir()
  await atencion.guardar({ curp, datos, resumen, telefono })
  paso.value = 2
}

async function pasoRevision() {
  await atencion.finalizar()
  // Prefill del teléfono de WhatsApp con el capturado en el formulario.
  if (!ticketForm.telefono && atencion.telefono) {
    ticketForm.telefono = String(atencion.telefono).replace(/\D/g, '').slice(0, 10)
  }
  paso.value = 3
}

async function pasoTicket() {
  if (emitido.value) {
    reiniciar()
    return
  }
  if (ticketForm.medio === 'whatsapp') {
    const tel = String(ticketForm.telefono || '').replace(/\D/g, '')
    if (tel.length !== 10) {
      mostrarErrores.value = true
      ui.warning('Captura un teléfono válido de 10 dígitos.')
      return
    }
  }
  await atencion.emitirTicket({ medioEntrega: ticketForm.medio, telefono: ticketForm.telefono })
  ui.success('Folio generado correctamente.', 'MSG-TIC-001')
}

function reiniciar() {
  atencion.reset()
  tramiteSel.value = null
  ticketForm.medio = 'impresion'
  ticketForm.telefono = ''
  mostrarErrores.value = false
  paso.value = 0
}

async function confirmarCancelar() {
  confirmCancel.value = false
  try {
    if (atencion.atencionId) await atencion.cancelar()
    reiniciar()
    ui.info('Atención cancelada.')
  } catch (e) {
    ui.error(e.mensaje || 'No se pudo cancelar.', e.codigo)
  }
}

// Si desde el listado se canceló la atención que está activa en el wizard, reinícialo.
function onAtencionCancelada(atencionId) {
  if (atencionId === atencion.atencionId) reiniciar()
}

async function cerrarSesion({ porInactividad = false } = {}) {
  // Limpia la atención local (privacidad en tablet compartida).
  atencion.reset()
  await auth.logout()
  if (porInactividad) ui.warning('Sesión cerrada por inactividad.')
  router.push({ name: 'login' })
}
</script>

<template>
  <AppTopbar @logout="cerrarSesion()" @ver-atenciones="verAtenciones = true" />

  <div class="app-shell">
    <!-- Stepper -->
    <div class="stepper-bar no-print">
      <div class="stepper">
        <template v-for="(p, i) in PASOS" :key="p.key">
          <div class="stepper__item" :class="{ 'stepper__item--active': i === paso, 'stepper__item--done': i < paso }">
            <span class="stepper__dot"><AppIcon v-if="i < paso" name="check" :size="16" /><span v-else>{{ i + 1 }}</span></span>
            <span class="stepper__label">{{ p.label }}</span>
          </div>
          <span v-if="i < PASOS.length - 1" class="stepper__sep"></span>
        </template>
      </div>
    </div>

    <!-- Barra de información de la solicitud (aparece al seleccionar trámite) -->
    <div v-if="atencion.tramite" class="info-bar no-print">
      <div class="info-bar__item">
        <span class="info-bar__k">Atención</span>
        <span class="info-bar__v info-bar__id">#{{ atencion.atencionId ?? '—' }}</span>
      </div>
      <span class="info-bar__sep"></span>
      <div class="info-bar__item">
        <span class="info-bar__k">Trámite</span>
        <span class="info-bar__v">{{ atencion.tramite.nombre }}</span>
      </div>
      <span class="info-bar__sep"></span>
      <div class="info-bar__item">
        <span class="info-bar__k">Costo</span>
        <span class="c-badge" :class="atencion.gratuito ? 'c-badge--success' : 'c-badge--neutral'">
          {{ atencion.gratuito ? 'Gratuito' : 'Con costo' }}
        </span>
      </div>
    </div>

    <main class="app-main">
      <StepTramite v-if="paso === 0" v-model="tramiteSel" />
      <StepDatos v-else-if="paso === 1" ref="stepDatosRef" :mostrar-errores="mostrarErrores" />
      <StepRevision v-else-if="paso === 2" />
      <StepTicket v-else :form="ticketForm" :mostrar-errores="mostrarErrores" />
    </main>

    <!-- Barra de acciones -->
    <div class="app-actionbar no-print">
      <div class="actionbar__left">
        <button v-if="puedeAtras" class="c-btn c-btn--secondary" type="button" @click="irAtras" :disabled="atencion.busy">
          <AppIcon name="arrow-left" :size="18" /> Atrás
        </button>
        <button v-if="puedeCancelar" class="c-btn c-btn--outline-danger" type="button" @click="confirmCancel = true" :disabled="atencion.busy">
          <AppIcon name="trash" :size="18" /> Cancelar
        </button>
      </div>

      <button class="c-btn c-btn--primary c-btn--lg" type="button" @click="siguiente" :disabled="atencion.busy">
        <span v-if="atencion.busy" class="c-spinner" style="border-top-color:#fff;border-color:rgba(255,255,255,.4)"></span>
        <span>{{ textoAccion }}</span>
        <AppIcon v-if="!atencion.busy && !emitido" name="arrow-right" :size="18" />
      </button>
    </div>
  </div>

  <!-- Confirmar cancelación -->
  <AppModal v-model="confirmCancel" title="Cancelar atención">
    <p>¿Seguro que deseas cancelar esta atención? Se perderán los datos capturados.</p>
    <template #footer>
      <button class="c-btn c-btn--secondary" type="button" @click="confirmCancel = false">No, volver</button>
      <button class="c-btn c-btn--danger" type="button" @click="confirmarCancelar">Sí, cancelar</button>
    </template>
  </AppModal>

  <!-- Listado de atenciones -->
  <AtencionesModal v-model="verAtenciones" @cancelada="onAtencionCancelada" />
</template>

<style scoped>
.stepper-bar { display: flex; justify-content: center; padding: var(--spacing-lg) var(--spacing-3xl); background: var(--bg-primary); border-bottom: 1px solid var(--border-color); }
.stepper { width: 100%; max-width: 720px; }
.actionbar__left { display: flex; gap: var(--spacing-md); }

/* Barra de información de la solicitud — tinte azul de marca para que resalte
   y no se confunda con los datos del formulario (que van en tarjetas blancas). */
.info-bar {
  display: flex; align-items: center; flex-wrap: wrap;
  gap: var(--spacing-md) var(--spacing-xl);
  padding: var(--spacing-md) var(--spacing-3xl);
  background: var(--primary-subtle);
  border-top: 2px solid var(--primary-color);
  border-bottom: 1px solid var(--primary-ring);
}
.info-bar__item { display: flex; align-items: center; gap: var(--spacing-sm); }
.info-bar__k { font-size: var(--font-size-xs); color: var(--primary-dark); text-transform: uppercase; letter-spacing: var(--letter-spacing-wide); font-weight: var(--font-weight-semibold); }
.info-bar__v { font-size: var(--font-size-base); color: var(--text-primary); font-weight: var(--font-weight-semibold); }
.info-bar__id { background: var(--primary-color); color: #fff; padding: 3px 12px; border-radius: var(--border-radius-full); font-family: var(--font-family-mono); font-size: var(--font-size-sm); letter-spacing: 0.02em; }
.info-bar__sep { width: 1px; height: 20px; background: var(--primary-ring); }
</style>
