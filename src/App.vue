<script setup>
import { RouterView } from 'vue-router'
import ToastHost from './components/ui/ToastHost.vue'
import TicketPrint from './components/TicketPrint.vue'
import { useUiStore } from './stores/ui'

const ui = useUiStore()
</script>

<template>
  <div class="app-shell">
    <RouterView />
  </div>
  <ToastHost />

  <!-- Ticket imprimible (único, se teletransporta a body) -->
  <TicketPrint
    v-if="ui.ticket"
    :folio="ui.ticket.folio"
    :tramite="ui.ticket.tramite"
    :solicitante="ui.ticket.solicitante"
    :vigencia-hasta="ui.ticket.vigenciaHasta"
  />
</template>
