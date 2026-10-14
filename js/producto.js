// producto.js — ficha de producto (producto.html?id=...)
import { $, $$, param, formatPrice, escapeHTML, discountPercent, COLOR_VARIANTS, reducedMotion } from './utils.js';
import { initLayout, openCart } from './layout.js';
import { art, icon } from './icons.js';
import { cart, FREE_SHIPPING_FROM } from './cart.js';
import { productCard, ratingHTML, emptyState, bindAddActions } from './components.js';
import { bindIndicator, enableArrowNav, flyToCart, toast } from './ui.js';

const data = await initLayout();
const { productos, catMap, prodMap } = data;
const pdp = $('#pdp');
const product = prodMap[param('id')];

if (!product) {
  $('#crumbs').hidden = true;
  pdp.style.display = 'block';
  pdp.innerHTML = emptyState(
    'No encontramos ese producto',
    'Puede que el enlace esté incompleto o que el producto ya no esté disponible.',
    '<a class="btn btn-primary" href="catalogo.html">Ir a la tienda</a>'
  );
} else {
  renderProduct(product);
}

function renderProduct(p) {
  const cat = catMap[p.categoria];
  const off = discountPercent(p);
  const variants = [
    { nombre: 'Original', c1: cat.c1, c2: cat.c2 },
    ...COLOR_VARIANTS.filter((v) => v.c1 !== cat.c1)
  ].slice(0, 4);
  let variant = variants[0];
  let qty = 1;

  document.title = `${p.nombre} — VOKTER`;
  $('#crumbs').innerHTML = `
    <a href="index.html">Inicio</a><span>/</span><a href="catalogo.html">Tienda</a><span>/</span>
    <a href="catalogo.html?cat=${cat.slug}">${escapeHTML(cat.nombre)}</a><span>/</span><span>${escapeHTML(p.nombre)}</span>`;

  const badges = [
    off ? `<span class="badge badge-sale">-${off}%</span>` : '',
    p.nuevo ? '<span class="badge badge-new">Nuevo</span>' : '',
    p.stock <= 6 ? `<span class="badge badge-low">Quedan ${p.stock}</span>` : ''
  ].join('');

  pdp.innerHTML = `
    <div class="pdp-media" id="pdp-media" style="--c1:${cat.c1};--c2:${cat.c2}">
      <div class="badges">${badges}</div>
      <div class="pdp-art" id="pdp-art">${art(p.arte)}</div>
    </div>

    <div class="pdp-info">
      <div>
        <a class="link-arrow" href="catalogo.html?cat=${cat.slug}" style="font-size:14px">${escapeHTML(p.marca)} · ${escapeHTML(cat.nombre)}</a>
        <h1 style="margin-top:8px">${escapeHTML(p.nombre)}</h1>
      </div>
      <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;font-size:14px;color:var(--ink-soft)">
        ${ratingHTML(p.rating)}<span>${p.stock > 6 ? 'Disponible' : `Quedan ${p.stock} unidades`}</span>
      </div>
      <div class="pdp-price">
        <strong>${formatPrice(p.precio)}</strong>
        ${p.precioAnterior ? `<s>${formatPrice(p.precioAnterior)}</s>` : ''}
      </div>
      <p class="pdp-lead">${escapeHTML(p.descripcion)}</p>

      <div>
        <div class="pdp-label">Color<span id="variant-name">${variant.nombre}</span></div>
        <div class="swatches" role="radiogroup" aria-label="Color">
          ${variants.map((v, i) => `
            <button type="button" class="swatch${i === 0 ? ' active' : ''}" role="radio" aria-checked="${i === 0}"
              aria-label="${escapeHTML(v.nombre)}" data-i="${i}" style="--c1:${v.c1};--c2:${v.c2}"></button>`).join('')}
        </div>
      </div>

      <div class="buy-row">
        <div class="stepper" aria-label="Cantidad">
          <button type="button" id="qty-dec" aria-label="Menos">${icon('minus', 18)}</button>
          <output id="qty" aria-live="polite">1</output>
          <button type="button" id="qty-inc" aria-label="Más">${icon('plus', 18)}</button>
        </div>
        <button type="button" class="btn btn-primary" id="add-btn">${icon('cart', 20)}<span>Agregar al carrito</span></button>
        <button type="button" class="btn btn-ghost" id="buy-btn">Comprar ahora</button>
      </div>

      <div class="trust">
        <div>${icon('truck', 22)}Envío en 24-48 hrs</div>
        <div>${icon('shield', 22)}Compra protegida</div>
        <div>${icon('award', 22)}Calidad garantizada</div>
      </div>

      <div>
        <div class="tabs" id="info-tabs" role="tablist" aria-label="Información del producto">
          <button type="button" class="tab active" role="tab" aria-selected="true" data-panel="desc">Descripción</button>
          <button type="button" class="tab" role="tab" aria-selected="false" data-panel="feat">Características</button>
          <button type="button" class="tab" role="tab" aria-selected="false" data-panel="ship">Envío</button>
        </div>
        <div class="tab-panels">
          <div class="tab-panel" data-id="desc"><p>${escapeHTML(p.descripcion)} Producto vendido y despachado por VOKTER, con garantía de calidad.</p></div>
          <div class="tab-panel" data-id="feat" hidden>
            <ul class="features">${p.caracteristicas.map((c) => `<li>${icon('check', 16)}${escapeHTML(c)}</li>`).join('')}</ul>
          </div>
          <div class="tab-panel" data-id="ship" hidden>
            <p>Despachamos en 24-48 horas. El envío es gratis desde ${formatPrice(FREE_SHIPPING_FROM)}; por debajo de ese valor se cobra una tarifa fija que verás en tu carrito antes de pagar.</p>
          </div>
        </div>
      </div>
    </div>`;

  /* Color: el degradado del producto cambia con transición */
  const media = $('#pdp-media');
  $('.swatches').addEventListener('click', (e) => {
    const sw = e.target.closest('.swatch');
    if (!sw) return;
    variant = variants[Number(sw.dataset.i)];
    $$('.swatch').forEach((s) => {
      s.classList.toggle('active', s === sw);
      s.setAttribute('aria-checked', String(s === sw));
    });
    media.style.setProperty('--c1', variant.c1);
    media.style.setProperty('--c2', variant.c2);
    $('#variant-name').textContent = variant.nombre;
  });

  /* Inclinación 3D siguiendo el puntero */
  const artEl = $('#pdp-art');
  if (!reducedMotion()) {
    media.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      const r = media.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      artEl.style.transform = `rotateY(${x * 18}deg) rotateX(${-y * 18}deg) scale(1.05)`;
    });
    media.addEventListener('pointerleave', () => { artEl.style.transform = ''; });
  }

  /* Cantidad */
  const setQty = (n) => {
    qty = Math.min(Math.max(1, n), p.stock);
    $('#qty').textContent = qty;
  };
  $('#qty-dec').addEventListener('click', () => setQty(qty - 1));
  $('#qty-inc').addEventListener('click', () => setQty(qty + 1));

  /* Agregar / comprar */
  const addToCart = () => cart.add({
    id: p.id, nombre: p.nombre, precio: p.precio, arte: p.arte,
    c1: variant.c1, c2: variant.c2, variante: variant.nombre
  }, qty);

  const addBtn = $('#add-btn');
  addBtn.addEventListener('click', () => {
    addToCart();
    flyToCart(artEl, variant.c1, variant.c2);
    addBtn.classList.add('done');
    addBtn.innerHTML = `${icon('check', 20)}<span>Agregado</span>`;
    setTimeout(() => {
      addBtn.classList.remove('done');
      addBtn.innerHTML = `${icon('cart', 20)}<span>Agregar al carrito</span>`;
    }, 1400);
    toast(`${qty > 1 ? `${qty} × ` : ''}${p.nombre} se agregó al carrito`);
  });
  $('#buy-btn').addEventListener('click', () => { addToCart(); openCart(); });

  /* Pestañas de información */
  const tabs = $('#info-tabs');
  const tabIndicator = bindIndicator(tabs, '.tab');
  tabs.addEventListener('click', (e) => {
    const tab = e.target.closest('.tab');
    if (!tab) return;
    $$('.tab', tabs).forEach((t) => {
      t.classList.toggle('active', t === tab);
      t.setAttribute('aria-selected', String(t === tab));
    });
    tabIndicator.sync();
    $$('.tab-panel').forEach((panel) => { panel.hidden = panel.dataset.id !== tab.dataset.panel; });
  });

  /* Relacionados: misma categoría primero, luego los mejor calificados */
  const related = [
    ...productos.filter((x) => x.categoria === p.categoria && x.id !== p.id),
    ...[...productos].sort((a, b) => b.rating - a.rating).filter((x) => x.categoria !== p.categoria && x.id !== p.id)
  ].slice(0, 4);
  $('#related').innerHTML = related.map((x, i) => productCard(x, i, catMap)).join('');
  $('#arrow-all').innerHTML = icon('arrow', 18);
  $('#related-section').hidden = false;
  enableArrowNav($('#related'), '.card-link');
  bindAddActions($('#main'), { prodMap, catMap });
}
