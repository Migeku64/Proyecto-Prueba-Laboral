// payments.js — pagos de la tienda (web y app).
//
// Seguridad (PCI DSS): la tienda NUNCA recibe ni guarda el número completo de la tarjeta ni el CVV.
// Los datos de pago se escriben en la ventana de la pasarela; a la tienda solo vuelve el resultado
// (estado, referencia, marca y últimos 4 dígitos). En producción, el estado final lo confirma el
// servidor con la pasarela (webhook); el navegador nunca decide por sí solo que un pedido está pagado.
//
// Pasarela (CONFIG.pagos.pasarela): 'prueba' (simulada, js/gateway-test.js) o 'wompi'.

import { CONFIG } from './config.js';
import { run, AuthError } from './auth-core.js';

const P = CONFIG.pagos || { pasarela: 'prueba' };
export const pasarela = () => P.pasarela || 'prueba';
export const esPrueba = () => pasarela() === 'prueba';

export const METODOS = [
  { id: 'tarjeta', nombre: 'Tarjeta de crédito o débito', detalle: 'Visa, Mastercard, American Express y Diners. Paga a cuotas con crédito.', icono: 'card' },
  { id: 'pse', nombre: 'PSE', detalle: 'Débito desde tu cuenta de ahorros o corriente en cualquier banco.', icono: 'bank' },
  { id: 'nequi', nombre: 'Nequi', detalle: 'Aprueba el pago desde la notificación en tu app.', icono: 'phone' },
  { id: 'bancolombia', nombre: 'Botón Bancolombia', detalle: 'Paga desde tu Sucursal Virtual Personas.', icono: 'bank' },
  { id: 'efectivo', nombre: 'Efectivo', detalle: 'Paga en Efecty o en un corresponsal bancario con un código.', icono: 'cash' }
];
export const nombreMetodo = (id) => METODOS.find((m) => m.id === id)?.nombre || (id === 'tarjeta_guardada' ? 'Tarjeta guardada' : id);

export const BANCOS_PSE = ['Bancamía', 'Banco Agrario', 'Banco AV Villas', 'Banco Caja Social', 'Banco Cooperativo Coopcentral', 'Banco de Bogotá',
  'Banco de Occidente', 'Banco Falabella', 'Banco Finandina', 'Banco GNB Sudameris', 'Banco Pichincha', 'Banco Popular', 'Banco Serfinanza',
  'Bancolombia', 'Bancoomeva', 'BBVA Colombia', 'Citibank', 'Confiar', 'Daviplata', 'Davivienda', 'Itaú', 'Lulo Bank', 'Mibanco', 'Nequi',
  'Nu Colombia', 'Scotiabank Colpatria'];

export const ESTADOS_PAGO = { aprobado: 'Aprobado', rechazado: 'Rechazado', pendiente: 'Pendiente', cancelado: 'Cancelado', error: 'Error' };

// ---------- Tarjetas: validación sin guardar nada ----------
export const soloDigitos = (v) => String(v ?? '').replace(/\D/g, '');
export function marcaTarjeta(numero) {
  const n = soloDigitos(numero);
  if (/^4/.test(n)) return 'Visa';
  if (/^(5[1-5]|2(2[2-9]\d|[3-6]\d\d|7[01]\d|720))/.test(n)) return 'Mastercard';
  if (/^3[47]/.test(n)) return 'American Express';
  if (/^3(0[0-5]|[68])/.test(n)) return 'Diners Club';
  return '';
}
export function luhn(numero) {
  const n = soloDigitos(numero);
  let sum = 0;
  for (let i = 0; i < n.length; i++) {
    let d = Number(n[n.length - 1 - i]);
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  return n.length > 0 && sum % 10 === 0;
}
export function validarNumeroTarjeta(numero) {
  const n = soloDigitos(numero);
  if (!n) return 'Escribe el número de la tarjeta.';
  const marca = marcaTarjeta(n);
  if (!marca) return 'Aceptamos Visa, Mastercard, American Express y Diners Club.';
  const largo = marca === 'American Express' ? [15] : marca === 'Diners Club' ? [14, 16] : [16];
  if (!largo.includes(n.length)) return `Una tarjeta ${marca} tiene ${largo.join(' o ')} dígitos.`;
  if (!luhn(n)) return 'Revisa el número: no es una tarjeta válida.';
  return '';
}
export function validarVencimiento(mmaa, hoy = new Date()) {
  const m = /^(\d{2})\s*\/\s*(\d{2})$/.exec(String(mmaa || '').trim());
  if (!m) return 'Escribe la fecha como MM/AA.';
  const mes = Number(m[1]); const anio = 2000 + Number(m[2]);
  if (mes < 1 || mes > 12) return 'El mes debe estar entre 01 y 12.';
  const fin = new Date(anio, mes, 0, 23, 59, 59);
  if (fin < hoy) return 'La tarjeta está vencida.';
  if (anio > hoy.getFullYear() + 20) return 'Revisa el año de vencimiento.';
  return '';
}
export function validarCVV(cvv, marca) {
  const largo = marca === 'American Express' ? 4 : 3;
  return new RegExp(`^\\d{${largo}}$`).test(String(cvv || '')) ? '' : `El código de seguridad tiene ${largo} dígitos.`;
}
export function formatoNumero(numero) {
  const n = soloDigitos(numero).slice(0, 19);
  if (marcaTarjeta(n) === 'American Express') return n.replace(/^(\d{0,4})(\d{0,6})(\d{0,5}).*/, (_, a, b, c) => [a, b, c].filter(Boolean).join(' '));
  return n.replace(/(\d{4})(?=\d)/g, '$1 ');
}
export const enmascarar = (ultimos4) => `•••• ${ultimos4}`;

// ---------- Pagar ----------
// datos: { pedido: {id, total}, metodo, guardado?, comprador: {nombre, correo, celular, tipo_documento, documento} }
export async function pagar(datos) {
  const adapter = await cargarPasarela();
  const resultado = await adapter.pagar(datos);
  if (resultado.estado === 'cancelado') return resultado;
  await registrarPago(datos.pedido, resultado);
  if (resultado.guardar && resultado.tarjeta) {
    try { await guardarMetodo(resultado.tarjeta); resultado.guardada = true; } catch (e) { resultado.avisoGuardar = e.message; }
  }
  return resultado;
}

// Guarda una tarjeta: la pasarela la verifica y devuelve una referencia (token), nunca el número.
export async function agregarTarjeta(comprador) {
  const adapter = await cargarPasarela();
  if (!adapter.tokenizar) throw new AuthError('unknown', 'Guardar tarjetas estará disponible cuando se active la pasarela de pagos.');
  const t = await adapter.tokenizar({ comprador });
  if (!t) return null;
  return guardarMetodo(t);
}

async function cargarPasarela() {
  if (esPrueba()) return (await import('./gateway-test.js')).gatewayPrueba;
  if (pasarela() === 'wompi') return wompi;
  throw new AuthError('unknown', 'La pasarela de pagos no está configurada (docs/PAGOS.md).');
}

const registrarPago = (pedido, r) => run((c) => c.payments.record({
  pedido_id: pedido.id, monto: pedido.total, moneda: 'COP', metodo: r.metodo, estado: r.estado,
  referencia: r.referencia, pasarela: pasarela(), detalle: r.detalle || {}, mensaje: r.mensaje || null
}));

// ---------- Métodos guardados e historial ----------
export const misMetodos = async () => (await run((c) => c.methods.list())) || [];
export const guardarMetodo = (m) => run((c) => c.methods.add({
  tipo: m.tipo, marca: m.marca || null, ultimos4: m.ultimos4 || null, vence: m.vence || null, titular: m.titular || null,
  celular: m.celular || null, token: m.token || null, huella: m.huella || null
}));
export const eliminarMetodo = (id) => run((c) => c.methods.remove(id));
export const metodoPredeterminado = (id) => run((c) => c.methods.setDefault(id));
export const misPagos = async () => (await run((c) => c.payments.mine())) || [];

// ---------- Wompi ----------
// Widget oficial: los datos de pago se escriben en la ventana de Wompi. Requiere una función del
// servidor (CONFIG.pagos.urlFirma) que calcule la firma de integridad con el secreto del comercio.
const wompi = {
  async pagar({ pedido, comprador }) {
    if (!P.llavePublica || !P.urlFirma) throw new AuthError('unknown', 'Falta configurar la llave pública y la firma de Wompi (docs/PAGOS.md).');
    await cargarScript('https://checkout.wompi.co/widget.js');
    // Referencia = VK-<id del pedido>-<marca de tiempo>: el servidor recupera el pedido desde aquí.
    const referencia = `VK-${String(pedido.id).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    const montoCentavos = Math.round(pedido.total * 100);
    const firma = await fetch(P.urlFirma, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referencia, montoCentavos, moneda: 'COP', pedido_id: pedido.id })
    }).then((r) => (r.ok ? r.json() : Promise.reject(new AuthError('network'))));
    const checkout = new window.WidgetCheckout({
      currency: 'COP', amountInCents: montoCentavos, reference: referencia, publicKey: P.llavePublica,
      signature: { integrity: firma.integridad },
      customerData: {
        email: comprador.correo, fullName: comprador.nombre, phoneNumber: comprador.celular, phoneNumberPrefix: '+57',
        legalId: comprador.documento, legalIdType: comprador.tipo_documento
      }
    });
    return new Promise((resolve) => {
      checkout.open((result) => {
        const t = result?.transaction;
        if (!t) return resolve({ estado: 'cancelado' });
        const estado = { APPROVED: 'aprobado', DECLINED: 'rechazado', VOIDED: 'rechazado', ERROR: 'error', PENDING: 'pendiente' }[t.status] || 'pendiente';
        resolve({ estado, referencia: t.reference || referencia, metodo: String(t.paymentMethodType || '').toLowerCase(), detalle: { transaccion: t.id }, mensaje: t.statusMessage || null });
      });
    });
  }
};

function cargarScript(src) {
  if (document.querySelector(`script[src="${src}"]`)) return Promise.resolve();
  return new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new AuthError('network'));
    document.head.appendChild(s);
  });
}
