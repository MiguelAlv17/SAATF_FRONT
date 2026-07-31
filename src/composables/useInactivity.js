// Timer de auto-logout por inactividad.
// Usa inactividadMin del login; reinicia el contador con la actividad del usuario.
import { onBeforeUnmount, onMounted } from 'vue'

const EVENTS = ['mousedown', 'keydown', 'touchstart', 'pointerdown', 'scroll']

export function useInactivity(getMinutes, onTimeout) {
  let timer = null

  const reset = () => {
    if (timer) clearTimeout(timer)
    const min = Number(getMinutes?.()) || 0
    if (min <= 0) return
    timer = setTimeout(() => onTimeout?.(), min * 60 * 1000)
  }

  const stop = () => {
    if (timer) clearTimeout(timer)
    timer = null
    EVENTS.forEach((e) => window.removeEventListener(e, reset))
  }

  onMounted(() => {
    EVENTS.forEach((e) => window.addEventListener(e, reset, { passive: true }))
    reset()
  })

  onBeforeUnmount(stop)

  return { reset, stop }
}
