// Store de sesión (autenticación).
import { defineStore } from 'pinia'
import { login as apiLogin, logout as apiLogout } from '../services/auth.service'
import { STORAGE_KEYS, DEFAULT_INACTIVITY_MIN } from '../config'

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.session)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => {
    const s = loadSession()
    return {
      token: localStorage.getItem(STORAGE_KEYS.token) || null,
      facilitador: s?.facilitador || null,
      expiracion: s?.expiracion || null,
      inactividadMin: s?.inactividadMin || DEFAULT_INACTIVITY_MIN,
    }
  },
  getters: {
    isAuthenticated: (s) => !!s.token,
    nombre: (s) => s.facilitador?.nombre || '',
    kioscoActual: (s) => s.facilitador?.kioscoActual ?? null,
  },
  actions: {
    async login({ metodo, usuario, contrasena }) {
      const data = await apiLogin({ metodo, usuario, contrasena })
      this.token = data.token
      this.facilitador = data.facilitador || null
      this.expiracion = data.expiracion || null
      this.inactividadMin = data.inactividadMin || DEFAULT_INACTIVITY_MIN
      this.persist()
      return data
    },
    persist() {
      localStorage.setItem(STORAGE_KEYS.token, this.token || '')
      localStorage.setItem(STORAGE_KEYS.session, JSON.stringify({
        facilitador: this.facilitador,
        expiracion: this.expiracion,
        inactividadMin: this.inactividadMin,
      }))
    },
    clearLocal() {
      this.token = null
      this.facilitador = null
      this.expiracion = null
      localStorage.removeItem(STORAGE_KEYS.token)
      localStorage.removeItem(STORAGE_KEYS.session)
    },
    async logout({ callApi = true } = {}) {
      if (callApi) await apiLogout()
      this.clearLocal()
    },
  },
})
