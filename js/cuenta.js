// cuenta.js — página "Mi cuenta": ingresar, registrarse, verificar, perfil y pedidos.
import { $, formatPrice } from './utils.js';
import { initLayout } from './layout.js';
import { icon } from './icons.js';
import { toast } from './ui.js';
import { mountAuth } from './auth-ui.js';
import * as A from './auth-core.js';
import { formatoCelular, TIPOS_DOCUMENTO } from './colombia.js';

await initLayout();

const card = $('#account-card');
const aside = $('#account-aside');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const volverAlCheckout = new URLSearchParams(location.search).get('volver') === 'checkout';

const benefits = volverAlCheckout
  ? [['cart', 'Tu carrito te espera', 'Ingresa o crea tu cuenta y volverás directo a finalizar tu compra.'],
     ['shield', 'Compra segura', 'Solo cuentas verificadas pueden hacer pedidos.']]
  : [['shield', 'Cuenta verificada', 'Confirmamos tu correo con un código para que nadie compre a tu nombre.'],
     ['truck', 'Envíos en Colombia', 'Tus datos listos para recibir tus pedidos en cualquier municipio del país.'],
     ['clock', 'Tus pedidos', 'Consulta en un solo lugar todo lo que has comprado.']];
aside.innerHTML = benefits.map(([ico, t, d]) => `
  <div class="info-item"><span class="benefit-ico">${icon(ico, 22)}</span><div><strong>${t}</strong><span>${d}</span></div></div>`).join('');

function goBackToCheckout() {
  let page = 'catalogo.html';
  try { page = sessionStorage.getItem('vokter-volver') || page; sessionStorage.removeItem('vokter-volver'); } catch { /* sin almacenamiento */ }
  location.href = `${page}?checkout=1`;
}

const fecha = (iso, opts = { year: 'numeric', month: 'long', day: 'numeric' }) => (iso ? new Date(iso.length === 10 ? iso + 'T00:00:00' : iso).toLocaleDateString('es-CO', opts) : '');
const codigoPedido = (o) => 'VK-' + String(o.id).replace(/-/g, '').slice(0, 8).toUpperCase();
const ESTADOS = { recibido: 'Recibido', pago_pendiente: 'Pago pendiente', pagado: 'Pagado', enviado: 'Enviado', entregado: 'Entregado', cancelado: 'Cancelado' };

function setProfileLayout(on) {
  document.querySelector('.account-wrap').classList.toggle('is-profile', on);
  document.querySelector('.page-hero').hidden = on;
}

async function profile(user) {
  const m = user.user_metadata || {};
  const verified = Boolean(user.email_confirmed_at);
  const doc = TIPOS_DOCUMENTO.find((t) => t.id === m.tipo_documento);
  const nombre = m.nombre || user.email;
  const iniciales = (m.nombres?.[0] || '') + (m.apellidos?.[0] || '') || nombre[0];
  $('#hero-title').textContent = `Hola, ${A.displayName(user)}`;
  setProfileLayout(true);
  const dato = (ico, label, value, extra = '') => `
    <li><span class="pf-ico">${icon(ico, 20)}</span><div><small>${label}</small><strong>${value}</strong>${extra}</div></li>`;
  card.innerHTML = `
    <div class="pf">
      <header class="pf-hero">
        <div class="pf-avatar" aria-hidden="true">${esc(iniciales.toUpperCase())}</div>
        <div class="pf-id">
          <p class="pf-eyebrow">Mi cuenta</p>
          <h1>${esc(nombre)}</h1>
          <p class="pf-meta"><span>${esc(user.email)}</span><span class="pf-pill${verified ? '' : ' is-warn'}">${icon(verified ? 'check' : 'clock', 14)}${verified ? 'Verificado' : 'Sin verificar'}</span></p>
          ${user.created_at ? `<p class="pf-since">Miembro desde el ${fecha(user.created_at)}</p>` : ''}
        </div>
        <div class="pf-actions">
          <a class="btn btn-light" href="catalogo.html">${icon('cart', 18)}Ir a la tienda</a>
          <button type="button" class="btn btn-glass" id="logout">Cerrar sesión</button>
        </div>
      </header>

      <div class="pf-stats" id="pf-stats">
        <div class="pf-stat"><span class="pf-ico">${icon('tag', 20)}</span><div><small>Pedidos</small><strong data-stat="n">—</strong></div></div>
        <div class="pf-stat"><span class="pf-ico">${icon('award', 20)}</span><div><small>Total comprado</small><strong data-stat="total">—</strong></div></div>
        <div class="pf-stat"><span class="pf-ico">${icon('truck', 20)}</span><div><small>Último envío</small><strong data-stat="ciudad">—</strong></div></div>
      </div>

      <div class="pf-grid">
        <section class="pf-card">
          <h2>Datos personales</h2>
          <ul class="pf-list">
            ${dato('user', 'Nombre completo', esc(nombre))}
            ${dato('tag', 'Documento', doc ? `${esc(doc.id)} ${esc(m.documento)}` : '—', doc ? `<em>${esc(doc.nombre)}</em>` : '')}
            ${dato('mail', 'Correo', esc(user.email))}
            ${dato('phone', 'Celular', esc(formatoCelular(m.celular) || '—'))}
            ${m.nacimiento ? dato('gift', 'Fecha de nacimiento', esc(fecha(m.nacimiento))) : ''}
          </ul>
          <div class="pf-security">
            <div class="pf-security-head">${icon('shield', 20)}<strong>Cuenta protegida</strong></div>
            <ul>
              <li class="${verified ? 'ok' : ''}">${icon('check', 14)}Correo verificado</li>
              <li class="ok">${icon('check', 14)}Contraseña cifrada</li>
              <li class="ok">${icon('check', 14)}Un correo por cuenta</li>
            </ul>
          </div>
        </section>

        <section class="pf-card">
          <div class="pf-card-head"><h2>Mis pedidos</h2><span class="pf-count" id="pf-count"></span></div>
          <div class="pf-orders" id="orders"><p class="pf-loading">Cargando pedidos…</p></div>
        </section>
      </div>
    </div>`;
  $('#logout').addEventListener('click', async () => {
    try { await A.signOut(); } catch (e) { toast(e.message, 'error'); return; }
    toast('Sesión cerrada');
    showForms('login');
  });
  try {
    const orders = await A.myOrders();
    const stat = (k, v) => { const el = card.querySelector(`[data-stat="${k}"]`); if (el) el.textContent = v; };
    stat('n', String(orders.length));
    stat('total', formatPrice(orders.reduce((s, o) => s + o.total, 0)));
    stat('ciudad', orders[0] ? orders[0].direccion.municipio : 'Sin envíos');
    $('#pf-count').textContent = orders.length ? `${orders.length} ${orders.length === 1 ? 'pedido' : 'pedidos'}` : '';
    $('#orders').innerHTML = orders.length ? orders.map((o) => {
      const n = o.items.reduce((c, i) => c + i.cantidad, 0);
      return `
      <article class="pf-order">
        <div class="pf-order-head">
          <div><strong>${esc(codigoPedido(o))}</strong><small>${esc(fecha(o.creado_at, { day: 'numeric', month: 'short', year: 'numeric' }))} · ${n} ${n === 1 ? 'producto' : 'productos'}</small></div>
          <span class="pf-status" data-estado="${esc(o.estado)}">${esc(ESTADOS[o.estado] || o.estado)}</span>
        </div>
        <ul class="pf-items">${o.items.map((i) => `<li><span>${esc(i.nombre)}</span><small>× ${i.cantidad}</small><b>${formatPrice(i.precio * i.cantidad)}</b></li>`).join('')}</ul>
        <div class="pf-order-foot">
          <span class="pf-addr">${icon('truck', 16)}<span>${esc(o.direccion.direccion)}, ${esc(o.direccion.barrio)} · ${esc(o.direccion.municipio)}, ${esc(o.direccion.departamento)}</span></span>
          <strong class="pf-total">${formatPrice(o.total)}</strong>
        </div>
      </article>`;
    }).join('') : `
      <div class="pf-empty">
        <span class="pf-ico">${icon('cart', 26)}</span>
        <strong>Aún no tienes pedidos</strong>
        <p>Cuando compres, aquí verás el estado y la dirección de cada envío.</p>
        <a class="btn btn-primary" href="catalogo.html">Explorar la tienda</a>
      </div>`;
  } catch (e) { $('#orders').innerHTML = `<p class="pf-loading">${esc(e.message)}</p>`; }
}

function showForms(view) {
  setProfileLayout(false);
  $('#hero-title').textContent = volverAlCheckout ? 'Ingresa para finalizar tu compra' : 'Tu cuenta VOKTER';
  $('#hero-sub').textContent = 'Una sola cuenta para la tienda web y la app móvil.';
  mountAuth(card, {
    headingTag: 'h2',
    initialView: view,
    focus: false,
    onSignedIn(user, text) {
      if (!user) return;
      toast(text || `Bienvenido, ${A.displayName(user)}`);
      if (volverAlCheckout && user.email_confirmed_at) { goBackToCheckout(); return; }
      history.replaceState(null, '', location.pathname);
      profile(user);
    }
  });
}

const user = await A.currentUser();
if (user && volverAlCheckout && user.email_confirmed_at) goBackToCheckout();
else if (user) profile(user);
else showForms(location.hash.slice(1) || 'login');
