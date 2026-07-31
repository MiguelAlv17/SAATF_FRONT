// Store del catálogo de trámites (se carga una vez y se cachea en memoria).
import { defineStore } from 'pinia'
import { getTramites } from '../services/catalogos.service'

export const useCatalogosStore = defineStore('catalogos', {
  state: () => ({
    tramites: [],
    cargado: false,
    cargando: false,
  }),
  actions: {
    async cargarTramites({ forzar = false } = {}) {
      if (this.cargado && !forzar) return this.tramites
      this.cargando = true
      try {
        this.tramites = await getTramites()
        this.cargado = true
        return this.tramites
      } finally {
        this.cargando = false
      }
    },
    tramitePorId(id) {
      return this.tramites.find((t) => t.tramiteId === id) || null
    },
  },
})
