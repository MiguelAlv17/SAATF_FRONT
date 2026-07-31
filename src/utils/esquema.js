// Normaliza el `esquemaCampos` de un trámite a una forma estable para el
// formulario dinámico. El .md no fija la estructura exacta, así que aceptamos
// varias formas comunes (arreglo directo, { campos: [...] }) y varios alias de
// nombres de propiedad. Cuando tengamos un esquema real, se ajusta aquí.

const TIPOS_VALIDOS = ['text', 'number', 'email', 'tel', 'date', 'select', 'textarea', 'checkbox']

function pick(obj, keys, def) {
  for (const k of keys) if (obj[k] !== undefined && obj[k] !== null) return obj[k]
  return def
}

function normalizarCampo(raw, i) {
  const clave = pick(raw, ['clave', 'key', 'nombre', 'name', 'id'], `campo_${i}`)
  let tipo = String(pick(raw, ['tipo', 'type'], 'text')).toLowerCase()
  if (!TIPOS_VALIDOS.includes(tipo)) tipo = 'text'
  const opcionesRaw = pick(raw, ['opciones', 'options', 'valores'], [])
  const opciones = (Array.isArray(opcionesRaw) ? opcionesRaw : []).map((o) =>
    typeof o === 'object' ? { valor: pick(o, ['valor', 'value', 'id'], ''), etiqueta: pick(o, ['etiqueta', 'label', 'texto'], '') } : { valor: o, etiqueta: String(o) }
  )
  return {
    clave: String(clave),
    etiqueta: pick(raw, ['etiqueta', 'label', 'titulo'], String(clave)),
    tipo,
    requerido: !!pick(raw, ['requerido', 'required', 'obligatorio'], false),
    placeholder: pick(raw, ['placeholder', 'ejemplo'], ''),
    ayuda: pick(raw, ['ayuda', 'hint', 'descripcion'], ''),
    opciones,
    max: pick(raw, ['max', 'maximo', 'maxLength'], null),
    min: pick(raw, ['min', 'minimo', 'minLength'], null),
  }
}

// Devuelve un arreglo de campos normalizados (posiblemente vacío).
export function normalizarEsquema(esquemaCampos) {
  if (!esquemaCampos) return []
  let raw = esquemaCampos
  if (typeof raw === 'string') {
    try { raw = JSON.parse(raw) } catch { return [] }
  }
  const lista = Array.isArray(raw) ? raw : (Array.isArray(raw.campos) ? raw.campos : (Array.isArray(raw.fields) ? raw.fields : []))
  return lista.map(normalizarCampo)
}

// Valida los datos capturados contra los campos. Devuelve arreglo de claves faltantes.
export function camposFaltantes(campos, datos) {
  return campos
    .filter((c) => c.requerido)
    .filter((c) => {
      const v = datos?.[c.clave]
      return v === undefined || v === null || String(v).trim() === ''
    })
    .map((c) => c.clave)
}

// Validación básica de CURP (18 caracteres alfanuméricos en mayúsculas).
export function curpValida(curp) {
  return /^[A-Z0-9]{18}$/.test(String(curp || '').toUpperCase())
}
