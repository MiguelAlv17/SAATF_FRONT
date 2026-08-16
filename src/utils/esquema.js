// Parseo de `esquemaCampos` para el formulario dinámico.
// Soporta las tres formas del catálogo: Modos, Ramificado y Campos simples.
// Ver guía: SAATF_Front_Parseo_Esquema.md

// ---------------------------------------------------------------------------
// Detección de forma
// ---------------------------------------------------------------------------
export function detectarForma(esquema) {
  if (!esquema || typeof esquema !== 'object') return 'vacio'
  if (esquema.modos) return 'modos'
  if (esquema.tipos) return 'ramificado'
  if (esquema.campos) return 'simple'
  return 'vacio'
}

// ---------------------------------------------------------------------------
// Normalización de un campo individual
// ---------------------------------------------------------------------------
// Nota: "placa" NO está en la lista → se coacciona a 'texto' (se captura como
// texto simple, sin transformación a mayúsculas).
const TIPOS = ['texto', 'numero', 'fecha', 'select', 'curp', 'telefono']

// ¿La llave/etiqueta indican un campo de teléfono?
function esCampoTelefono(key, label) {
  return /(^|\.)tel[eé]fono$/i.test(String(key)) || /tel[eé]fono/i.test(String(label))
}

// Transformación de texto a aplicar a un campo tipo 'texto':
//  - 'correo' (mantiene símbolos de email), 'placa' (alfanumérico), o 'nombre'.
function transformTexto(key, label) {
  if (/correo|e-?mail/i.test(key) || /correo|e-?mail/i.test(label)) return 'correo'
  if (/placa/i.test(key) || /placa/i.test(label)) return 'placa'
  return 'nombre'
}

export function normalizarCampo(raw, i = 0) {
  const key = String(raw?.key ?? raw?.clave ?? `campo_${i}`)
  const label = raw?.label ?? raw?.etiqueta ?? key
  let tipo = String(raw?.tipo ?? 'texto').toLowerCase()
  if (tipo === 'tel') tipo = 'telefono'
  if (!TIPOS.includes(tipo)) tipo = 'texto'
  // Un texto que "parece" teléfono se trata como teléfono (validación 10 dígitos).
  if (tipo === 'texto' && esCampoTelefono(key, label)) tipo = 'telefono'
  return {
    key,
    label,
    tipo,
    transform: tipo === 'texto' ? transformTexto(key, label) : null,
    obligatorio: !!raw?.obligatorio,
    maxLength: raw?.maxLength ?? null,
    formato: raw?.formato ?? null,
    opciones: normalizarOpciones(raw?.opciones),
    valorFijo: raw?.valorFijo !== undefined ? raw.valorFijo : null,
    oculto: !!raw?.oculto,
    ayuda: raw?.ayuda ?? '',
  }
}

// Opciones de un select. Acepta arreglo de strings o de objetos { valor, label }.
// Conserva el tipo del `valor` (número o string) — importante para casos como
// `opcion` de matrimonio (1/2).
export function normalizarOpciones(op) {
  if (!Array.isArray(op)) return []
  return op.map((o) =>
    o && typeof o === 'object'
      ? { valor: o.valor ?? o.value ?? o.id, label: String(o.label ?? o.etiqueta ?? o.valor ?? '') }
      : { valor: o, label: String(o) }
  )
}

export function normalizarCampos(lista) {
  return (Array.isArray(lista) ? lista : []).map(normalizarCampo)
}

// ---------------------------------------------------------------------------
// Claves anidadas: "solicitante.nombre" → { solicitante: { nombre: ... } }
// ---------------------------------------------------------------------------
export function asignarRuta(obj, ruta, valor) {
  const partes = String(ruta).split('.')
  let cur = obj
  for (let i = 0; i < partes.length - 1; i++) {
    const p = partes[i]
    if (typeof cur[p] !== 'object' || cur[p] === null) cur[p] = {}
    cur = cur[p]
  }
  cur[partes[partes.length - 1]] = valor
  return obj
}

// ---------------------------------------------------------------------------
// Fechas: el <input type="date"> entrega "yyyy-MM-dd"; se convierte al formato
// que pide el campo (dd/MM/yyyy o yyyy-MM-dd).
// ---------------------------------------------------------------------------
export function formatearFecha(valorISO, formato) {
  if (!valorISO) return valorISO
  const m = String(valorISO).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return valorISO
  const [, y, mo, d] = m
  if (formato === 'dd/MM/yyyy') return `${d}/${mo}/${y}`
  if (formato === 'yyyy-MM-dd') return `${y}-${mo}-${d}`
  return valorISO
}

// ---------------------------------------------------------------------------
// Construcción del objeto `datos` a partir de los campos activos + valores.
// - Respeta claves anidadas.
// - Incluye ocultos con `valorFijo`.
// - Convierte fechas al formato del campo y numeros a Number.
// - Omite opcionales vacíos.
// `extra` son llaves planas de nivel superior (ej. { modo } o { tipoActa }).
// ---------------------------------------------------------------------------
export function construirDatos(campos, valores, extra = {}) {
  const datos = {}
  for (const [k, v] of Object.entries(extra)) {
    if (v !== undefined && v !== null && v !== '') asignarRuta(datos, k, v)
  }
  for (const c of campos) {
    let v
    if (c.oculto && c.valorFijo !== null && c.valorFijo !== undefined) {
      v = c.valorFijo
    } else {
      v = valores[c.key]
    }
    if (v === undefined || v === null || v === '') continue
    if (c.tipo === 'fecha') v = formatearFecha(v, c.formato)
    else if (c.tipo === 'numero') v = Number(v)
    asignarRuta(datos, c.key, v)
  }
  return datos
}

// ---------------------------------------------------------------------------
// Validación de obligatorios. Devuelve arreglo de campos faltantes/ inválidos.
// Los ocultos (con valorFijo) se consideran satisfechos.
// ---------------------------------------------------------------------------
export function validarCampos(campos, valores) {
  const faltan = []
  for (const c of campos) {
    if (c.oculto) continue
    const v = valores[c.key]
    const vacio = v === undefined || v === null || String(v).trim() === ''
    if (c.obligatorio && vacio) { faltan.push(c); continue }
    if (c.tipo === 'curp' && !vacio && !curpValida(v)) faltan.push(c)
    if (c.tipo === 'telefono' && !vacio && !telefonoValido(v)) faltan.push(c)
  }
  return faltan
}

// Validación básica de CURP (18 caracteres alfanuméricos en mayúsculas).
export function curpValida(curp) {
  return /^[A-Z0-9]{18}$/.test(String(curp || '').toUpperCase())
}

// Validación de teléfono: exactamente 10 dígitos.
export function telefonoValido(tel) {
  return /^\d{10}$/.test(String(tel || '').replace(/\D/g, ''))
}

// Busca un valor de teléfono entre los campos capturados (por tipo o key/label),
// para reutilizarlo como número de WhatsApp en el ticket. Devuelve solo dígitos.
export function valorTelefono(campos, valores) {
  const c = campos.find((x) => x.tipo === 'telefono') ||
    campos.find((x) => /(^|\.)tel[eé]fono$/i.test(x.key) || /tel[eé]fono/i.test(x.label))
  if (!c) return ''
  return String(valores[c.key] || '').replace(/\D/g, '').slice(0, 10)
}
