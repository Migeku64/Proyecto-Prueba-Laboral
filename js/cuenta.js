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

async function profile(user) {
  const m = user.user_metadata || {};
  const verified = Boolean(user.email_confirmed_at);
  const doc = TIPOS_DOCUMENTO.find((t) => t.id === m.tipo_documento);
  const since = user.created_at ? new Date(user.created_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  $('#hero-title').textContent = `Hola, ${A.displayName(user)}`;
  $('#hero-sub').textContent = 'Aquí ves tus datos y tus pedidos.';
  card.innerHTML = `
    <div class="account-profile">
      <h2 class="au-title">Tu perfil</h2>
      <dl>
        <dt>Nombre</dt><dd>${esc(m.nombre || '—')}</dd>
        <dt>Documento</dt><dd>${doc ? esc(`${doc.id} ${m.documento}`) : '—'}</dd>
        <dt>Correo</dt><dd>${esc(user.email)} <span class="badge-ok${verified ? '' : ' badge-warn'}">${verified ? 'Verificado' : 'Sin verificar'}</span></dd>
        <dt>Celular</dt><dd>${esc(formatoCelular(m.celular) || '—')}</dd>
        ${since ? `<dt>Miembro desde</dt><dd>${since}</dd>` : ''}
      </dl>
      <h2 class="au-title">Mis pedidos</h2>
      <div class="orders" id="orders"><p class="ck-preview">Cargando…</p></div>
      <div class="au-row">
        <a class="btn btn-primary" href="catalogo.html">Ir a la tienda</a>
        <button type="button" class="btn btn-ghost" id="logout">Cerrar sesión</button>
      </div>
    </div>`;
  $('#logout').addEventListener('click', async () => {
    try { await A.signOut(); } catch (e) { toast(e.message, 'error'); return; }
    toast('Sesión cerrada');
    showForms('login');
  });
  try {
    const orders = await A.myOrders();
    $('#orders').innerHTML = orders.length ? orders.map((o) => `
      <article class="order">
        <div class="order-head"><span>VK-${esc(String(o.id).replace(/-/g, '').slice(0, 8).toUpperCase())}</span><span>${formatPrice(o.total)}</span></div>
        <small>${new Date(o.creado_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })} · ${o.items.reduce((n, i) => n + i.cantidad, 0)} producto(s) · ${esc(o.estado)}</small>
        <small>${esc(o.direccion.direccion)}, ${esc(o.direccion.barrio)} · ${esc(o.direccion.municipio)}, ${esc(o.direccion.departamento)}</small>
      </article>`).join('') : '<p class="ck-preview">Aún no tienes pedidos.</p>';
  } catch (e) { $('#orders').innerHTML = `<p class="ck-preview">${esc(e.message)}</p>`; }
}

function showForms(view) {
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
