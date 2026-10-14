// utils.js — helpers compartidos por todas las páginas

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const money = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
});
export const formatPrice = (n) => money.format(n);

export function html(strings, ...values) {
  const raw = strings.reduce((acc, s, i) => acc + s + (values[i] ?? ''), '');
  const tpl = document.createElement('template');
  tpl.innerHTML = raw.trim();
  return tpl.content.firstElementChild;
}

export function escapeHTML(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// Normaliza texto para buscar sin importar tildes ni mayúsculas
export const norm = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function param(name) {
  return new URLSearchParams(window.location.search).get(name);
}

export const reducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- Datos ---------------------------------------------------------------
let dataPromise;

export function loadData() {
  if (!dataPromise) {
    dataPromise = Promise.all([
      fetch('data/products.json').then((r) => r.json()),
      fetch('data/categories.json').then((r) => r.json()),
      fetch('data/bundles.json').then((r) => r.json())
    ]).then(([productos, categorias, bundles]) => {
      const catMap = Object.fromEntries(categorias.map((c) => [c.slug, c]));
      const prodMap = Object.fromEntries(productos.map((p) => [p.id, p]));
      return { productos, categorias, bundles, catMap, prodMap };
    });
  }
  return dataPromise;
}

export function discountPercent(p) {
  if (!p.precioAnterior) return 0;
  return Math.round((1 - p.precio / p.precioAnterior) * 100);
}

export function bundleTotals(bundle, prodMap) {
  const items = bundle.items.map((id) => prodMap[id]).filter(Boolean);
  const subtotal = items.reduce((sum, p) => sum + p.precio, 0);
  const total = Math.round((subtotal * (1 - bundle.descuento / 100)) / 1000) * 1000;
  return { items, subtotal, total };
}

// Paletas que el cliente puede elegir en la ficha de producto.
export const COLOR_VARIANTS = [
  { nombre: 'Azul VOKTER', c1: '#0A57F5', c2: '#7A4DFF' },
  { nombre: 'Naranja', c1: '#F5740A', c2: '#F5B50A' },
  { nombre: 'Verde', c1: '#0E9F8A', c2: '#38D39F' },
  { nombre: 'Rojo', c1: '#E5384F', c2: '#FF7A59' }
];

// Página actual → ítem de navegación activo
export function currentPage() {
  const file = window.location.pathname.split('/').pop() || 'index.html';
  return file;
}
