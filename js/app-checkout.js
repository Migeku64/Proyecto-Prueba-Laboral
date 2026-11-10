// app-checkout.js — checkout de la app móvil: misma validación colombiana y mismos pedidos que la web.
// commerce.js (script clásico) define commerceCart, commerceProducts, saveCart y toastMessage como globales.
import * as A from './auth-core.js';
import * as CO from './colombia.js';
import * as PG from './payments.js';
import { mountPicker } from './payments-ui.js';

const form = document.querySelector('#checkout-form');
const dialog = document.querySelector('#checkout-dialog');
const msg = () => document.querySelector('#checkout-message');
if (form && dialog) {
  dialog.querySelector('.checkout-note').textContent = 'Envíos solo dentro de Colombia. El pago lo procesa una pasarela segura: VOKTER nunca ve los datos de tu tarjeta.';
  form.classList.add('au');
  form.innerHTML = `
    <label>Departamento<select id="ack-dep" required><option value="">Elige…</option>${CO.DEPARTAMENTOS.map((d) => `<option>${d}</option>`).join('')}</select></label>
    <label>Municipio o ciudad<input id="ack-mun" required maxlength="${CO.LIMITES.municipio}" data-filter="letras" autocomplete="address-level2"></label>
    <div class="checkout-row"><label>Vía<select id="ack-via" required><option value="">Elige…</option>${CO.TIPOS_VIA.map((v) => `<option>${v}</option>`).join('')}</select></label>
      <label>Número<input id="ack-num" required maxlength="${CO.LIMITES.numeroVia}" placeholder="12B" data-filter="via"></label></div>
    <div class="checkout-row"><label># Cruce<input id="ack-cruce" required maxlength="${CO.LIMITES.numeroVia}" placeholder="34A" data-filter="via"></label>
      <label>- Placa<input id="ack-placa" required maxlength="3" inputmode="numeric" placeholder="56" data-filter="digitos"></label></div>
    <label>Barrio<input id="ack-barrio" required maxlength="${CO.LIMITES.barrio}"></label>
    <label>Apto, torre (opcional)<input id="ack-comp" maxlength="${CO.LIMITES.complemento}"></label>
    <label>Celular de quien recibe<input id="ack-cel" type="tel" inputmode="numeric" required maxlength="12" data-filter="celular" placeholder="300 123 4567"></label>
    <p class="ack-label">Método de pago</p>
    <div class="pm-picker" id="ack-picker"></div>
    <label class="ack-legal"><input type="checkbox" id="ack-acepto"> <span>Acepto los <a href="ayuda.html#terminos" target="_blank" rel="noopener">términos</a> y la <a href="ayuda.html#terminos" target="_blank" rel="noopener">política de privacidad</a>. Conozco mi <a href="ayuda.html#devoluciones" target="_blank" rel="noopener">derecho de retracto y reversión del pago</a> (Ley 1480). Precios con IVA incluido.</span></label>
    <button class="dialog-add" type="submit" id="ack-pay">Pagar</button>
    <p class="checkout-message" id="checkout-message" role="status"></p>`;
  form.querySelectorAll('[data-filter]').forEach((el) => CO.filtrarEntrada(el, el.dataset.filter));

  // Cada vez que se abre: celular del perfil, métodos guardados y total.
  let picker = null; let buyer = null; let pedido = null; let firma = '';
  new MutationObserver(async () => {
    if (!dialog.open) return;
    buyer = await A.currentUser();
    const cel = form.querySelector('#ack-cel');
    if (buyer && !cel.value) cel.value = buyer.user_metadata?.celular || '';
    let guardados = [];
    try { guardados = await PG.misMetodos(); } catch { /* sin métodos */ }
    picker = mountPicker(form.querySelector('#ack-picker'), { guardados, name: 'ack-metodo' });
    const total = commerceCart.reduce((s, e) => s + (commerceProducts.find((p) => p.id === e.id)?.precio || 0) * e.qty, 0);
    form.querySelector('#ack-pay').textContent = `Pagar ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(total)}`;
  }).observe(dialog, { attributes: true, attributeFilter: ['open'] });

  let sending = false;
  form.onsubmit = async (event) => {
    event.preventDefault();
    if (sending) return;
    const $ = (id) => form.querySelector(id).value;
    const a = { via: $('#ack-via'), numero: $('#ack-num'), cruce: $('#ack-cruce'), placa: $('#ack-placa'), complemento: $('#ack-comp') };
    const error = CO.validarDepartamento($('#ack-dep')) || CO.validarMunicipio($('#ack-mun')) || CO.validarDireccion(a)
      || CO.validarTextoLibre($('#ack-barrio'), CO.LIMITES.barrio, { requerido: true, campo: 'el barrio' })
      || CO.validarTextoLibre(a.complemento, CO.LIMITES.complemento) || CO.validarCelular($('#ack-cel'));
    if (error) { msg().textContent = error; msg().dataset.tone = 'error'; return; }
    const items = commerceCart.map((e) => ({ ...e, product: commerceProducts.find((p) => p.id === e.id) })).filter((e) => e.product);
    if (!items.length) { msg().textContent = 'Tu carrito está vacío.'; return; }
    const sel = picker?.seleccion();
    if (!sel) { msg().textContent = 'Elige un método de pago.'; msg().dataset.tone = 'error'; return; }
    if (!form.querySelector('#ack-acepto').checked) { msg().textContent = 'Debes aceptar los términos para pagar.'; msg().dataset.tone = 'error'; return; }
    sending = true; msg().textContent = 'Abriendo la pasarela de pagos…'; msg().dataset.tone = '';
    try {
      const subtotal = items.reduce((s, e) => s + e.product.precio * e.qty, 0);
      const datos = {
        items: items.map((e) => ({ id: e.id, nombre: e.product.nombre, precio: e.product.precio, cantidad: e.qty, variante: null })),
        subtotal, envio: 0, total: subtotal, estado: 'pago_pendiente',
        direccion: { departamento: $('#ack-dep'), municipio: CO.limpiar($('#ack-mun')), direccion: CO.formatoDireccion(a), barrio: CO.limpiar($('#ack-barrio')), indicaciones: null },
        celular: CO.normalizarCelular($('#ack-cel')),
        facturacion: { tipo: 'persona', nombre: buyer?.user_metadata?.nombre, tipo_documento: buyer?.user_metadata?.tipo_documento, documento: buyer?.user_metadata?.documento, correo: buyer?.email }
      };
      const nuevaFirma = JSON.stringify(datos);
      if (!pedido || firma !== nuevaFirma) { pedido = await A.createOrder({ ...datos, acepta_terminos_at: new Date().toISOString() }); firma = nuevaFirma; }
      const m = buyer?.user_metadata || {};
      const r = await PG.pagar({ pedido, metodo: sel.metodo, guardado: sel.guardado,
        comprador: { nombre: m.nombre || '', correo: buyer?.email, celular: datos.celular, tipo_documento: m.tipo_documento, documento: m.documento } });
      const code = 'VK-' + String(pedido.id).replace(/-/g, '').slice(0, 8).toUpperCase();
      if (r.estado === 'cancelado') { msg().textContent = 'Cerraste la pasarela. Tu pedido sigue pendiente de pago.'; return; }
      if (r.estado === 'aprobado' || r.estado === 'pendiente') {
        commerceCart = []; saveCart(); dialog.close(); form.reset(); msg().textContent = ''; pedido = null;
        toastMessage(r.estado === 'aprobado' ? `¡Pago aprobado! Pedido ${code}. Te avisaremos cuando lo despachemos.`
          : `Pedido ${code}: pago pendiente.${r.detalle?.codigo ? ` Código de pago ${r.detalle.codigo}.` : ''} Míralo en Mi cuenta.`);
      } else { msg().textContent = `${r.mensaje || 'El pago fue rechazado.'} Intenta con otro método.`; msg().dataset.tone = 'error'; }
    } catch (e) { msg().textContent = e.message; msg().dataset.tone = 'error'; }
    finally { sending = false; }
  };
}
