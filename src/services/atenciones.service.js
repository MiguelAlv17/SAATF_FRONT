// Flujo de captura de una atención.
import { http, unwrap } from './http'

// 1. POST /api/atenciones → { atencionId, estado, fechaInicio }
//    409 MSG-ATF-002 si el facilitador ya tiene una atención activa.
export async function crearAtencion({ kioscoCapturaId } = {}) {
  const res = await http.post('/api/atenciones', { kioscoCapturaId })
  return unwrap(res)
}

// 2. POST /api/atenciones/{id}/tramite  (solo en estado en_captura)
export async function seleccionarTramite(id, tramiteId) {
  const res = await http.post(`/api/atenciones/${id}/tramite`, { tramiteId })
  return unwrap(res)
}

// 3. PUT /api/atenciones/{id}/datos  { curp?, datos } (puede llamarse varias veces)
export async function guardarDatos(id, { curp, datos }) {
  const res = await http.put(`/api/atenciones/${id}/datos`, { curp, datos })
  return unwrap(res)
}

// 4. POST /api/atenciones/{id}/finalizar  → pasa a "capturada"
export async function finalizarCaptura(id) {
  const res = await http.post(`/api/atenciones/${id}/finalizar`)
  return unwrap(res)
}

// 5. POST /api/atenciones/{id}/ticket  { medioEntrega, monto? } → folio + ticket
export async function generarTicket(id, { medioEntrega, monto }) {
  const res = await http.post(`/api/atenciones/${id}/ticket`, { medioEntrega, monto })
  return unwrap(res)
}

// Alterno: POST /api/atenciones/{id}/cancelar  (solo antes del ticket)
export async function cancelarAtencion(id) {
  const res = await http.post(`/api/atenciones/${id}/cancelar`)
  return unwrap(res)
}
