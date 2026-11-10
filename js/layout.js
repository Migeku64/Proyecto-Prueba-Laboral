// layout.js — todo lo que se repite en cada página: header, mega menú, carrito lateral,
// buscador rápido, checkout simulado y footer. Cada página solo escribe su <main>.
import { $, $$, loadData, formatPrice, currentPage, escapeHTML, norm } from './utils.js';
import { art, productArt, icon } from './icons.js';
import { initTheme } from './theme.js';
import { cart, FREE_SHIPPING_FROM } from './cart.js';
import { bindIndicator, toast, bumpCart } from './ui.js';
import * as CO from './colombia.js';

const NAV = [
  { href: 'index.html', label: 'Inicio', page: 'index.html' },
  { href: 'catalogo.html', label: 'Tienda', page: 'catalogo.html' },
  { mega: true, label: 'Categorías' },
  { href: 'index.html#bundles', label: 'Bundles', page: 'none' },
  { href: 'descarga.html', label: 'App móvil', page: 'descarga.html' },
  { href: 'ayuda.html', label: 'Ayuda', page: 'ayuda.html' }
];

const logoMark = `
  <svg class="logo-mark" viewBox="0 0 40 40" aria-hidden="true">
    <defs><linearGradient id="vk-g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0A57F5"/><stop offset="1" stop-color="#8B4DFF"/>
    </linearGradient></defs>
    <rect width="40" height="40" rx="12" fill="url(#vk-g)"/>
    <path d="M10.500 12 20 29l9.500-17" fill="none" stroke="#fff" stroke-width="4.500" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M20 12v6" stroke="#FFC931" stroke-width="4.500" stroke-linecap="round"/>
  </svg>`;

function headerHTML() {
  const page = currentPage();
  const links = NAV.map((item) => {
    if (item.mega) {
      return `<button type="button" class="nav-link" id="mega-trigger" aria-expanded="false" aria-controls="mega">${item.label}${icon('down', 15)}</button>`;
    }
    const current = item.page === page ? ' aria-current="page"' : '';
    return `<a class="nav-link" href="${item.href}"${current}>${item.label}</a>`;
  }).join('');

  return `
  <a class="skip-link" href="#main">Saltar al contenido</a>
  <header class="site-header" id="site-header">
    <div class="container header-inner">
      <a class="logo" href="index.html" aria-label="VOKTER, ir al inicio">${logoMark}<span>VOKTER</span></a>
      <nav class="nav" id="main-nav" aria-label="Principal">${links}</nav>
      <div class="header-actions">
        <button type="button" class="search-trigger" id="search-open" aria-label="Buscar productos">
          ${icon('search', 18)}<span>Buscar productos</span><kbd>/</kbd>
        </button>
        <button type="button" class="icon-btn search-icon" id="search-open-mobile" aria-label="Buscar productos">${icon('search')}</button>
        <button type="button" class="icon-btn" id="theme-btn"></button>
        <a class="icon-btn account-btn" id="account-btn" href="cuenta.html" aria-label="Ingresar o crear cuenta">${icon('user')}<span id="account-name">Ingresar</span></a>
        <button type="button" class="icon-btn cart-btn" id="cart-btn" aria-label="Abrir carrito">
          ${icon('cart')}<span class="cart-count" id="cart-count" hidden>0</span>
        </button>
        <button type="button" class="icon-btn menu-btn" id="menu-btn" aria-label="Abrir menú">${icon('menu')}</button>
      </div>
    </div>
    <div class="mega" id="mega" aria-hidden="true">
      <div class="container"><div class="mega-grid" id="mega-grid"></div></div>
    </div>
  </header>`;
}

function footerHTML() {
  return `
  <footer class="site-footer">
    <div class="container">
      <div class="footer-top">
        <div class="footer-brand">
          <a class="logo" href="index.html" aria-label="VOKTER, ir al inicio">${logoMark}<span>VOKTER</span></a>
          <p>Ecosistema premium de rendimiento y tecnología urbana. Sneakers, gadgets y gear esencial.</p>
          <div class="socials">
            <a href="https://instagram.com/vokter" target="_blank" rel="noopener" aria-label="Instagram de VOKTER">${icon('instagram')}</a>
            <a href="https://tiktok.com/@vokter" target="_blank" rel="noopener" aria-label="TikTok de VOKTER">${icon('music')}</a>
          </div>
        </div>
        <div>
          <h4>Tienda</h4>
          <ul>
            <li><a href="catalogo.html">Todos los productos</a></li>
            <li><a href="catalogo.html?cat=footwear">Footwear</a></li>
            <li><a href="catalogo.html?cat=audio">Audio</a></li>
            <li><a href="catalogo.html?cat=hogar">Hogar</a></li>
          </ul>
        </div>
        <div>
          <h4>Ayuda</h4>
          <ul>
            <li><a href="contacto.html">Contacto</a></li>
            <li><a href="ayuda.html#envios">Envíos</a></li>
            <li><a href="ayuda.html#devoluciones">Devoluciones</a></li>
            <li><a href="ayuda.html#faq">Preguntas frecuentes</a></li>
            <li><a href="descarga.html">App móvil</a></li>
          </ul>
        </div>
        <div class="footer-news">
          <h4>Drops en tu correo</h4>
          <p>Suscríbete para recibir lanzamientos y ofertas antes que nadie.</p>
          <form class="inline-form" data-newsletter novalidate>
            <label class="sr-only" for="footer-email">Correo electrónico</label>
            <input id="footer-email" type="email" name="email" placeholder="tu@correo.com" autocomplete="email" required>
            <button type="submit" class="btn btn-primary">Suscribirme</button>
          </form>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© 2026 VOKTER. Todos los derechos reservados.</span>
        <span class="footer-legal"><a href="ayuda.html#terminos">Privacidad</a><a href="ayuda.html#terminos">Términos</a></span>
      </div>
    </div>
  </footer>`;
}

function overlaysHTML() {
  return `
  <div class="scrim" id="scrim"></div>

  <aside class="drawer drawer-left" id="mobile-nav" aria-hidden="true" aria-label="Menú">
    <div class="drawer-head">
      <strong>Menú</strong>
      <button type="button" class="icon-btn" data-close aria-label="Cerrar menú">${icon('close')}</button>
    </div>
    <div class="drawer-body mobile-links" id="mobile-links"></div>
  </aside>

  <aside class="drawer drawer-right" id="cart-drawer" aria-hidden="true" aria-label="Carrito de compras">
    <div class="drawer-head">
      <strong>Tu carrito</strong>
      <button type="button" class="icon-btn" data-close aria-label="Cerrar carrito">${icon('close')}</button>
    </div>
    <div class="ship-meter" id="ship-meter">
      <p id="ship-text"></p>
      <div class="meter"><span id="ship-bar"></span></div>
    </div>
    <div class="drawer-body" id="cart-lines"></div>
    <div class="drawer-foot" id="cart-foot"></div>
  </aside>

  <div class="search-overlay" id="search" role="dialog" aria-modal="true" aria-label="Buscar productos" aria-hidden="true">
    <div class="search-panel">
      <div class="search-field">
        ${icon('search', 22)}
        <input id="search-input" type="search" placeholder="Busca audífonos, sneakers, power banks…" autocomplete="off" aria-controls="search-results">
        <button type="button" class="chip-btn" data-close-search>Esc</button>
      </div>
      <div class="search-results" id="search-results" role="listbox" aria-label="Resultados"></div>
    </div>
  </div>

  <dialog class="modal modal-wide" id="checkout" aria-labelledby="checkout-title">
    <form method="dialog" id="checkout-form" class="au" novalidate>
      <h2 id="checkout-title">Finalizar compra</h2>
      <p class="modal-sub">Envíos solo dentro de Colombia. Los métodos de pago se habilitarán pronto; por ahora coordinamos el pago al confirmar tu pedido.</p>
      <div class="ck-who" id="ck-who"></div>
      <fieldset class="ck-section"><legend>Dirección de envío</legend>
        <div class="au-two">
          <div class="au-field" data-field="ck-dep"><label for="ck-dep">Departamento</label>
            <select id="ck-dep" autocomplete="address-level1" required><option value="">Elige…</option>${CO.DEPARTAMENTOS.map((d) => `<option>${d}</option>`).join('')}</select>
            <small class="au-error" id="ck-dep-error"></small></div>
          <div class="au-field" data-field="ck-mun"><label for="ck-mun">Municipio o ciudad</label>
            <input type="text" id="ck-mun" autocomplete="address-level2" required maxlength="${CO.LIMITES.municipio}" data-filter="letras">
            <small class="au-error" id="ck-mun-error"></small></div>
        </div>
        <div class="ck-addr" data-field="ck-dir">
          <div class="au-field"><label for="ck-via">Vía</label><select id="ck-via" required><option value="">Elige…</option>${CO.TIPOS_VIA.map((v) => `<option>${v}</option>`).join('')}</select></div>
          <div class="au-field"><label for="ck-num">Número</label><input type="text" id="ck-num" required maxlength="${CO.LIMITES.numeroVia}" placeholder="12B" data-filter="via"></div>
          <span class="ck-sep" aria-hidden="true">#</span>
          <div class="au-field"><label for="ck-cruce">Cruce</label><input type="text" id="ck-cruce" required maxlength="${CO.LIMITES.numeroVia}" placeholder="34A" data-filter="via"></div>
          <span class="ck-sep" aria-hidden="true">-</span>
          <div class="au-field"><label for="ck-placa">Placa</label><input type="text" id="ck-placa" inputmode="numeric" required maxlength="3" placeholder="56" data-filter="digitos"></div>
        </div>
        <small class="au-error" id="ck-dir-error"></small>
        <p class="ck-preview" id="ck-preview"></p>
        <div class="au-two">
          <div class="au-field" data-field="ck-comp"><label for="ck-comp">Apto, torre, oficina <span class="au-hint">(opcional)</span></label>
            <input type="text" id="ck-comp" maxlength="${CO.LIMITES.complemento}" placeholder="Torre 2, apto 504"><small class="au-error" id="ck-comp-error"></small></div>
          <div class="au-field" data-field="ck-barrio"><label for="ck-barrio">Barrio</label>
            <input type="text" id="ck-barrio" required maxlength="${CO.LIMITES.barrio}"><small class="au-error" id="ck-barrio-error"></small></div>
        </div>
        <div class="au-field" data-field="ck-cel"><label for="ck-cel">Celular de quien recibe</label>
          <div class="au-prefix"><span>+57</span><input type="tel" id="ck-cel" inputmode="numeric" autocomplete="tel-national" required maxlength="12" data-filter="celular"></div>
          <small class="au-error" id="ck-cel-error"></small></div>
        <div class="au-field" data-field="ck-ind"><label for="ck-ind">Indicaciones para la entrega <span class="au-hint">(opcional)</span></label>
          <input type="text" id="ck-ind" maxlength="${CO.LIMITES.indicaciones}" placeholder="Portería, horario, punto de referencia"><small class="au-error" id="ck-ind-error"></small></div>
      </fieldset>
      <div class="modal-total" id="checkout-total"></div>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" data-modal-cancel>Volver</button>
        <button type="submit" class="btn btn-primary">Confirmar pedido</button>
      </div>
    </form>
    <div class="modal-done" id="checkout-done" hidden>
      <div class="done-check">${icon('check', 36)}</div>
      <h2>¡Pedido recibido!</h2>
      <p id="done-text"></p>
      <button type="button" class="btn btn-primary" data-modal-cancel>Seguir comprando</button>
    </div>
  </dialog>`;
}

// ---- Búsqueda ---------------------------------------------------------------
function searchProducts(query, { productos, catMap }) {
  const q = norm(query.trim());
  if (!q) return [];
  return productos
    .map((p) => {
      const name = norm(p.nombre);
      const hay = `${name} ${norm(p.marca)} ${norm(catMap[p.categoria].nombre)}`;
      let score = 0;
      if (name.startsWith(q)) score = 3;
      else if (name.includes(q)) score = 2;
      else if (q.split(/\s+/).every((w) => hay.includes(w))) score = 1;
      return { p, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 7)
    .map((r) => r.p);
}

// ---- Inicialización ---------------------------------------------------------
export async function initLayout() {
  if (!document.querySelector('link[href="css/auth.css"]')) {
    document.head.insertAdjacentHTML('beforeend', '<link rel="stylesheet" href="css/auth.css">');
  }
  document.body.insertAdjacentHTML('afterbegin', headerHTML());
  document.body.insertAdjacentHTML('beforeend', footerHTML() + overlaysHTML());

  const header = $('#site-header');
  const scrim = $('#scrim');
  initTheme($('#theme-btn'));
  bindIndicator($('#main-nav'), '.nav-link', { hover: true });

  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // -- Drawers (menú móvil y carrito) --
  let lastFocus = null;
  function openDrawer(el) {
    closeDrawers(false);
    lastFocus = document.activeElement;
    el.classList.add('open');
    el.setAttribute('aria-hidden', 'false');
    scrim.classList.add('show');
    document.body.classList.add('no-scroll');
    requestAnimationFrame(() => (el.querySelector('[data-autofocus]') || el.querySelector('button, a'))?.focus());
  }
  function closeDrawers(restore = true) {
    $$('.drawer.open').forEach((d) => { d.classList.remove('open'); d.setAttribute('aria-hidden', 'true'); });
    if (!$('#search').classList.contains('open')) {
      scrim.classList.remove('show');
      document.body.classList.remove('no-scroll');
    }
    if (restore && lastFocus) lastFocus.focus?.();
  }
  scrim.addEventListener('click', () => { closeDrawers(); closeSearch(); });
  $$('[data-close]').forEach((b) => b.addEventListener('click', () => closeDrawers()));

  $('#cart-btn').addEventListener('click', () => openDrawer($('#cart-drawer')));
  $('#menu-btn').addEventListener('click', () => openDrawer($('#mobile-nav')));
  window.addEventListener('vokter:open-cart', () => openDrawer($('#cart-drawer')));

  // -- Mega menú de categorías --
  const trigger = $('#mega-trigger');
  const mega = $('#mega');
  let megaTimer;
  const setMega = (open) => {
    clearTimeout(megaTimer);
    mega.classList.toggle('open', open);
    mega.setAttribute('aria-hidden', String(!open));
    trigger.setAttribute('aria-expanded', String(open));
  };
  const closeMegaSoon = () => { megaTimer = setTimeout(() => setMega(false), 140); };
  trigger.addEventListener('mouseenter', () => setMega(true));
  trigger.addEventListener('mouseleave', closeMegaSoon);
  mega.addEventListener('mouseenter', () => clearTimeout(megaTimer));
  mega.addEventListener('mouseleave', closeMegaSoon);
  trigger.addEventListener('click', () => setMega(!mega.classList.contains('open')));
  document.addEventListener('click', (e) => {
    if (!mega.contains(e.target) && !trigger.contains(e.target)) setMega(false);
  });

  // -- Carrito --
  let previousKeys = new Set();
  let previousCount = cart.count();

  function renderCart(items) {
    const n = cart.count();
    const badge = $('#cart-count');
    badge.textContent = n;
    badge.hidden = n === 0;
    if (n > previousCount) bumpCart();
    previousCount = n;

    const sub = cart.subtotal();
    const remaining = FREE_SHIPPING_FROM - sub;
    $('#ship-text').textContent = sub === 0
      ? `Envío gratis desde ${formatPrice(FREE_SHIPPING_FROM)}`
      : remaining > 0
        ? `Te faltan ${formatPrice(remaining)} para el envío gratis`
        : '¡Tu pedido tiene envío gratis!';
    $('#ship-bar').style.width = `${Math.min(100, (sub / FREE_SHIPPING_FROM) * 100)}%`;
    $('#ship-meter').classList.toggle('done', remaining <= 0 && sub > 0);

    const lines = $('#cart-lines');
    const foot = $('#cart-foot');

    if (items.length === 0) {
      lines.innerHTML = `
        <div class="cart-empty">
          <div class="empty-art">${icon('cart', 34)}</div>
          <h3>Tu carrito está vacío</h3>
          <p>Agrega productos desde la tienda y aparecerán aquí.</p>
          <a class="btn btn-primary" href="catalogo.html">Ir a la tienda</a>
        </div>`;
      foot.innerHTML = '';
      foot.hidden = true;
    } else {
      lines.innerHTML = items.map((i) => `
        <div class="line${previousKeys.has(i.key) ? '' : ' is-new'}" data-key="${escapeHTML(i.key)}">
          <div class="line-thumb" style="--c1:${i.c1};--c2:${i.c2}">${productArt(i)}</div>
          <div class="line-info">
            <strong>${escapeHTML(i.nombre)}</strong>
            <span>${escapeHTML(i.variante || i.detalle || '')}</span>
            <span class="line-price">${formatPrice(i.precio)}</span>
          </div>
          <div class="line-actions">
            <div class="stepper">
              <button type="button" data-dec aria-label="Quitar una unidad">${icon('minus', 16)}</button>
              <output>${i.qty}</output>
              <button type="button" data-inc aria-label="Agregar una unidad">${icon('plus', 16)}</button>
            </div>
            <button type="button" class="line-remove" data-remove aria-label="Eliminar del carrito">${icon('trash', 18)}</button>
          </div>
        </div>`).join('');

      const ship = cart.shipping();
      foot.hidden = false;
      foot.innerHTML = `
        <dl class="totals">
          <div><dt>Subtotal</dt><dd>${formatPrice(sub)}</dd></div>
          <div><dt>Envío</dt><dd>${ship === 0 ? 'Gratis' : formatPrice(ship)}</dd></div>
          <div class="grand"><dt>Total</dt><dd>${formatPrice(cart.total())}</dd></div>
        </dl>
        <button type="button" class="btn btn-primary btn-block" id="checkout-open">Finalizar compra</button>`;
    }
    previousKeys = new Set(items.map((i) => i.key));
  }

  cart.subscribe(renderCart);

  $('#cart-lines').addEventListener('click', (e) => {
    const line = e.target.closest('.line');
    if (!line) return;
    const key = line.dataset.key;
    const item = cart.items.find((i) => i.key === key);
    if (!item) return;
    if (e.target.closest('[data-inc]')) cart.setQty(key, item.qty + 1);
    else if (e.target.closest('[data-dec]')) cart.setQty(key, item.qty - 1);
    else if (e.target.closest('[data-remove]')) {
      line.classList.add('is-leaving');
      setTimeout(() => cart.remove(key), 260);
    }
  });

  // -- Checkout: exige cuenta verificada y dirección colombiana válida --
  const dialog = $('#checkout');
  const form = $('#checkout-form');
  const done = $('#checkout-done');
  $$('[data-filter]', form).forEach((el) => CO.filtrarEntrada(el, el.dataset.filter));
  let buyer = null;

  const ckErr = (id, text) => {
    const el = $(`#${id}-error`); if (el) el.textContent = text || '';
    const f = form.querySelector(`[data-field="${id}"]`); if (f) f.classList.toggle('has-error', Boolean(text));
    return !text;
  };
  const addr = () => ({ via: $('#ck-via').value, numero: $('#ck-num').value, cruce: $('#ck-cruce').value, placa: $('#ck-placa').value, complemento: $('#ck-comp').value });
  const preview = () => {
    const a = addr();
    $('#ck-preview').innerHTML = a.via && a.numero && a.cruce && a.placa ? `Así quedará: <b>${escapeHTML(CO.formatoDireccion(a))}</b>` : 'Ejemplo: Calle 12B # 34A - 56';
  };
  ['#ck-via', '#ck-num', '#ck-cruce', '#ck-placa', '#ck-comp'].forEach((s) => $(s).addEventListener('input', preview));
  form.addEventListener('input', (e) => { const f = e.target.closest('[data-field]'); if (f?.classList.contains('has-error')) ckErr(f.dataset.field, ''); });

  async function openCheckout() {
    if (!cart.count()) { toast('Tu carrito está vacío', 'error'); return; }
    const { currentUser } = await import('./auth-core.js');
    buyer = await currentUser();
    if (!buyer || !buyer.email_confirmed_at) {
      closeDrawers(false);
      try { sessionStorage.setItem('vokter-volver', location.pathname.split('/').pop() || 'index.html'); } catch { /* sin almacenamiento */ }
      toast('Ingresa o crea tu cuenta para comprar');
      setTimeout(() => { location.href = 'cuenta.html?volver=checkout#login'; }, 700);
      return;
    }
    const m = buyer.user_metadata || {};
    closeDrawers(false);
    form.hidden = false;
    done.hidden = true;
    form.reset();
    $$('[data-field]', form).forEach((f) => ckErr(f.dataset.field, ''));
    $('#ck-who').innerHTML = `<strong>${escapeHTML(m.nombre || buyer.email)}</strong>${escapeHTML(m.tipo_documento || '')} ${escapeHTML(m.documento || '')} · ${escapeHTML(buyer.email)}`;
    $('#ck-cel').value = m.celular || '';
    preview();
    $('#checkout-total').innerHTML = `<span>Total a pagar</span><strong>${formatPrice(cart.total())}</strong>`;
    dialog.showModal();
  }
  $('#cart-foot').addEventListener('click', (e) => { if (e.target.closest('#checkout-open')) openCheckout(); });
  if (new URLSearchParams(location.search).get('checkout') === '1') {
    history.replaceState(null, '', location.pathname + location.hash);
    setTimeout(openCheckout, 300);
  }
  $$('[data-modal-cancel]').forEach((b) => b.addEventListener('click', () => dialog.close()));
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });

  let sending = false;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (sending) return;
    const a = addr();
    const v = { dep: $('#ck-dep').value, mun: $('#ck-mun').value, barrio: $('#ck-barrio').value, cel: $('#ck-cel').value, ind: $('#ck-ind').value };
    const checks = [
      ckErr('ck-dep', CO.validarDepartamento(v.dep)),
      ckErr('ck-mun', CO.validarMunicipio(v.mun)),
      ckErr('ck-dir', CO.validarDireccion(a)),
      ckErr('ck-comp', CO.validarTextoLibre(a.complemento, CO.LIMITES.complemento)),
      ckErr('ck-barrio', CO.validarTextoLibre(v.barrio, CO.LIMITES.barrio, { requerido: true, campo: 'el barrio' })),
      ckErr('ck-cel', CO.validarCelular(v.cel)),
      ckErr('ck-ind', CO.validarTextoLibre(v.ind, CO.LIMITES.indicaciones))
    ];
    if (checks.includes(false)) {
      form.querySelector('.has-error input, .has-error select')?.focus();
      toast('Revisa los datos de envío marcados en rojo', 'error');
      return;
    }
    sending = true;
    const btn = form.querySelector('[type="submit"]'); btn.disabled = true;
    try {
      const { createOrder } = await import('./auth-core.js');
      const order = await createOrder({
        items: cart.items.map((i) => ({ id: i.id, nombre: i.nombre, precio: i.precio, cantidad: i.qty, variante: i.variante || null })),
        subtotal: cart.subtotal(), envio: cart.shipping(), total: cart.total(),
        direccion: {
          departamento: v.dep, municipio: CO.limpiar(v.mun), direccion: CO.formatoDireccion(a),
          barrio: CO.limpiar(v.barrio), indicaciones: CO.limpiar(v.ind) || null
        },
        celular: CO.normalizarCelular(v.cel)
      });
      const code = 'VK-' + String(order?.id || Date.now()).replace(/-/g, '').slice(0, 8).toUpperCase();
      $('#done-text').textContent = `Tu número de pedido es ${code}. Te contactaremos al ${CO.formatoCelular(CO.normalizarCelular(v.cel))} para coordinar el pago y el envío a ${CO.limpiar(v.mun)}, ${v.dep}.`;
      cart.clear();
      form.hidden = true;
      done.hidden = false;
    } catch (err) {
      toast(err.message || 'No pudimos registrar el pedido. Inténtalo de nuevo.', 'error');
    } finally { sending = false; btn.disabled = false; }
  });

  // -- Buscador rápido --
  const overlay = $('#search');
  const input = $('#search-input');
  const resultsBox = $('#search-results');
  let results = [];
  let activeIdx = -1;
  let dataRef = null;

  function openSearch() {
    closeDrawers(false);
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    scrim.classList.add('show');
    document.body.classList.add('no-scroll');
    input.value = '';
    renderResults();
    requestAnimationFrame(() => input.focus());
  }
  function closeSearch() {
    if (!overlay.classList.contains('open')) return;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    scrim.classList.remove('show');
    document.body.classList.remove('no-scroll');
  }
  function setActive(i) {
    activeIdx = i;
    $$('.sr-item', resultsBox).forEach((el, k) => {
      el.classList.toggle('active', k === i);
      el.setAttribute('aria-selected', String(k === i));
    });
    $$('.sr-item', resultsBox)[i]?.scrollIntoView({ block: 'nearest' });
  }
  function renderResults() {
    if (!dataRef) { resultsBox.innerHTML = '<p class="sr-hint">Cargando catálogo…</p>'; return; }
    const q = input.value.trim();
    if (!q) {
      resultsBox.innerHTML = `
        <p class="sr-hint">Explora por categoría</p>
        <div class="sr-chips">${dataRef.categorias.map((c) =>
          `<a class="chip" href="catalogo.html?cat=${c.slug}">${escapeHTML(c.nombre)}</a>`).join('')}</div>`;
      results = [];
      activeIdx = -1;
      return;
    }
    results = searchProducts(q, dataRef);
    activeIdx = results.length ? 0 : -1;
    resultsBox.innerHTML = results.length
      ? results.map((p, k) => {
          const c = dataRef.catMap[p.categoria];
          return `<a class="sr-item${k === 0 ? ' active' : ''}" role="option" aria-selected="${k === 0}" href="producto.html?id=${p.id}">
            <span class="sr-thumb" style="--c1:${c.c1};--c2:${c.c2}">${productArt(p)}</span>
            <span class="sr-info"><strong>${escapeHTML(p.nombre)}</strong><span>${escapeHTML(c.nombre)}</span></span>
            <span class="sr-price">${formatPrice(p.precio)}</span>
          </a>`;
        }).join('')
      : `<p class="sr-hint">No encontramos "${escapeHTML(q)}". Prueba con otra palabra o explora el <a href="catalogo.html">catálogo completo</a>.</p>`;
  }

  $('#search-open').addEventListener('click', openSearch);
  $('#search-open-mobile').addEventListener('click', openSearch);
  $('[data-close-search]').addEventListener('click', closeSearch);
  input.addEventListener('input', renderResults);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' && results.length) { e.preventDefault(); setActive((activeIdx + 1) % results.length); }
    else if (e.key === 'ArrowUp' && results.length) { e.preventDefault(); setActive((activeIdx - 1 + results.length) % results.length); }
    else if (e.key === 'Enter' && results[activeIdx]) { window.location.href = `producto.html?id=${results[activeIdx].id}`; }
  });
  resultsBox.addEventListener('mousemove', (e) => {
    const item = e.target.closest('.sr-item');
    if (!item) return;
    const idx = $$('.sr-item', resultsBox).indexOf(item);
    if (idx !== activeIdx) setActive(idx);
  });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeSearch(); });

  document.addEventListener('keydown', (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '');
    if ((e.key === '/' && !typing) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) {
      e.preventDefault();
      openSearch();
    } else if (e.key === 'Escape') {
      closeSearch();
      closeDrawers();
      setMega(false);
    }
  });

  // -- Newsletter (footer y home) --
  document.addEventListener('submit', (e) => {
    const f = e.target.closest('[data-newsletter]');
    if (!f) return;
    e.preventDefault();
    const email = f.querySelector('input[type="email"]');
    if (!/^\S+@\S+\.\S+$/.test(email.value.trim())) {
      email.focus();
      toast('Escribe un correo válido para suscribirte', 'error');
      return;
    }
    toast('Listo, te avisaremos de los próximos drops');
    f.reset();
  });

  // -- Datos: rellena mega menú, menú móvil y buscador --
  const data = await loadData();
  dataRef = data;
  $('#mega-grid').innerHTML = data.categorias.map((c) => `
    <a class="mega-item" href="catalogo.html?cat=${c.slug}" style="--c1:${c.c1};--c2:${c.c2}">
      <span class="mega-thumb">${art(c.arte)}</span>
      <span><strong>${escapeHTML(c.nombre)}</strong><small>${escapeHTML(c.descripcion)}</small></span>
    </a>`).join('');

  $('#mobile-links').innerHTML = `
    <a href="index.html">Inicio</a>
    <a href="catalogo.html">Tienda</a>
    <a href="index.html#bundles">Bundles</a>
    <a href="descarga.html">App móvil</a>
    <a href="ayuda.html">Ayuda</a>
    <a href="contacto.html">Contacto</a>
    <a href="cuenta.html" id="mobile-account">Mi cuenta</a>
    <p class="mobile-sub">Categorías</p>
    ${data.categorias.map((c) => `<a href="catalogo.html?cat=${c.slug}">${escapeHTML(c.nombre)}</a>`).join('')}`;

  if (overlay.classList.contains('open')) renderResults();
  initAccountButton();
  return data;
}

// Botón de cuenta del encabezado: muestra el nombre si hay sesión.
async function initAccountButton() {
  const btn = $('#account-btn');
  if (!btn) return;
  if (currentPage() === 'cuenta.html') btn.setAttribute('aria-current', 'page');
  const { currentUser, onAuthChange, displayName } = await import('./auth-core.js');
  const paint = (user) => {
    $('#account-name').textContent = user ? displayName(user) : 'Ingresar';
    btn.setAttribute('aria-label', user ? `Mi cuenta (${displayName(user)})` : 'Ingresar o crear cuenta');
  };
  paint(await currentUser());
  onAuthChange(paint);
}

export function openCart() {
  window.dispatchEvent(new Event('vokter:open-cart'));
}
