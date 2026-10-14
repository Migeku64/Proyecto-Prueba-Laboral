// main.js — página de inicio
import { $, $$, formatPrice, escapeHTML } from './utils.js';
import { initLayout } from './layout.js';
import { art, icon } from './icons.js';
import { productCard, skeletonCards, bundleCard, bindAddActions, phoneMock } from './components.js';
import { bindIndicator, enableArrowNav } from './ui.js';

// Mientras llegan los datos, la grilla muestra esqueletos
$('#feat-grid').innerHTML = skeletonCards(8);

const data = await initLayout();
const { productos, categorias, bundles, catMap, prodMap } = data;

// Íconos estáticos de la franja de beneficios y controles
$('#b-truck').innerHTML = icon('truck', 24);
$('#b-shield').innerHTML = icon('shield', 24);
$('#b-award').innerHTML = icon('award', 24);
$('#b-gift').innerHTML = icon('gift', 24);
$('#arrow-all').innerHTML = icon('arrow', 18);
$('#rail-prev').innerHTML = icon('left');
$('#rail-next').innerHTML = icon('right');

/* ---------------------------------------------------------------------------
   Hero: carrusel con miniaturas que se llenan como barra de progreso.
   El avance automático lo dispara el fin de la animación CSS de la miniatura
   activa, así que pausar el puntero sobre el hero también pausa el avance.
--------------------------------------------------------------------------- */
const minPrice = (slug) => Math.min(...productos.filter((p) => p.categoria === slug).map((p) => p.precio));

const SLIDES = [
  {
    chip: 'Nuevo Drop 2026', chipIcon: 'sparkle',
    lines: ['Rendimiento', 'Tecnología', 'Urbano'],
    text: 'Sneakers, gadgets y gear esencial para los que viven al límite.',
    art: 'sneaker', colors: ['#0A57F5', '#7A4DFF'],
    actions: [
      { label: 'Explorar Tienda', href: 'catalogo.html', cls: 'btn-light', arrow: true },
      { label: 'Footwear', href: 'catalogo.html?cat=footwear', cls: 'btn-glass' }
    ],
    tag: { small: 'Sneakers desde', value: formatPrice(minPrice('footwear')) },
    thumb: { title: 'Nuevo Drop 2026', sub: 'Sneakers y gear urbano', icon: 'sparkle' }
  },
  {
    chip: 'Audio', chipIcon: 'music',
    lines: ['Sonido que', 'te sigue', 'el ritmo'],
    text: 'Balacas y audífonos con el sello VOKTER, desde $26.000.',
    art: 'headphones', colors: ['#0B63F6', '#18B6E6'],
    actions: [
      { label: 'Ver audio', href: 'catalogo.html?cat=audio', cls: 'btn-light', arrow: true },
      { label: 'Todo el catálogo', href: 'catalogo.html', cls: 'btn-glass' }
    ],
    tag: { small: 'Audio desde', value: formatPrice(minPrice('audio')) },
    thumb: { title: 'Audio', sub: 'Balacas y audífonos', icon: 'music' }
  },
  {
    chip: 'Bundles', chipIcon: 'tag',
    lines: ['Combina', 'y ahorra hasta', '20%'],
    text: 'Sneakers, tecnología y accesorios juntos en un solo paquete.',
    art: 'powerbank', colors: ['#7A4DFF', '#E23D91'],
    actions: [{ label: 'Ver bundles', href: '#bundles', cls: 'btn-light', arrow: true }],
    tag: { small: 'Bundle Tech', value: '20% menos' },
    thumb: { title: 'Bundles', sub: 'Hasta 20% de descuento', icon: 'tag' }
  },
  {
    chip: 'App móvil', chipIcon: 'phone',
    lines: ['VOKTER', 'en tu', 'bolsillo'],
    text: 'Descarga la app y entérate primero de cada drop.',
    art: 'phone', colors: ['#1363F2', '#00B8A3'],
    actions: [{ label: 'Descargar app', href: 'descarga.html', cls: 'btn-light', arrow: true }],
    thumb: { title: 'App móvil', sub: 'Disponible para Android', icon: 'download' }
  }
];

const stage = $('#hero');
stage.innerHTML = `
  <div class="hero-arrows">
    <button type="button" data-prev aria-label="Destacado anterior">${icon('left')}</button>
    <button type="button" data-next aria-label="Destacado siguiente">${icon('right')}</button>
  </div>
  ${SLIDES.map((s, i) => `
    <div class="slide" role="group" aria-roledescription="diapositiva" aria-label="${i + 1} de ${SLIDES.length}">
      <div class="slide-copy">
        <span class="slide-chip">${icon(s.chipIcon, 16)}${escapeHTML(s.chip)}</span>
        <h1>${s.lines.map((l) => `<span>${escapeHTML(l)}</span>`).join('')}</h1>
        <p class="slide-text">${escapeHTML(s.text)}</p>
        <div class="slide-actions">
          ${s.actions.map((a) => `<a class="btn ${a.cls}" href="${a.href}">${escapeHTML(a.label)}${a.arrow ? icon('arrow', 18) : ''}</a>`).join('')}
        </div>
      </div>
      <div class="slide-art" aria-hidden="true">
        <div class="art-wrap">
          ${art(s.art)}
          ${s.tag ? `<div class="price-tag"><small>${escapeHTML(s.tag.small)}</small><strong>${escapeHTML(s.tag.value)}</strong></div>` : ''}
        </div>
      </div>
    </div>`).join('')}
  <div class="hero-thumbs" role="tablist" aria-label="Elegir destacado">
    ${SLIDES.map((s, i) => `
      <button type="button" class="thumb" role="tab" data-i="${i}" aria-selected="false">
        <span class="thumb-ico">${icon(s.thumb.icon, 24)}</span>
        <span><strong>${escapeHTML(s.thumb.title)}</strong><small>${escapeHTML(s.thumb.sub)}</small></span>
      </button>`).join('')}
  </div>`;

const slideEls = $$('.slide', stage);
const thumbs = $$('.thumb', stage);
let current = -1;

function go(index) {
  const next = (index + SLIDES.length) % SLIDES.length;
  if (next === current) return;
  current = next;
  slideEls.forEach((el, i) => el.classList.toggle('active', i === next));
  thumbs.forEach((el, i) => {
    el.classList.toggle('active', i === next);
    el.setAttribute('aria-selected', String(i === next));
    el.tabIndex = i === next ? 0 : -1;
  });
  stage.style.setProperty('--h1', SLIDES[next].colors[0]);
  stage.style.setProperty('--h2', SLIDES[next].colors[1]);
}

$('.hero-thumbs', stage).addEventListener('click', (e) => {
  const t = e.target.closest('.thumb');
  if (t) go(Number(t.dataset.i));
});
$('.hero-thumbs', stage).addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
  e.preventDefault();
  go(current + (e.key === 'ArrowRight' ? 1 : -1));
  thumbs[current].focus();
});
$('.hero-thumbs', stage).addEventListener('animationend', (e) => {
  if (e.animationName === 'fill') go(current + 1);
});
$('[data-prev]', stage).addEventListener('click', () => go(current - 1));
$('[data-next]', stage).addEventListener('click', () => go(current + 1));

// El arte del hero sigue suavemente al puntero
stage.addEventListener('pointermove', (e) => {
  if (e.pointerType === 'touch') return;
  const r = stage.getBoundingClientRect();
  stage.style.setProperty('--mx', (((e.clientX - r.left) / r.width) - 0.5) * 2);
  stage.style.setProperty('--my', (((e.clientY - r.top) / r.height) - 0.5) * 2);
});
stage.addEventListener('pointerleave', () => {
  stage.style.setProperty('--mx', 0);
  stage.style.setProperty('--my', 0);
});

// Deslizar en pantallas táctiles
let touchX = null;
stage.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
stage.addEventListener('touchend', (e) => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 50) go(current + (dx < 0 ? 1 : -1));
  touchX = null;
});

go(0);

/* ---------------------------------------------------------------------------
   Categorías: fila horizontal con enfoque
--------------------------------------------------------------------------- */
const rail = $('#cat-rail');
rail.innerHTML = categorias.map((c) => `
  <a class="cat-tile" href="catalogo.html?cat=${c.slug}" style="--c1:${c.c1};--c2:${c.c2}">
    ${art(c.arte)}
    <strong>${escapeHTML(c.nombre)}</strong>
    <span>${escapeHTML(c.descripcion)}</span>
  </a>`).join('');
enableArrowNav(rail, '.cat-tile');
const step = () => rail.clientWidth * 0.8;
$('#rail-prev').addEventListener('click', () => rail.scrollBy({ left: -step(), behavior: 'smooth' }));
$('#rail-next').addEventListener('click', () => rail.scrollBy({ left: step(), behavior: 'smooth' }));

/* ---------------------------------------------------------------------------
   Destacados: pestañas por categoría
--------------------------------------------------------------------------- */
const tabsEl = $('#feat-tabs');
const grid = $('#feat-grid');
const TABS = [{ key: 'top', label: 'Mejor calificados' }, ...categorias.map((c) => ({ key: c.slug, label: c.nombre }))];

tabsEl.innerHTML = TABS.map((t, i) =>
  `<button type="button" class="tab${i === 0 ? ' active' : ''}" role="tab" aria-selected="${i === 0}" data-key="${t.key}">${escapeHTML(t.label)}</button>`
).join('');
const tabIndicator = bindIndicator(tabsEl, '.tab');

function renderFeatured(key) {
  const list = key === 'top'
    ? [...productos].sort((a, b) => b.rating - a.rating).slice(0, 8)
    : productos.filter((p) => p.categoria === key).slice(0, 8);
  grid.innerHTML = list.map((p, i) => productCard(p, i, catMap)).join('');
}

function selectTab(tab) {
  $$('.tab', tabsEl).forEach((t) => {
    t.classList.toggle('active', t === tab);
    t.setAttribute('aria-selected', String(t === tab));
  });
  tabIndicator.sync();
  tab.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  renderFeatured(tab.dataset.key);
}

tabsEl.addEventListener('click', (e) => {
  const tab = e.target.closest('.tab');
  if (tab) selectTab(tab);
});
tabsEl.addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
  const tabs = $$('.tab', tabsEl);
  const i = tabs.findIndex((t) => t.classList.contains('active'));
  const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
  next.focus();
  selectTab(next);
});

renderFeatured('top');
enableArrowNav(grid, '.card-link');

/* ---------------------------------------------------------------------------
   Bundles, app y acciones de agregar
--------------------------------------------------------------------------- */
$('#bundles-grid').innerHTML = bundles.map((b, i) => bundleCard(b, prodMap, i)).join('');
$('#phone-mock').innerHTML = phoneMock(data);
bindAddActions($('#main'), { prodMap, catMap, bundles });
