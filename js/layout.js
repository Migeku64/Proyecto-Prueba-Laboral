// layout.js — todo lo que se repite en cada página: header, mega menú, carrito lateral,
// buscador rápido, checkout simulado y footer. Cada página solo escribe su <main>.
import { $, $$, loadData, formatPrice, currentPage, escapeHTML, norm } from './utils.js';
import { art, icon } from './icons.js';
import { initTheme } from './theme.js';
import { cart, FREE_SHIPPING_FROM } from './cart.js';
import { bindIndicator, toast, bumpCart } from './ui.js';

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

  <dialog class="modal" id="checkout">
    <form method="dialog" id="checkout-form" novalidate>
      <h2>Finalizar compra</h2>
      <p class="modal-sub">Este es un checkout de demostración: no se realiza ningún cobro.</p>
      <label>Nombre completo<input name="nombre" type="text" autocomplete="name" required></label>
      <label>Ciudad<input name="ciudad" type="text" autocomplete="address-level2" required></label>
      <label>Celular<input name="celular" type="tel" autocomplete="tel" required></label>
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
          <div class="line-thumb" style="--c1:${i.c1};--c2:${i.c2}">${art(i.arte)}</div>
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

  // -- Checkout simulado --
  const dialog = $('#checkout');
  const form = $('#checkout-form');
  const done = $('#checkout-done');
  $('#cart-foot').addEventListener('click', (e) => {
    if (!e.target.closest('#checkout-open')) return;
    closeDrawers(false);
    form.hidden = false;
    done.hidden = true;
    form.reset();
    $('#checkout-total').innerHTML = `<span>Total a pagar</span><strong>${formatPrice(cart.total())}</strong>`;
    dialog.showModal();
  });
  $$('[data-modal-cancel]').forEach((b) => b.addEventListener('click', () => dialog.close()));
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const missing = $$('input', form).find((i) => !i.value.trim());
    if (missing) { missing.focus(); toast('Completa todos los campos para confirmar', 'error'); return; }
    const order = `VK-${Math.floor(100000 + Math.random() * 900000)}`;
    $('#done-text').textContent = `Tu número de pedido es ${order}. Te contactaremos al ${form.celular.value} para coordinar el envío.`;
    cart.clear();
    form.hidden = true;
    done.hidden = false;
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
            <span class="sr-thumb" style="--c1:${c.c1};--c2:${c.c2}">${art(p.arte)}</span>
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
    <p class="mobile-sub">Categorías</p>
    ${data.categorias.map((c) => `<a href="catalogo.html?cat=${c.slug}">${escapeHTML(c.nombre)}</a>`).join('')}`;

  if (overlay.classList.contains('open')) renderResults();
  return data;
}

export function openCart() {
  window.dispatchEvent(new Event('vokter:open-cart'));
}
