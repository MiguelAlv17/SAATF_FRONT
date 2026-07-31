<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useAtencionStore } from '../stores/atencion'
import { useUiStore } from '../stores/ui'
import { useInactivity } from '../composables/useInactivity'
import { camposFaltantes, curpValida, normalizarEsquema } from '../utils/esquema'

import AppTopbar from '../components/layout/AppTopbar.vue'
import AppModal from '../components/ui/AppModal.vue'
import AppIcon from '../components/ui/AppIcon.vue'
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

const paso = ref(0)
const tramiteSel = ref(null)
const mostrarErrores = ref(false)
const confirmCancel = ref(false)
const ticketForm = reactive({ medio: 'impresion', monto: '', telefono: '' })

const emitido = computed(() => !!atencion.folio)
const puedeCancelar = computed(() => paso.value < 3 && !emitido.value)
const puedeAtras = computed(() => (paso.value === 1 || paso.value === 2) && !emitido.value)

// Auto-logout por inactividad.
useInactivity(() => auth.inactividadMin, () => cerrarSesion({ porInactividad: true }))

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
  const campos = normalizarEsquema(atencion.tramite?.esquemaCampos)
  const faltan = camposFaltantes(campos, atencion.datos)
  const curpMal = atencion.requiereCurp && !curpValida(atencion.curp)
  if (faltan.length || curpMal) {
    mostrarErrores.value = true
    ui.warning('Completa los campos obligatorios.')
    return
  }
  await atencion.guardar({ curp: atencion.curp, datos: atencion.datos })
  paso.value = 2
}

async function pasoRevision() {
  await atencion.finalizar()
  // Prefill del monto por defecto del trámite, si existe.
  if (ticketForm.monto === '' && atencion.tramite?.montoDefault != null) {
    ticketForm.monto = atencion.tramite.montoDefault
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
  const monto = ticketForm.monto === '' ? undefined : Number(ticketForm.monto)
  await atencion.emitirTicket({ medioEntrega: ticketForm.medio, monto, telefono: ticketForm.telefono })
  ui.success('Folio generado correctamente.', 'MSG-TIC-001')
}

function reiniciar() {
  atencion.reset()
  tramiteSel.value = null
  ticketForm.medio = 'impresion'
  ticketForm.monto = ''
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

async function cerrarSesion({ porInactividad = false } = {}) {
  await auth.logout()
  if (porInactividad) ui.warning('Sesión cerrada por inactividad.')
  router.push({ name: 'login' })
}
</script>

<template>
  <AppTopbar @logout="cerrarSesion()" />

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

    <main class="app-main">
      <StepTramite v-if="paso === 0" v-model="tramiteSel" />
      <StepDatos v-else-if="paso === 1" :mostrar-errores="mostrarErrores" />
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
</template>

<style scoped>
.stepper-bar { display: flex; justify-content: center; padding: var(--spacing-lg) var(--spacing-3xl); background: var(--bg-primary); border-bottom: 1px solid var(--border-color); }
.stepper { width: 100%; max-width: 720px; }
.actionbar__left { display: flex; gap: var(--spacing-md); }
</style>
