// Catálogos.
import { http, unwrap } from './http'

// GET /api/catalogos/tramites → arreglo de trámites habilitados (ordenados).
export async function getTramites() {
  const res = await http.get('/api/catalogos/tramites')
  return unwrap(res) ?? []
}
