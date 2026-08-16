<script setup>
// Iconos SVG inline (sin dependencias, funciona offline).
// Trazo tipo "outline", hereda color con currentColor.
import { computed } from 'vue'

const props = defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 20 },
})

// Cada icono es una lista de nodos <path>/<line>/<circle> como cadenas de atributos.
const PATHS = {
  'arrow-left': ['<path d="M19 12H5"/>', '<path d="M12 19l-7-7 7-7"/>'],
  'arrow-right': ['<path d="M5 12h14"/>', '<path d="M12 5l7 7-7 7"/>'],
  check: ['<path d="M20 6L9 17l-5-5"/>'],
  'check-circle': ['<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>', '<path d="M22 4L12 14.01l-3-3"/>'],
  x: ['<path d="M18 6L6 18"/>', '<path d="M6 6l12 12"/>'],
  print: ['<path d="M6 9V2h12v7"/>', '<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>', '<rect x="6" y="14" width="12" height="8"/>'],
  whatsapp: ['<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>'],
  logout: ['<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>', '<path d="M16 17l5-5-5-5"/>', '<path d="M21 12H9"/>'],
  user: ['<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>', '<circle cx="12" cy="7" r="4"/>'],
  search: ['<circle cx="11" cy="11" r="8"/>', '<path d="M21 21l-4.35-4.35"/>'],
  ticket: ['<path d="M3 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z"/>', '<path d="M13 5v14"/>'],
  trash: ['<path d="M3 6h18"/>', '<path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>', '<path d="M10 11v6"/>', '<path d="M14 11v6"/>', '<path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>'],
  info: ['<circle cx="12" cy="12" r="10"/>', '<path d="M12 16v-4"/>', '<path d="M12 8h.01"/>'],
  alert: ['<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>', '<path d="M12 9v4"/>', '<path d="M12 17h.01"/>'],
  clock: ['<circle cx="12" cy="12" r="10"/>', '<path d="M12 6v6l4 2"/>'],
  list: ['<line x1="8" y1="6" x2="21" y2="6"/>', '<line x1="8" y1="12" x2="21" y2="12"/>', '<line x1="8" y1="18" x2="21" y2="18"/>', '<line x1="3" y1="6" x2="3.01" y2="6"/>', '<line x1="3" y1="12" x2="3.01" y2="12"/>', '<line x1="3" y1="18" x2="3.01" y2="18"/>'],
  copy: ['<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>', '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'],
  refresh: ['<path d="M23 4v6h-6"/>', '<path d="M1 20v-6h6"/>', '<path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/>', '<path d="M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>'],
  eye: ['<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>', '<circle cx="12" cy="12" r="3"/>'],
  'eye-off': ['<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>', '<path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>', '<path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/>', '<line x1="1" y1="1" x2="23" y2="23"/>'],
  help: ['<circle cx="12" cy="12" r="10"/>', '<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>', '<line x1="12" y1="17" x2="12.01" y2="17"/>'],
  'chevron-down': ['<path d="M6 9l6 6 6-6"/>'],
  building: ['<rect x="4" y="2" width="16" height="20" rx="2"/>', '<path d="M9 22v-4h6v4"/>', '<path d="M8 6h.01"/>', '<path d="M16 6h.01"/>', '<path d="M8 10h.01"/>', '<path d="M16 10h.01"/>', '<path d="M8 14h.01"/>', '<path d="M16 14h.01"/>'],
}

const nodes = computed(() => (PATHS[props.name] || []).join(''))
const px = computed(() => (typeof props.size === 'number' ? `${props.size}px` : props.size))
</script>

<template>
  <svg
    :width="px" :height="px" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
    aria-hidden="true" v-html="nodes"
  />
</template>
