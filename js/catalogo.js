// catalogo.js — tienda: búsqueda en vivo + categorías + filtros combinables + orden
import { $, $$, param, formatPrice, escapeHTML, norm } from './utils.js';
import { initLayout } from './layout.js';
import { icon, starIcon } from './icons.js';
import { productCard, skeletonCards, emptyState, bindAddActions } from './components.js';
import { bindIndicator, enableArrowNav } from './ui.js';

const grid = $('#grid');
grid.innerHTML = skeletonCards(8);

const data = await initLayout();
const { productos, categorias, catMap, prodMap } = data;

const MAX_PRICE = Math.ceil(Math.max(...productos.map((p) => p.precio)) / 10000) * 10000;
const MIN_PRICE = 20000;
const SORTS = ['relevancia', 'precio-asc', 'precio-desc', 'rating'];
const DEFAULT_COLORS = ['#0A57F5', '#7A4DFF'];
const DEFAULT_LEAD = 'Sneakers, gadgets y gear esencial para los que viven al límite.';

const state = {
  cat: catMap[param('cat')] ? param('cat') : 'todos',
  q: param('q') || '',
  marcas: new Set(),
  max: MAX_PRICE,
  rating: 0,
  ofertas: false,
  nuevos: false,
  sort: SORTS.includes(param('sort')) ? param('sort') : 'relevancia'
};

/* ---------- Interfaz de filtros ---------- */
const marcas = [...new Set(productos.map((p) => p.marca))].sort((a, b) => a.localeCompare(b));
const ratingOptions = [{ v: 0, label: 'Todas' }, { v: 4, label: '4.0+' }, { v: 4.5, label: '4.5+' }, { v: 4.7, label: '4.7+' }];

$('#filters').innerHTML = `
  <h2>Filtros <button type="button" class="link-btn" data-reset>Limpiar</button></h2>
  <div>
    <h3>Marca</h3>
    ${marcas.map((m) => `
      <label class="check"><input type="checkbox" data-marca="${escapeHTML(m)}">${escapeHTML(m)}
        <small>${productos.filter((p) => p.marca === m).length}</small></label>`).join('')}
  </div>
  <div>
    <h3>Precio máximo</h3>
    <div class="range-row"><span>Hasta</span><span id="max-label">${formatPrice(MAX_PRICE)}</span></div>
    <input type="range" id="max" min="${MIN_PRICE}" max="${MAX_PRICE}" step="5000" value="${MAX_PRICE}" aria-label="Precio máximo">
  </div>
  <div>
    <h3>Calificación mínima</h3>
    <div class="chip-group" id="rating-chips">
      ${ratingOptions.map((o) => `<button type="button" class="chip${o.v === 0 ? ' active' : ''}" data-rating="${o.v}">${o.v ? starIcon(14) : ''}${o.label}</button>`).join('')}
    </div>
  </div>
  <label class="switch"><span>Solo ofertas</span><input type="checkbox" id="ofertas" role="switch"></label>
  <label class="switch"><span>Solo nuevos</span><input type="checkbox" id="nuevos" role="switch"></label>`;

$('#shop-search-icon').innerHTML = icon('search', 20);
$('#filter-toggle').innerHTML = `${icon('filter', 16)}Filtros`;
$('#shop-q').value = state.q;
$('#sort').value = state.sort;

const tabsEl = $('#cat-tabs');
tabsEl.innerHTML = [{ slug: 'todos', nombre: 'Todo' }, ...categorias].map((c) =>
  `<button type="button" class="tab${c.slug === state.cat ? ' active' : ''}" role="tab" aria-selected="${c.slug === state.cat}" data-cat="${c.slug}">${escapeHTML(c.nombre)}</button>`
).join('');
const tabIndicator = bindIndicator(tabsEl, '.tab');

/* ---------- Filtrado y orden ---------- */
function visibleProducts() {
  const words = norm(state.q).split(/\s+/).filter(Boolean);

  const list = productos.filter((p) => {
    if (state.cat !== 'todos' && p.categoria !== state.cat) return false;
    if (state.marcas.size && !state.marcas.has(p.marca)) return false;
    if (p.precio > state.max) return false;
    if (p.rating < state.rating) return false;
    if (state.ofertas && !p.precioAnterior) return false;
    if (state.nuevos && !p.nuevo) return false;
    if (words.length) {
      const haystack = norm(`${p.nombre} ${p.marca} ${catMap[p.categoria].nombre} ${p.descripcion}`);
      if (!words.every((w) => haystack.includes(w))) return false;
    }
    return true;
  });

  const by = {
    'precio-asc': (a, b) => a.precio - b.precio,
    'precio-desc': (a, b) => b.precio - a.precio,
    rating: (a, b) => b.rating - a.rating,
    relevancia: (a, b) => (Number(!!b.destacado) - Number(!!a.destacado)) || (b.rating - a.rating)
  };
  return list.sort(by[state.sort]);
}

function activeChips() {
  const chips = [];
  if (state.q.trim()) chips.push({ k: 'q', label: `“${state.q.trim()}”` });
  state.marcas.forEach((m) => chips.push({ k: 'marca', v: m, label: m }));
  if (state.max < MAX_PRICE) chips.push({ k: 'max', label: `Hasta ${formatPrice(state.max)}` });
  if (state.rating) chips.push({ k: 'rating', label: `${state.rating.toFixed(1)}+ estrellas` });
  if (state.ofertas) chips.push({ k: 'ofertas', label: 'Solo ofertas' });
  if (state.nuevos) chips.push({ k: 'nuevos', label: 'Solo nuevos' });
  return chips;
}

function updateHero() {
  const cat = catMap[state.cat];
  const title = cat ? cat.nombre : 'Tienda VOKTER';
  const [c1, c2] = cat ? [cat.c1, cat.c2] : DEFAULT_COLORS;
  const hero = $('#shop-hero');
  hero.style.setProperty('--h1', c1);
  hero.style.setProperty('--h2', c2);
  $('#shop-title').textContent = title;
  $('#shop-lead').textContent = cat ? cat.descripcion : DEFAULT_LEAD;
  $('#crumb-current').textContent = cat ? cat.nombre : 'Tienda';
  document.title = `${title} — VOKTER`;
}

function syncURL() {
  const q = new URLSearchParams();
  if (state.cat !== 'todos') q.set('cat', state.cat);
  if (state.q.trim()) q.set('q', state.q.trim());
  if (state.sort !== 'relevancia') q.set('sort', state.sort);
  const qs = q.toString();
  history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
}

function render({ animate = true } = {}) {
  const list = visibleProducts();
  grid.classList.toggle('instant', !animate);
  grid.innerHTML = list.length
    ? list.map((p, i) => productCard(p, i, catMap)).join('')
    : emptyState(
        'No encontramos productos con esos filtros',
        'Prueba quitando algún filtro o buscando con otra palabra.',
        '<button type="button" class="btn btn-primary" data-reset>Limpiar filtros</button>'
      );
  $('#count').textContent = `${list.length} ${list.length === 1 ? 'producto' : 'productos'}`;
  $('#active-filters').innerHTML = activeChips().map((c) =>
    `<button type="button" class="chip" data-chip="${c.k}" data-v="${escapeHTML(c.v ?? '')}" aria-label="Quitar filtro ${escapeHTML(c.label)}">${escapeHTML(c.label)}${icon('close', 14)}</button>`
  ).join('');
  updateHero();
  syncURL();
}

// Refleja el estado en los controles (al limpiar o quitar chips)
function syncControls() {
  $('#shop-q').value = state.q;
  $$('[data-marca]').forEach((c) => { c.checked = state.marcas.has(c.dataset.marca); });
  $('#max').value = state.max;
  $('#max-label').textContent = formatPrice(state.max);
  $$('[data-rating]').forEach((c) => c.classList.toggle('active', Number(c.dataset.rating) === state.rating));
  $('#ofertas').checked = state.ofertas;
  $('#nuevos').checked = state.nuevos;
}

function resetFilters() {
  state.q = '';
  state.marcas.clear();
  state.max = MAX_PRICE;
  state.rating = 0;
  state.ofertas = false;
  state.nuevos = false;
  syncControls();
  render();
}

/* ---------- Eventos ---------- */
let searchTimer;
$('#shop-q').addEventListener('input', (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { state.q = e.target.value; render({ animate: false }); }, 120);
});

$('#sort').addEventListener('change', (e) => { state.sort = e.target.value; render(); });

tabsEl.addEventListener('click', (e) => {
  const tab = e.target.closest('.tab');
  if (!tab) return;
  state.cat = tab.dataset.cat;
  $$('.tab', tabsEl).forEach((t) => {
    t.classList.toggle('active', t === tab);
    t.setAttribute('aria-selected', String(t === tab));
  });
  tabIndicator.sync();
  tab.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  render();
});

const filters = $('#filters');
filters.addEventListener('input', (e) => {
  if (e.target.id === 'max') {
    state.max = Number(e.target.value);
    $('#max-label').textContent = formatPrice(state.max);
    render({ animate: false });
  }
});
filters.addEventListener('change', (e) => {
  const t = e.target;
  if (t.dataset.marca) {
    if (t.checked) state.marcas.add(t.dataset.marca); else state.marcas.delete(t.dataset.marca);
  } else if (t.id === 'ofertas') state.ofertas = t.checked;
  else if (t.id === 'nuevos') state.nuevos = t.checked;
  else return;
  render();
});
filters.addEventListener('click', (e) => {
  const chip = e.target.closest('[data-rating]');
  if (!chip) return;
  state.rating = Number(chip.dataset.rating);
  syncControls();
  render();
});

$('#main').addEventListener('click', (e) => {
  if (e.target.closest('[data-reset]')) { resetFilters(); return; }
  const chip = e.target.closest('[data-chip]');
  if (!chip) return;
  const { chip: key, v } = chip.dataset;
  if (key === 'q') state.q = '';
  else if (key === 'marca') state.marcas.delete(v);
  else if (key === 'max') state.max = MAX_PRICE;
  else if (key === 'rating') state.rating = 0;
  else if (key === 'ofertas') state.ofertas = false;
  else if (key === 'nuevos') state.nuevos = false;
  syncControls();
  render();
});

$('#filter-toggle').addEventListener('click', (e) => {
  const open = filters.classList.toggle('open');
  e.currentTarget.setAttribute('aria-expanded', String(open));
});

enableArrowNav(grid, '.card-link');
bindAddActions($('#main'), { prodMap, catMap });
render();
