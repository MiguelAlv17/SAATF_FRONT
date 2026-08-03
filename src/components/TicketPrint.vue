<script setup>
// Bloque imprimible del ticket (oculto en pantalla, visible solo al imprimir).
// Reutilizado por el paso Ticket y por la reimpresión desde el listado.
import { formatFechaHora, formatMonto } from '../utils/format'

defineProps({
  folio: { type: String, default: '' },
  tramite: { type: String, default: '' },
  monto: { type: [Number, String], default: null },
  vigenciaHasta: { type: String, default: null },
})
</script>

<template>
  <div class="print-ticket">
    <h2>SAATF — Ticket de atención</h2>
    <p class="print-ticket__folio">{{ folio }}</p>
    <p>Trámite: {{ tramite }}</p>
    <p>Monto: {{ formatMonto(monto) }}</p>
    <p>Válido hasta: {{ formatFechaHora(vigenciaHasta) }}</p>
    <p class="print-ticket__hint">Presenta este folio en el kiosco antes de la hora de vigencia.</p>
  </div>
</template>

<style scoped>
.print-ticket h2 { font-size: 18px; margin-bottom: 8px; }
.print-ticket p { margin: 4px 0; font-size: 13px; }
.print-ticket__hint { margin-top: 16px !important; font-size: 12px; }
</style>
