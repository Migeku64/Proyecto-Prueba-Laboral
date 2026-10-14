// components.js — piezas de interfaz reutilizables entre páginas
import { art, icon, starIcon } from './icons.js';
import { formatPrice, discountPercent, escapeHTML, bundleTotals } from './utils.js';
import { cart } from './cart.js';
import { toast, flyToCart } from './ui.js';

export function ratingHTML(rating) {
  return `<span class="rating" title="Calificación ${rating} de 5">${starIcon(14)}<b>${rating.toFixed(1)}</b></span>`;
}

export function productCard(p, index, catMap) {
  const cat = catMap[p.categoria];
  const off = discountPercent(p);
  const badges = [];
  if (off) badges.push(`<span class="badge badge-sale">-${off}%</span>`);
  if (p.nuevo) badges.push('<span class="badge badge-new">Nuevo</span>');
  if (p.stock <= 6) badges.push(`<span class="badge badge-low">Quedan ${p.stock}</span>`);

  return `
  <article class="card" style="--c1:${cat.c1};--c2:${cat.c2};--i:${index}">
    <div class="card-media">
      <div class="badges">${badges.join('')}</div>
      ${art(p.arte)}
    </div>
    <div class="card-body">
      <span class="card-brand">${escapeHTML(p.marca)}</span>
      <h3 class="card-title"><a class="card-link" href="producto.html?id=${p.id}">${escapeHTML(p.nombre)}</a></h3>
      <div class="card-meta">${ratingHTML(p.rating)}<span class="card-cat">${escapeHTML(cat.nombre)}</span></div>
      <div class="card-price">
        <strong>${formatPrice(p.precio)}</strong>
        ${p.precioAnterior ? `<s>${formatPrice(p.precioAnterior)}</s>` : ''}
      </div>
      <button type="button" class="quick-add" data-add="${p.id}" aria-label="Agregar ${escapeHTML(p.nombre)} al carrito">${icon('plus', 20)}</button>
    </div>
  </article>`;
}

export function skeletonCards(n = 8) {
  return Array.from({ length: n }, (_, i) => `
    <div class="card skeleton" style="--i:${i}" aria-hidden="true">
      <div class="card-media"></div>
      <div class="card-body"><span class="sk-line w40"></span><span class="sk-line w80"></span><span class="sk-line w60"></span></div>
    </div>`).join('');
}

export function emptyState(title, text, actionHTML = '') {
  return `
    <div class="empty">
      <div class="empty-art">${icon('search', 34)}</div>
      <h3>${title}</h3>
      <p>${text}</p>
      ${actionHTML}
    </div>`;
}

export function bundleCard(bundle, prodMap, index) {
  const { items, subtotal, total } = bundleTotals(bundle, prodMap);
  return `
  <article class="bundle" style="--c1:${bundle.c1};--c2:${bundle.c2};--i:${index}">
    <div class="bundle-top">
      <span class="bundle-off">${bundle.descuento}%</span>
      <span class="bundle-off-label">de descuento</span>
    </div>
    <h3>${escapeHTML(bundle.nombre)}</h3>
    <p>${escapeHTML(bundle.descripcion)}</p>
    <div class="bundle-arts" aria-hidden="true">
      ${items.map((p, k) => `<span class="bundle-art" style="--k:${k}">${art(p.arte)}</span>`).join('')}
    </div>
    <ul class="bundle-items">${items.map((p) => `<li>${escapeHTML(p.nombre)}</li>`).join('')}</ul>
    <div class="bundle-foot">
      <div class="bundle-price"><s>${formatPrice(subtotal)}</s><strong>${formatPrice(total)}</strong></div>
      <button type="button" class="btn btn-light" data-bundle="${bundle.id}">Agregar bundle</button>
    </div>
  </article>`;
}

// Delegación de eventos: un solo listener para todos los botones "agregar" de un contenedor.
export function bindAddActions(root, { prodMap, catMap, bundles = [] }) {
  root.addEventListener('click', (e) => {
    const addBtn = e.target.closest('[data-add]');
    if (addBtn) {
      const p = prodMap[addBtn.dataset.add];
      if (!p) return;
      const cat = catMap[p.categoria];
      cart.add({ id: p.id, nombre: p.nombre, precio: p.precio, arte: p.arte, c1: cat.c1, c2: cat.c2 });
      flyToCart(addBtn, cat.c1, cat.c2);
      addBtn.classList.add('done');
      addBtn.innerHTML = icon('check', 20);
      setTimeout(() => { addBtn.classList.remove('done'); addBtn.innerHTML = icon('plus', 20); }, 1300);
      toast(`${p.nombre} se agregó al carrito`);
      return;
    }

    const bundleBtn = e.target.closest('[data-bundle]');
    if (bundleBtn) {
      const b = bundles.find((x) => x.id === bundleBtn.dataset.bundle);
      if (!b) return;
      const { items, total } = bundleTotals(b, prodMap);
      cart.add({
        id: b.id,
        nombre: b.nombre,
        precio: total,
        arte: items[0].arte,
        c1: b.c1,
        c2: b.c2,
        detalle: `${b.descuento}% de descuento incluido`
      });
      flyToCart(bundleBtn, b.c1, b.c2);
      toast(`${b.nombre} se agregó al carrito`);
    }
  });
}

// Maqueta del teléfono con la interfaz de la app (se usa en la home y en la página de descarga).
export function phoneMock({ prodMap, catMap }) {
  const picks = ['airpods-max', 'sneaker-runner-x'].map((id) => prodMap[id]).filter(Boolean);
  return `
  <div class="phone" aria-hidden="true">
    <div class="phone-screen">
      <div class="phone-bar"><span>VOKTER</span><i></i></div>
      <div class="phone-hero">${art('sneaker')}</div>
      <div class="phone-row">
        ${picks.map((p) => `
          <div class="phone-card" style="--c1:${catMap[p.categoria].c1};--c2:${catMap[p.categoria].c2}">
            <span>${art(p.arte)}</span>${escapeHTML(p.nombre)}<b>${formatPrice(p.precio)}</b>
          </div>`).join('')}
      </div>
      <div class="phone-pill">Ver el nuevo drop</div>
    </div>
  </div>`;
}
