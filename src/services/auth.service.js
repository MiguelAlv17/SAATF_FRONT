// Endpoints de autenticación.
import { http, unwrap } from './http'

// POST /api/auth/login  → { token, expiracion, inactividadMin, facilitador }
export async function login({ metodo, usuario, contrasena }) {
  const res = await http.post('/api/auth/login', { metodo, usuario, contrasena })
  return unwrap(res)
}

// POST /api/auth/logout  (registra el cierre; el front igual borra el token local)
export async function logout() {
  try {
    await http.post('/api/auth/logout')
  } catch {
    // Ignoramos errores: el cierre local siempre procede.
  }
}
