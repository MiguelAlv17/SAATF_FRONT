<script setup>
import { computed } from 'vue'
import { useAtencionStore } from '../../stores/atencion'
import { useUiStore } from '../../stores/ui'
import AppIcon from '../../components/ui/AppIcon.vue'
import { formatFechaHora } from '../../utils/format'

const props = defineProps({
  // Formulario compartido con el padre: { medio, telefono }
  // (El monto lo determina el backend; no se captura en el front.)
  form: { type: Object, required: true },
  mostrarErrores: { type: Boolean, default: false },
})

const atencion = useAtencionStore()
const ui = useUiStore()
const emitido = computed(() => !!atencion.folio)
const telefonoMal = computed(() =>
  props.form.medio === 'whatsapp' && !/^\d{10}$/.test(String(props.form.telefono || '').replace(/\D/g, ''))
)

// Teléfono: solo dígitos, máximo 10.
function onTelefono(e) {
  props.form.telefono = e.target.value.replace(/\D/g, '').slice(0, 10)
}

// Nombre del solicitante desde los datos capturados (Actas: objeto solicitante;
// Constancia: cadena; CURP: no aplica).
function nombreSolicitante() {
  const s = atencion.datos?.solicitante
  if (!s) return ''
  if (typeof s === 'string') return s
  return [s.nombre, s.apPaterno, s.apMaterno].filter(Boolean).join(' ')
}

function imprimir() {
  ui.imprimirTicket({
    folio: atencion.folio,
    tramite: atencion.ticket?.tramite || atencion.tramite?.nombre,
    solicitante: nombreSolicitante(),
    vigenciaHasta: atencion.vigenciaHasta,
  })
}
</script>

<template>
  <section>
    <!-- ANTES de emitir: elegir medio de entrega -->
    <template v-if="!emitido">
      <header class="step-head">
        <h2 class="step-title">Generar folio</h2>
        <p class="step-desc">Elige cómo se entrega el ticket al ciudadano.</p>
      </header>

      <div class="select-grid medios">
        <button type="button" class="select-card" :class="{ 'is-selected': form.medio === 'impresion' }" @click="form.medio = 'impresion'">
          <AppIcon name="print" :size="26" />
          <span class="select-card__title">Impresión</span>
          <span class="select-card__meta">Ticket impreso</span>
        </button>
        <button type="button" class="select-card" :class="{ 'is-selected': form.medio === 'whatsapp' }" @click="form.medio = 'whatsapp'">
          <AppIcon name="whatsapp" :size="26" />
          <span class="select-card__title">WhatsApp</span>
          <span class="select-card__meta">Envío al teléfono</span>
        </button>
      </div>

      <div v-if="form.medio === 'whatsapp'" class="form-row u-mt-5">
        <div class="c-field">
          <label class="c-label" for="tel">Teléfono (10 dígitos)</label>
          <input id="tel" class="c-input" type="tel" inputmode="numeric" :value="form.telefono" @input="onTelefono"
            maxlength="10" placeholder="10 dígitos" :class="{ 'is-invalid': mostrarErrores && telefonoMal }" />
          <span v-if="mostrarErrores && telefonoMal" class="c-hint u-text-danger">El teléfono debe tener 10 dígitos.</span>
          <span v-else class="c-hint">No se almacena; solo se usa para enviar el ticket.</span>
        </div>
      </div>
    </template>

    <!-- DESPUÉS de emitir: folio + ticket -->
    <template v-else>
      <div class="folio-result u-anim-scale">
        <div class="c-badge c-badge--success u-mb-3">
          <AppIcon name="check" :size="14" /> Folio generado
        </div>
        <p class="folio-label">Folio</p>
        <p class="folio-display">{{ atencion.folio }}</p>

        <div class="ticket-meta">
          <div><span>Trámite</span><strong>{{ atencion.ticket?.tramite || atencion.tramite?.nombre }}</strong></div>
          <div><span>Válido hasta</span><strong>{{ formatFechaHora(atencion.vigenciaHasta) }}</strong></div>
        </div>

        <button v-if="atencion.ticketMedio === 'impresion'" class="c-btn c-btn--primary c-btn--lg u-mt-4 no-print" type="button" @click="imprimir">
          <AppIcon name="print" :size="18" /> Imprimir ticket
        </button>
        <div v-else class="c-alert c-alert--success u-mt-4 no-print">
          <AppIcon name="whatsapp" :size="18" /> El ticket se envió por WhatsApp.
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.step-head { margin-bottom: var(--spacing-2xl); }
.step-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-semibold); }
.step-desc { margin: var(--spacing-xs) 0 0; color: var(--text-tertiary); font-size: var(--font-size-md); }
.medios { grid-template-columns: repeat(2, minmax(0, 260px)); }
.medios .select-card { align-items: center; text-align: center; }
.form-row { display: flex; gap: var(--spacing-2xl); flex-wrap: wrap; }
.form-row .c-field { flex: 1 1 260px; }

.folio-result { text-align: center; padding: var(--spacing-3xl); background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--border-radius-lg); box-shadow: var(--shadow-sm); }
.folio-label { margin: 0; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: var(--letter-spacing-wide); font-size: var(--font-size-xs); }
.ticket-meta { display: flex; justify-content: center; gap: var(--spacing-4xl); flex-wrap: wrap; margin-top: var(--spacing-xl); }
.ticket-meta div { display: flex; flex-direction: column; gap: 2px; }
.ticket-meta span { font-size: var(--font-size-xs); color: var(--text-tertiary); text-transform: uppercase; letter-spacing: var(--letter-spacing-wide); }
.ticket-meta strong { font-size: var(--font-size-lg); color: var(--text-primary); }
</style>
