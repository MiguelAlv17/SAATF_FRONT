// Cliente HTTP central (axios) con interceptores.
// - Adjunta el token JWT en Authorization.
// - Normaliza el sobre { exito, codigo, mensaje, data } de la API.
// - Ante un 401 (token vencido) dispara el manejador global de sesión.
import axios from 'axios'
import { API_BASE, STORAGE_KEYS } from '../config'

export const http = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
})

// Manejador de 401 registrado desde main.js (evita import circular con router/stores).
let onUnauthorized = null
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn
}

// --- Request: adjunta el token ---
http.interceptors.request.use((cfg) => {
  const token = localStorage.getItem(STORAGE_KEYS.token)
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// --- Response ---
http.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status
    if (status === 401 && typeof onUnauthorized === 'function') {
      onUnauthorized()
    }
    return Promise.reject(toApiError(error))
  }
)

// Error normalizado que consume toda la app.
export class ApiError extends Error {
  constructor({ status, codigo, mensaje, data }) {
    super(mensaje || 'Error de comunicación con el servicio')
    this.name = 'ApiError'
    // La app consume `mensaje` (español); Error solo expone `message`.
    this.mensaje = mensaje || 'Error de comunicación con el servicio'
    this.status = status ?? 0
    this.codigo = codigo ?? null
    this.data = data ?? null
  }
}

function toApiError(error) {
  const status = error.response?.status
  const body = error.response?.data
  if (body && typeof body === 'object') {
    return new ApiError({
      status,
      codigo: body.codigo,
      mensaje: body.mensaje,
      data: body.data,
    })
  }
  // Sin respuesta del servidor (red, CORS, timeout).
  const mensaje = error.code === 'ECONNABORTED'
    ? 'La solicitud tardó demasiado. Intenta de nuevo.'
    : 'No se pudo conectar con el servicio.'
  return new ApiError({ status, codigo: 'NET-000', mensaje })
}

// Desempaqueta el sobre estándar de una respuesta 2xx.
// Devuelve `data` cuando exito === true; si no, lanza ApiError.
export function unwrap(res) {
  const body = res?.data
  if (body && typeof body === 'object' && 'exito' in body) {
    if (body.exito) return body.data
    throw new ApiError({ status: res.status, codigo: body.codigo, mensaje: body.mensaje, data: body.data })
  }
  return body
}
