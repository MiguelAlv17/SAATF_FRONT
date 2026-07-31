// Utilidades de formato para la vista.

// Fecha/hora legible. La API devuelve hora de México ya resuelta
// (ej. "2026-07-30T14:00:00"); la mostramos tal cual sin re-zonificar.
export function formatFechaHora(iso) {
  if (!iso) return '—'
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  if (!m) return String(iso)
  const [, y, mo, d, h, mi] = m
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${Number(d)}/${meses[Number(mo) - 1]}/${y} ${h}:${mi}`
}

// Solo la hora HH:mm.
export function formatHora(iso) {
  if (!iso) return '—'
  const m = String(iso).match(/T(\d{2}):(\d{2})/)
  return m ? `${m[1]}:${m[2]}` : '—'
}

// Moneda MXN.
export function formatMonto(n) {
  if (n === null || n === undefined || n === '') return '—'
  const num = Number(n)
  if (Number.isNaN(num)) return '—'
  return num.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
}
