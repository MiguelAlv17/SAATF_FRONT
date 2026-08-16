<script setup>
// Ticket imprimible (impresora térmica 80mm). Se teletransporta a <body> para
// que al imprimir el documento sea SOLO el ticket. Estilos en base.css (@print).
// El "Ten un buen día" al final es texto real: obliga a la impresora a avanzar
// el papel (los renglones en blanco de arriba sí se imprimen al haber texto después).
import { formatFechaHora } from '../utils/format'

defineProps({
  folio: { type: String, default: '' },
  tramite: { type: String, default: '' },
  solicitante: { type: String, default: '' },
  vigenciaHasta: { type: String, default: null },
})
</script>

<template>
  <Teleport to="body">
    <div class="print-ticket">
      <div class="pt-brand">* SAATF *</div>
      <p class="pt-subtitle">Ticket de Pre-atención</p>

      <div class="pt-sep"></div>
      <p class="pt-folio">{{ folio }}</p>
      <div class="pt-sep"></div>

      <p class="pt-line">Trámite: {{ tramite }}</p>
      <p v-if="solicitante" class="pt-line">Solicitante: {{ solicitante }}</p>
      <p class="pt-line">Presenta este folio en el kiosco antes de la hora de vigencia.</p>
      <p class="pt-line">Válido hasta: {{ formatFechaHora(vigenciaHasta) }}</p>

      <div class="pt-sep"></div>

      <div class="pt-feed">&nbsp;<br />&nbsp;<br />&nbsp;<br />&nbsp;<br />&nbsp;<br />&nbsp;</div>
      <p class="pt-bye">Ten un buen día</p>
    </div>
  </Teleport>
</template>
