// Store del flujo de captura de una atención.
// Estados: null → en_captura → capturada → disponible
// Se mantiene en memoria (no persiste datos sensibles como CURP/teléfono).
import { defineStore } from 'pinia'
import {
  crearAtencion,
  seleccionarTramite,
  guardarDatos,
  finalizarCaptura,
  generarTicket,
  cancelarAtencion,
} from '../services/atenciones.service'

const estadoInicial = () => ({
  atencionId: null,
  estado: null,
  fechaInicio: null,
  tramite: null, // objeto del catálogo
  curp: '',
  datos: {}, // campos capturados según esquemaCampos
  // Resultado del ticket:
  folio: null,
  ticket: null,
  vigenciaHasta: null,
  monto: null,
})

export const useAtencionStore = defineStore('atencion', {
  state: () => ({
    ...estadoInicial(),
    busy: false,
  }),
  getters: {
    activa: (s) => !!s.atencionId && s.estado !== 'disponible',
    tramiteId: (s) => s.tramite?.tramiteId ?? null,
    requiereCurp: (s) => !!s.tramite?.requiereCurp,
    // Paso actual del wizard (0-index) derivado del estado + selección.
    pasoSugerido: (s) => {
      if (!s.atencionId) return 0
      if (s.estado === 'capturada') return 2
      if (s.tramite) return 1
      return 0
    },
  },
  actions: {
    async iniciar({ kioscoCapturaId } = {}) {
      this.busy = true
      try {
        const data = await crearAtencion({ kioscoCapturaId })
        this.atencionId = data.atencionId
        this.estado = data.estado
        this.fechaInicio = data.fechaInicio
        return data
      } finally {
        this.busy = false
      }
    },

    async elegirTramite(tramite) {
      this.busy = true
      try {
        await seleccionarTramite(this.atencionId, tramite.tramiteId)
        this.tramite = tramite
      } finally {
        this.busy = false
      }
    },

    async guardar({ curp, datos } = {}) {
      this.busy = true
      try {
        if (curp !== undefined) this.curp = curp
        if (datos !== undefined) this.datos = { ...datos }
        await guardarDatos(this.atencionId, {
          curp: this.requiereCurp ? this.curp : undefined,
          datos: this.datos,
        })
      } finally {
        this.busy = false
      }
    },

    async finalizar() {
      this.busy = true
      try {
        const data = await finalizarCaptura(this.atencionId)
        this.estado = data?.estado || 'capturada'
        return data
      } finally {
        this.busy = false
      }
    },

    async emitirTicket({ medioEntrega, monto, telefono } = {}) {
      this.busy = true
      try {
        // Nota: la API documenta { medioEntrega, monto }. El teléfono para
        // WhatsApp se envía solo si aplica; el backend no lo almacena.
        const payload = { medioEntrega, monto }
        if (medioEntrega === 'whatsapp' && telefono) payload.telefono = telefono
        const data = await generarTicket(this.atencionId, payload)
        this.folio = data.folio
        this.ticket = data.ticket
        this.vigenciaHasta = data.vigenciaHasta
        this.monto = data.monto
        this.estado = data.estado || 'disponible'
        return data
      } finally {
        this.busy = false
      }
    },

    async cancelar() {
      if (!this.atencionId) return
      this.busy = true
      try {
        await cancelarAtencion(this.atencionId)
      } finally {
        this.busy = false
        this.reset()
      }
    },

    reset() {
      Object.assign(this, estadoInicial())
    },
  },
})
