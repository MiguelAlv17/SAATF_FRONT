// Store del flujo de captura de una atención.
// Estados: null → en_captura → capturada → disponible
// Persiste en localStorage para poder reanudar tras recargar la página.
// (No se persiste el teléfono de WhatsApp; sí CURP/datos por necesidad de reanudar.)
import { defineStore } from 'pinia'
import { STORAGE_KEYS } from '../config'
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
  datos: {}, // campos capturados según esquemaCampos (ya anidados)
  resumen: [], // [{ label, valor }] para la pantalla de revisión
  telefono: '', // teléfono capturado en el formulario (prefill de WhatsApp en el ticket)
  draft: null, // borrador del formulario de datos (para reanudar a medio llenar)
  paso: 0, // paso actual del wizard (para reanudar)
  ticketMedio: 'impresion', // medio de entrega elegido (para reanudar el ticket)
  // Resultado del ticket:
  folio: null,
  ticket: null,
  vigenciaHasta: null,
  monto: null,
})

// Lee el estado persistido (o null si no hay / está corrupto).
function cargarPersistido() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.atencion)
    const data = raw ? JSON.parse(raw) : null
    return data && data.atencionId ? data : null
  } catch {
    return null
  }
}

export const useAtencionStore = defineStore('atencion', {
  state: () => ({
    ...estadoInicial(),
    ...(cargarPersistido() || {}),
    busy: false,
  }),
  getters: {
    activa: (s) => !!s.atencionId && s.estado !== 'disponible',
    tramiteId: (s) => s.tramite?.tramiteId ?? null,
    requiereCurp: (s) => !!s.tramite?.requiereCurp,
    gratuito: (s) => s.tramite?.esquemaCampos?.gratuito === true,
    // ¿Hay una atención reanudable guardada?
    reanudada: (s) => !!s.atencionId,
  },
  actions: {
    // Guarda el estado relevante en localStorage (o lo borra si no hay atención).
    persistir() {
      try {
        if (!this.atencionId) {
          localStorage.removeItem(STORAGE_KEYS.atencion)
          return
        }
        const { busy, ...resto } = this.$state
        localStorage.setItem(STORAGE_KEYS.atencion, JSON.stringify(resto))
      } catch {
        // Sin persistencia disponible (modo privado, cuota) — no es crítico.
      }
    },

    setPaso(n) {
      this.paso = n
      this.persistir()
    },

    // Guarda el borrador del formulario de datos (formulario a medio llenar).
    guardarBorrador(draft) {
      this.draft = draft
      this.persistir()
    },

    async iniciar({ kioscoCapturaId } = {}) {
      this.busy = true
      try {
        const data = await crearAtencion({ kioscoCapturaId })
        this.atencionId = data.atencionId
        this.estado = data.estado
        this.fechaInicio = data.fechaInicio
        this.persistir()
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
        this.persistir()
      } finally {
        this.busy = false
      }
    },

    async guardar({ curp, datos, resumen, telefono } = {}) {
      this.busy = true
      try {
        if (curp !== undefined) this.curp = curp
        if (datos !== undefined) this.datos = { ...datos }
        if (resumen !== undefined) this.resumen = resumen
        if (telefono !== undefined) this.telefono = telefono
        // CURP en espejo: se manda al nivel raíz solo si hay valor.
        const payload = { datos: this.datos }
        if (this.curp) payload.curp = this.curp
        await guardarDatos(this.atencionId, payload)
        this.persistir()
      } finally {
        this.busy = false
      }
    },

    async finalizar() {
      this.busy = true
      try {
        const data = await finalizarCaptura(this.atencionId)
        this.estado = data?.estado || 'capturada'
        this.persistir()
        return data
      } finally {
        this.busy = false
      }
    },

    async emitirTicket({ medioEntrega, telefono } = {}) {
      this.busy = true
      try {
        // El monto lo determina el backend; el front no lo envía.
        // El teléfono para WhatsApp se envía solo si aplica; el backend no lo almacena.
        const payload = { medioEntrega }
        if (medioEntrega === 'whatsapp' && telefono) payload.telefono = telefono
        const data = await generarTicket(this.atencionId, payload)
        this.folio = data.folio
        this.ticket = data.ticket
        this.vigenciaHasta = data.vigenciaHasta
        this.monto = data.monto // monto calculado por el backend, solo para mostrar
        this.estado = data.estado || 'disponible'
        this.ticketMedio = medioEntrega
        this.persistir()
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
      try {
        localStorage.removeItem(STORAGE_KEYS.atencion)
      } catch {
        // sin storage — ignorar
      }
    },
  },
})
