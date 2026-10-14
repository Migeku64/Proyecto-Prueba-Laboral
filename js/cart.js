// cart.js — estado del carrito (productos sueltos y bundles), guardado en localStorage.

export const FREE_SHIPPING_FROM = 50000; // "Envío gratis desde $50.000" (como en VOKTER)
export const SHIPPING_FEE = 9900;

const KEY = 'vokter-cart-v1';
const listeners = new Set();
let items = read();

function read() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; }
  catch { return []; }
}

function commit() {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* sin almacenamiento */ }
  listeners.forEach((fn) => fn(items));
}

export const cart = {
  get items() { return items; },

  subscribe(fn) {
    listeners.add(fn);
    fn(items);
    return () => listeners.delete(fn);
  },

  // item: { id, nombre, precio, arte, c1, c2, variante?, detalle? }
  add(item, qty = 1) {
    const key = item.variante ? `${item.id}::${item.variante}` : item.id;
    const found = items.find((i) => i.key === key);
    if (found) found.qty += qty;
    else items = [...items, { ...item, key, qty }];
    commit();
  },

  setQty(key, qty) {
    if (qty <= 0) return this.remove(key);
    items = items.map((i) => (i.key === key ? { ...i, qty } : i));
    commit();
  },

  remove(key) {
    items = items.filter((i) => i.key !== key);
    commit();
  },

  clear() {
    items = [];
    commit();
  },

  count() { return items.reduce((n, i) => n + i.qty, 0); },
  subtotal() { return items.reduce((sum, i) => sum + i.precio * i.qty, 0); },

  shipping() {
    const sub = this.subtotal();
    if (sub === 0) return 0;
    return sub >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE;
  },

  total() { return this.subtotal() + this.shipping(); }
};
