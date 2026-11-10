// colombia.js — datos y validaciones para clientes en Colombia.
// Todas las funciones validate* devuelven '' si el dato es válido, o el mensaje de error.

export const DEPARTAMENTOS = [
  'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bogotá D.C.', 'Bolívar', 'Boyacá', 'Caldas', 'Caquetá',
  'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba', 'Cundinamarca', 'Guainía', 'Guaviare', 'Huila', 'La Guajira',
  'Magdalena', 'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda',
  'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima', 'Valle del Cauca', 'Vaupés', 'Vichada'
];

export const TIPOS_DOCUMENTO = [
  { id: 'CC', nombre: 'Cédula de ciudadanía' },
  { id: 'CE', nombre: 'Cédula de extranjería' },
  { id: 'PPT', nombre: 'Permiso por Protección Temporal' },
  { id: 'PA', nombre: 'Pasaporte' }
];

export const TIPOS_VIA = ['Calle', 'Carrera', 'Avenida', 'Avenida Calle', 'Avenida Carrera', 'Diagonal', 'Transversal', 'Circular', 'Autopista', 'Kilómetro', 'Vía'];

export const LIMITES = {
  nombre: 40, documento: 10, celular: 10, correo: 120, claveMin: 10, claveMax: 64,
  municipio: 50, barrio: 60, complemento: 60, indicaciones: 200, numeroVia: 6
};
export const EDAD_MINIMA = 18;

const LETRAS = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ '-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;

// Quita espacios repetidos y caracteres invisibles o de control.
const INVISIBLES = new RegExp('[\\u0000-\\u001F\\u007F-\\u009F\\u200B-\\u200F\\u2028-\\u202F\\uFEFF]', 'g');
export function limpiar(v) {
  return String(v ?? '').normalize('NFC').replace(INVISIBLES, '').replace(/\s+/g, ' ').trim();
}
export const soloDigitos = (v) => String(v ?? '').replace(/\D/g, '');

export function validarNombres(v, campo = 'nombres') {
  const s = limpiar(v);
  if (!s) return `Escribe tus ${campo}.`;
  if (s.length < 2) return `Tus ${campo} deben tener al menos 2 letras.`;
  if (s.length > LIMITES.nombre) return `Máximo ${LIMITES.nombre} caracteres.`;
  if (!LETRAS.test(s)) return 'Solo letras, espacios, guion o apóstrofo. Sin números ni símbolos.';
  if (/(.)\1{2,}/iu.test(s)) return 'Revisa: hay letras repetidas de más.';
  if (!/[aeiouáéíóúü]/i.test(s)) return 'Revisa que esté bien escrito.';
  return '';
}

export function validarDocumento(tipo, numero) {
  const raw = limpiar(numero).toUpperCase();
  if (!TIPOS_DOCUMENTO.some((t) => t.id === tipo)) return 'Elige el tipo de documento.';
  if (!raw) return 'Escribe tu número de documento.';
  if (tipo === 'PA') {
    if (!/^[A-Z0-9]{6,10}$/.test(raw)) return 'El pasaporte tiene de 6 a 10 letras o números, sin espacios.';
    return '';
  }
  if (!/^\d+$/.test(raw)) return 'Solo números, sin puntos ni espacios.';
  if (raw.startsWith('0')) return 'El número no puede empezar por 0.';
  if (tipo === 'CC' && (raw.length < 6 || raw.length > 10)) return 'La cédula tiene de 6 a 10 dígitos.';
  if (tipo === 'CE' && (raw.length < 6 || raw.length > 7)) return 'La cédula de extranjería tiene 6 o 7 dígitos.';
  if (tipo === 'PPT' && (raw.length < 6 || raw.length > 8)) return 'El PPT tiene de 6 a 8 dígitos.';
  if (/^(\d)\1+$/.test(raw) || '1234567890'.includes(raw) || '0987654321'.includes(raw)) return 'Ese número no parece válido.';
  return '';
}
export const normalizarDocumento = (tipo, numero) => (tipo === 'PA' ? limpiar(numero).toUpperCase() : soloDigitos(numero));

// Celular colombiano: 10 dígitos, empieza por 30, 31, 32, 33 o 35 (operadores móviles).
export function normalizarCelular(v) {
  let d = soloDigitos(v);
  if (d.length === 12 && d.startsWith('57')) d = d.slice(2);
  return /^3(0|1|2|3|5)\d{8}$/.test(d) ? d : '';
}
export function validarCelular(v) {
  const d = soloDigitos(v);
  if (!d) return 'Escribe tu celular.';
  if (!normalizarCelular(v)) return 'Celular colombiano de 10 dígitos que empiece por 3 (ej. 300 123 4567).';
  if (/^3\d(\d)\1{7}$/.test(d)) return 'Ese número no parece válido.';
  return '';
}
export const formatoCelular = (d) => (d ? `+57 ${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}` : '');

export function edad(fechaISO, hoy = new Date()) {
  const f = new Date(fechaISO + 'T00:00:00');
  let e = hoy.getFullYear() - f.getFullYear();
  const m = hoy.getMonth() - f.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < f.getDate())) e--;
  return e;
}
export function validarNacimiento(v) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v || '')) return 'Escribe tu fecha de nacimiento.';
  const f = new Date(v + 'T00:00:00');
  if (Number.isNaN(f.getTime())) return 'La fecha no es válida.';
  const e = edad(v);
  if (e < EDAD_MINIMA) return `Debes ser mayor de ${EDAD_MINIMA} años para crear una cuenta y comprar.`;
  if (e > 100) return 'Revisa el año de nacimiento.';
  return '';
}
export function fechaMaximaNacimiento(hoy = new Date()) {
  const d = new Date(hoy.getFullYear() - EDAD_MINIMA, hoy.getMonth(), hoy.getDate());
  return d.toISOString().slice(0, 10);
}

export function validarDepartamento(v) { return DEPARTAMENTOS.includes(v) ? '' : 'Elige el departamento.'; }

export function validarMunicipio(v) {
  const s = limpiar(v);
  if (!s) return 'Escribe el municipio o ciudad.';
  if (s.length > LIMITES.municipio) return `Máximo ${LIMITES.municipio} caracteres.`;
  if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ.' -]{3,}$/.test(s)) return 'Solo letras (ej. Medellín, Santa Rosa de Cabal).';
  return '';
}

// Dirección por partes: [tipo de vía] [número vía] # [número cruce] - [placa]. Ej: Calle 12B # 34A - 56
const NUM_VIA = /^\d{1,3}(?:\s?[A-Z]{1,2})?(?:\s?BIS)?(?:\s?(?:SUR|ESTE))?$/i;
const NUM_PLACA = /^\d{1,3}$/;
export function validarDireccion({ via, numero, cruce, placa }) {
  if (!TIPOS_VIA.includes(via)) return 'Elige el tipo de vía.';
  if (!NUM_VIA.test(limpiar(numero))) return 'Número de la vía: ej. 12, 12B, 45 Sur.';
  if (!NUM_VIA.test(limpiar(cruce))) return 'Número después del #: ej. 34, 34A.';
  if (!NUM_PLACA.test(limpiar(placa))) return 'Número de placa: de 1 a 3 dígitos (ej. 56).';
  return '';
}
export function formatoDireccion({ via, numero, cruce, placa, complemento }) {
  const base = `${via} ${limpiar(numero).toUpperCase()} # ${limpiar(cruce).toUpperCase()} - ${limpiar(placa)}`;
  return complemento ? `${base}, ${limpiar(complemento)}` : base;
}

export function validarTextoLibre(v, max, { requerido = false, campo = 'este campo' } = {}) {
  const s = limpiar(v);
  if (requerido && !s) return `Completa ${campo}.`;
  if (s.length > max) return `Máximo ${max} caracteres.`;
  if (/[<>{}\\$`]/.test(s)) return 'No uses los caracteres < > { } \\ $ `';
  return '';
}

// Filtros de escritura: impiden teclear lo que nunca sería válido.
export function filtrarEntrada(input, tipo) {
  const reglas = {
    digitos: (v) => v.replace(/\D/g, ''),
    letras: (v) => v.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ '-]/g, '').replace(/\s{2,}/g, ' '),
    alfanum: (v) => v.replace(/[^A-Za-z0-9]/g, '').toUpperCase(),
    celular: (v) => v.replace(/[^\d ]/g, '').replace(/\s{2,}/g, ' '),
    via: (v) => v.replace(/[^A-Za-z0-9 ]/g, '').toUpperCase()
  };
  const f = reglas[tipo];
  if (!f) return;
  input.addEventListener('input', () => {
    const pos = input.selectionStart; const antes = input.value; const despues = f(antes);
    if (antes !== despues) { input.value = despues; try { input.setSelectionRange(pos - (antes.length - despues.length), pos - (antes.length - despues.length)); } catch { /* email/date */ } }
  });
}
