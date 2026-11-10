// email.js — validación única de correos para toda la tienda (registro, ingreso, recuperación,
// factura, contacto y suscripción). Sigue las reglas prácticas de los estándares RFC 5321 y 5322:
//  - Un solo @, sin espacios. Máximo 254 caracteres en total y 64 antes del @.
//  - Antes del @: letras, números y . _ % + - ; sin empezar ni terminar en punto y sin dos puntos seguidos.
//  - Después del @: dominio con al menos un punto; cada parte de 1 a 63 caracteres, letras, números y
//    guion (sin empezar ni terminar en guion); la terminación (.com, .co…) solo letras y mínimo 2.
// Además detecta errores de digitación comunes (gmial.com, hotmal.com…) y sugiere la corrección.

export const MENSAJE_CORREO = 'Introduce un correo válido.';

const LOCAL = /^[A-Za-z0-9_%+-]+(?:\.[A-Za-z0-9_%+-]+)*$/;
const ETIQUETA = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/;

const DOMINIOS = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'yahoo.es', 'icloud.com', 'live.com', 'hotmail.es', 'outlook.es', 'msn.com', 'protonmail.com', 'une.net.co', 'unal.edu.co'];
const ERRORES = {
  'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gmal.com': 'gmail.com', 'gamil.com': 'gmail.com', 'gnail.com': 'gmail.com',
  'gmail.co': 'gmail.com', 'gmail.con': 'gmail.com', 'gmail.cm': 'gmail.com', 'gmail.om': 'gmail.com', 'gmaill.com': 'gmail.com', 'gmail.comm': 'gmail.com',
  'hotmial.com': 'hotmail.com', 'hotmal.com': 'hotmail.com', 'hotmai.com': 'hotmail.com', 'hotamil.com': 'hotmail.com', 'hotmail.co': 'hotmail.com', 'hotmail.con': 'hotmail.com', 'homail.com': 'hotmail.com',
  'outlok.com': 'outlook.com', 'outllok.com': 'outlook.com', 'outlook.co': 'outlook.com', 'outlook.con': 'outlook.com',
  'yaho.com': 'yahoo.com', 'yahooo.com': 'yahoo.com', 'yahoo.co': 'yahoo.com', 'yahoo.con': 'yahoo.com',
  'iclou.com': 'icloud.com', 'icloud.co': 'icloud.com'
};

export function limpiarCorreo(v) { return String(v ?? '').trim().toLowerCase(); }

// Devuelve el dominio corregido si parece un error de digitación, o ''.
export function sugerirCorreo(v) {
  const email = limpiarCorreo(v);
  const at = email.lastIndexOf('@');
  if (at < 1) return '';
  const dominio = email.slice(at + 1);
  const correcto = ERRORES[dominio];
  return correcto && !DOMINIOS.includes(dominio) ? `${email.slice(0, at)}@${correcto}` : '';
}

// '' si es válido; si no, el mensaje de error.
export function validarCorreo(v) {
  const email = limpiarCorreo(v);
  if (!email || email.length > 254 || /\s/.test(email)) return MENSAJE_CORREO;
  const partes = email.split('@');
  if (partes.length !== 2) return MENSAJE_CORREO;
  const [local, dominio] = partes;
  if (!local || local.length > 64 || !LOCAL.test(local)) return MENSAJE_CORREO;
  const etiquetas = dominio.split('.');
  if (etiquetas.length < 2 || !etiquetas.every((e) => ETIQUETA.test(e))) return MENSAJE_CORREO;
  if (!/^[a-z]{2,}$/.test(etiquetas[etiquetas.length - 1])) return MENSAJE_CORREO;
  const s = sugerirCorreo(email);
  if (s) return `${MENSAJE_CORREO} ¿Quisiste decir ${s}?`;
  return '';
}

// Valida un campo mientras se escribe: muestra el error al salir del campo y lo quita al corregirlo.
// mostrar(texto) recibe el mensaje ('' para limpiarlo).
export function enlazarCorreo(input, mostrar, validar = validarCorreo) {
  let tocado = false;
  input.addEventListener('blur', () => {
    if (!input.value.trim()) return;
    tocado = true;
    const m = validar(input.value);
    mostrar(m); input.setAttribute('aria-invalid', m ? 'true' : 'false');
  });
  input.addEventListener('input', () => {
    if (!tocado) return;
    const m = validar(input.value);
    if (!m) { mostrar(''); input.setAttribute('aria-invalid', 'false'); }
  });
  return () => { tocado = true; const m = validar(input.value); mostrar(m); input.setAttribute('aria-invalid', m ? 'true' : 'false'); return !m; };
}

// Crea (si no existe) un mensaje de error debajo de un campo suelto y devuelve la función para mostrarlo.
export function mensajeBajo(input) {
  let el = document.getElementById(`${input.id || input.name}-correo-error`);
  if (!el) {
    el = document.createElement('small');
    el.className = 'email-error';
    el.id = `${input.id || input.name}-correo-error`;
    el.setAttribute('aria-live', 'polite');
    input.setAttribute('aria-describedby', el.id);
    const form = input.closest('.inline-form');
    if (form) form.appendChild(el);                       // suscripción: debajo de la fila campo + botón
    else if (input.closest('label')) input.closest('label').appendChild(el); // formularios: dentro de su etiqueta
    else input.insertAdjacentElement('afterend', el);
  }
  return (texto) => { el.textContent = texto || ''; input.classList.toggle('is-invalid', Boolean(texto)); };
}
