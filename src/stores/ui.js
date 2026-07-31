// Store de UI transversal: notificaciones (toasts).
import { defineStore } from 'pinia'

let seq = 0

export const useUiStore = defineStore('ui', {
  state: () => ({
    toasts: [], // { id, tipo, mensaje, codigo }
  }),
  actions: {
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
