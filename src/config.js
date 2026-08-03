// Configuración central de la app SAATF (front web de captura).
// En desarrollo, VITE_API_BASE queda vacío y las llamadas a /api las redirige
// el proxy de Vite hacia QA (ver vite.config.js). En producción se puede
// definir VITE_API_BASE al origen real de la API.
export const API_BASE = import.meta.env.VITE_API_BASE ?? ''

// Claves de persistencia en localStorage.
export const STORAGE_KEYS = {
  token: 'saatf.token',
  session: 'saatf.session',
  atencion: 'saatf.atencion',
}

// Minutos de inactividad por defecto si el login no lo especifica.
export const DEFAULT_INACTIVITY_MIN = 60
