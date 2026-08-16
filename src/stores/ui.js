// Store de UI transversal: notificaciones (toasts) e impresión de ticket.
import { defineStore } from 'pinia'
import { nextTick } from 'vue'

let seq = 0

export const useUiStore = defineStore('ui', {
  state: () => ({
    toasts: [], // { id, tipo, mensaje, codigo }
    ticket: null, // { folio, tramite, solicitante, vigenciaHasta }
  }),
  actions: {
    // Monta el ticket (fuera de #app) e imprime. La impresora térmica de 80mm
    // usa @page size 80mm auto (ver base.css) para que el largo sea el del texto.
    async imprimirTicket({ folio, tramite, solicitante, vigenciaHasta } = {}) {
      this.ticket = { folio, tramite, solicitante, vigenciaHasta }
      await nextTick()
      window.print()
    },
    notify({ tipo = 'info', mensaje, codigo = null, timeout = 4500 }) {
      const id = ++seq
      this.toasts.push({ id, tipo, mensaje, codigo })
      if (timeout) setTimeout(() => this.dismiss(id), timeout)
      return id
    },
    success(mensaje, codigo) { return this.notify({ tipo: 'success', mensaje, codigo }) },
    error(mensaje, codigo) { return this.notify({ tipo: 'danger', mensaje, codigo, timeout: 6000 }) },
    warning(mensaje, codigo) { return this.notify({ tipo: 'warning', mensaje, codigo }) },
    info(mensaje, codigo) { return this.notify({ tipo: 'info', mensaje, codigo }) },
    dismiss(id) {
      this.toasts = this.toasts.filter((t) => t.id !== id)
    },
  },
})
