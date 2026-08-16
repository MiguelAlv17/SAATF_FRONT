// Normalización de texto para captura. Los nombres se guardan en MAYÚSCULAS y
// sin acentos porque afectan las búsquedas de actas (RENAPO). La Ñ se conserva.

// Mapa de vocales/letras acentuadas → su base (NO incluye Ñ/ñ, que se conservan).
const SIN_ACENTO = {
  á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ü: 'u', à: 'a', è: 'e', ì: 'i', ò: 'o', ù: 'u',
  ä: 'a', ë: 'e', ï: 'i', ö: 'o', â: 'a', ê: 'e', î: 'i', ô: 'o', û: 'u', ã: 'a', õ: 'o', ç: 'c',
  Á: 'A', É: 'E', Í: 'I', Ó: 'O', Ú: 'U', Ü: 'U', À: 'A', È: 'E', Ì: 'I', Ò: 'O', Ù: 'U',
  Ä: 'A', Ë: 'E', Ï: 'I', Ö: 'O', Â: 'A', Ê: 'E', Î: 'I', Ô: 'O', Û: 'U', Ã: 'A', Õ: 'O', Ç: 'C',
}

// Quita acentos/diacríticos PERO conserva la Ñ/ñ.
export function quitarAcentos(s) {
  return String(s ?? '').replace(
    /[áéíóúüàèìòùäëïöâêîôûãõçÁÉÍÓÚÜÀÈÌÒÙÄËÏÖÂÊÎÔÛÃÕÇ]/g,
    (c) => SIN_ACENTO[c] || c,
  )
}

// Nombres/apellidos: MAYÚSCULAS, sin acentos (conserva Ñ), solo letras y espacios.
export function mayusNombre(s) {
  return quitarAcentos(s).toUpperCase().replace(/[^A-ZÑ ]/g, '').replace(/ {2,}/g, ' ')
}

// Placa: MAYÚSCULAS alfanumérico (sin acentos ni símbolos).
export function mayusPlaca(s) {
  return quitarAcentos(s).toUpperCase().replace(/[^A-Z0-9]/g, '')
}

// CURP: MAYÚSCULAS alfanumérico.
export function mayusCurp(s) {
  return quitarAcentos(s).toUpperCase().replace(/[^A-Z0-9]/g, '')
}

// Correo: MAYÚSCULAS, sin acentos, conservando los símbolos válidos de un email.
export function mayusCorreo(s) {
  return quitarAcentos(s).toUpperCase().replace(/[^A-Z0-9@._%+\-]/g, '')
}
