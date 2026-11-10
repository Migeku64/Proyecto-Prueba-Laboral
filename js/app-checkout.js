// app-checkout.js — checkout de la app móvil: misma validación colombiana y mismos pedidos que la web.
// commerce.js (script clásico) define commerceCart, commerceProducts, saveCart y toastMessage como globales.
import * as A from './auth-core.js';
import * as CO from './colombia.js';

const form = document.querySelector('#checkout-form');
const dialog = document.querySelector('#checkout-dialog');
const msg = () => document.querySelector('#checkout-message');
if (form && dialog) {
  dialog.querySelector('.checkout-note').textContent = 'Envíos solo dentro de Colombia. Los métodos de pago se habilitarán pronto; te contactaremos para coordinar el pago.';
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
    <button class="dialog-add" type="submit">Confirmar pedido</button>
    <p class="checkout-message" id="checkout-message" role="status"></p>`;
  form.querySelectorAll('[data-filter]').forEach((el) => CO.filtrarEntrada(el, el.dataset.filter));

  // Prellena el celular del perfil cada vez que se abre.
  new MutationObserver(async () => {
    if (!dialog.open) return;
    const u = await A.currentUser();
    const cel = form.querySelector('#ack-cel');
    if (u && !cel.value) cel.value = u.user_metadata?.celular || '';
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
    sending = true; msg().textContent = 'Registrando tu pedido…'; msg().dataset.tone = '';
    try {
      const subtotal = items.reduce((s, e) => s + e.product.precio * e.qty, 0);
      const order = await A.createOrder({
        items: items.map((e) => ({ id: e.id, nombre: e.product.nombre, precio: e.product.precio, cantidad: e.qty, variante: null })),
        subtotal, envio: 0, total: subtotal,
        direccion: { departamento: $('#ack-dep'), municipio: CO.limpiar($('#ack-mun')), direccion: CO.formatoDireccion(a), barrio: CO.limpiar($('#ack-barrio')), indicaciones: null },
        celular: CO.normalizarCelular($('#ack-cel'))
      });
      commerceCart = []; saveCart(); dialog.close(); form.reset(); msg().textContent = '';
      toastMessage(`Pedido VK-${String(order?.id || Date.now()).replace(/-/g, '').slice(0, 8).toUpperCase()} recibido. Te contactaremos para el pago y el envío.`);
    } catch (e) { msg().textContent = e.message; msg().dataset.tone = 'error'; }
    finally { sending = false; }
  };
}
