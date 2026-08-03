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
export async function guardarDatos(id, payload) {
  const res = await http.put(`/api/atenciones/${id}/datos`, payload)
  return unwrap(res)
}

// 4. POST /api/atenciones/{id}/finalizar  → pasa a "capturada"
export async function finalizarCaptura(id) {
  const res = await http.post(`/api/atenciones/${id}/finalizar`)
  return unwrap(res)
}

// 5. POST /api/atenciones/{id}/ticket  { medioEntrega, telefono? } → folio + ticket
//    (El monto lo determina el backend; el front no lo envía.)
export async function generarTicket(id, payload) {
  const res = await http.post(`/api/atenciones/${id}/ticket`, payload)
  return unwrap(res)
}

// Alterno: POST /api/atenciones/{id}/cancelar  (solo antes del ticket)
export async function cancelarAtencion(id) {
  const res = await http.post(`/api/atenciones/${id}/cancelar`)
  return unwrap(res)
}

// GET /api/atenciones?pagina=&tamano=&estado=  → listado paginado del facilitador.
// Devuelve { items, pagina, tamanoPagina, totalItems, totalPaginas, tieneAnterior, tieneSiguiente }
export async function listarAtenciones({ pagina = 1, tamano = 20, estado } = {}) {
  const params = { pagina, tamano }
  if (estado) params.estado = estado
  const res = await http.get('/api/atenciones', { params })
  return unwrap(res)
}
