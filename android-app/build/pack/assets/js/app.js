const CATEGORY_LABELS_MOBILE = { audio: 'Audio', calzado: 'Calzado', apparel: 'Apparel', gadgets: 'Gadgets', hogar: 'Hogar', gaming: 'Gaming' };
const ACCENTS = { audio: '#1976d2', calzado: '#3d6f9f', apparel: '#315d80', gadgets: '#147f9c', hogar: '#597590', gaming: '#2453a0' };
let products = [];
let cart = Number(localStorage.getItem('krew-cart') || 0);
let favorites = new Set(JSON.parse(localStorage.getItem('krew-favorites') || '[]'));
let activeCategory = 'todos';
let searchTerm = '';
const offlineProducts = [
  { id: 'aud-01', nombre: 'Auriculares NOVA Pulse', categoria: 'audio', precio: 249000, precioAnterior: 319000, oferta: true, descripcion: 'Auriculares inalámbricos con cancelación de ruido activa y 30h de batería.', stock: 14, icono: 'audio' },
  { id: 'aud-02', nombre: 'Parlante KREW Boom', categoria: 'audio', precio: 189000, oferta: false, descripcion: 'Parlante portátil resistente al agua IPX6, sonido 360°.', stock: 9, icono: 'audio' },
  { id: 'cal-01', nombre: 'Tenis GRYT Runner', categoria: 'calzado', precio: 329000, oferta: false, descripcion: 'Suela de espuma reactiva, malla transpirable, edición urbana.', stock: 22, icono: 'calzado' },
  { id: 'cal-02', nombre: 'Botas URBN Trek', categoria: 'calzado', precio: 279000, precioAnterior: 349000, oferta: true, descripcion: 'Botas impermeables con suela antideslizante para ciudad.', stock: 7, icono: 'calzado' },
  { id: 'ropa-01', nombre: 'Chaqueta KREW Shell', categoria: 'apparel', precio: 219000, oferta: false, descripcion: 'Cortavientos técnico con bolsillos sellados y capucha ajustable.', stock: 11, icono: 'apparel' },
  { id: 'ropa-02', nombre: 'Hoodie NOVA Grid', categoria: 'apparel', precio: 139000, oferta: false, descripcion: 'Hoodie de algodón pesado con estampado reflectivo.', stock: 30, icono: 'apparel' },
  { id: 'gad-01', nombre: 'Power Bank VOLT 20K', categoria: 'gadgets', precio: 129000, precioAnterior: 159000, oferta: true, descripcion: '20.000 mAh, carga rápida 65W, doble puerto USB-C.', stock: 18, icono: 'gadgets' },
  { id: 'gad-02', nombre: 'Cable TRAX USB-C 2m', categoria: 'gadgets', precio: 39000, oferta: false, descripcion: 'Cable trenzado reforzado, carga rápida 100W.', stock: 45, icono: 'gadgets' },
  { id: 'gad-03', nombre: 'Smartwatch PULSE X', categoria: 'gadgets', precio: 349000, oferta: false, descripcion: 'Monitor de ritmo cardíaco, GPS y batería de 7 días.', stock: 6, icono: 'gadgets' },
  { id: 'hog-01', nombre: 'Lámpara LOOP LED', categoria: 'hogar', precio: 89000, oferta: false, descripcion: 'Lámpara de escritorio regulable con carga inalámbrica en la base.', stock: 16, icono: 'hogar' },
  { id: 'game-01', nombre: 'Control ARC Wireless', categoria: 'gaming', precio: 169000, precioAnterior: 199000, oferta: true, descripcion: 'Control inalámbrico multiplataforma con gatillos programables.', stock: 13, icono: 'gaming' },
  { id: 'game-02', nombre: 'Soporte GRID Console', categoria: 'gaming', precio: 59000, oferta: false, descripcion: 'Soporte vertical con ventilación para consolas de nueva generación.', stock: 20, icono: 'gaming' }
];

const productGrid = document.querySelector('#mobile-products');
const count = document.querySelector('#product-count');
const toast = document.querySelector('#toast');
const dialog = document.querySelector('#product-dialog');

function updateCart() {
  document.querySelectorAll('#cart-count, #cart-count-bottom').forEach(item => item.textContent = cart);
  localStorage.setItem('krew-cart', cart);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => toast.classList.remove('show'), 1800);
}

function productCard(product) {
  const favorite = favorites.has(product.id);
  const price = formatPrice(product.precio);
  const oldPrice = product.oferta ? `<span class="mobile-old-price">${formatPrice(product.precioAnterior)}</span>` : '';
  return `<article class="mobile-product" data-id="${product.id}" style="--accent:${ACCENTS[product.categoria] || ACCENTS.gadgets}">
    <div class="product-visual">${product.oferta ? '<span class="tag">OFERTA</span>' : ''}<button class="favorite ${favorite ? 'active' : ''}" data-favorite="${product.id}" aria-label="${favorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}">${favorite ? '♥' : '♡'}</button>${getIcon(product.icono)}</div>
    <div class="mobile-product-body"><span class="product-category">${CATEGORY_LABELS_MOBILE[product.categoria]}</span><h3>${product.nombre}</h3><span class="mobile-price">${price}</span>${oldPrice}<button class="add-product" data-add="${product.id}" aria-label="Agregar ${product.nombre} al carrito">+</button></div>
  </article>`;
}

function visibleProducts() {
  return products.filter(product => {
    const categoryMatch = activeCategory === 'todos' || product.categoria === activeCategory;
    const searchMatch = !searchTerm || `${product.nombre} ${product.descripcion}`.toLowerCase().includes(searchTerm.toLowerCase());
    return categoryMatch && searchMatch;
  });
}

function renderProducts() {
  const visible = visibleProducts();
  count.textContent = `${visible.length} ${visible.length === 1 ? 'producto' : 'productos'}`;
  productGrid.innerHTML = visible.length ? visible.map(productCard).join('') : '<div class="loading-state">No encontramos productos con esa búsqueda.</div>';
  productGrid.querySelectorAll('[data-add]').forEach(button => button.addEventListener('click', event => { event.stopPropagation(); cart += 1; updateCart(); showToast('Producto agregado al carrito'); }));
  productGrid.querySelectorAll('[data-favorite]').forEach(button => button.addEventListener('click', event => { event.stopPropagation(); const id = button.dataset.favorite; favorites.has(id) ? favorites.delete(id) : favorites.add(id); localStorage.setItem('krew-favorites', JSON.stringify([...favorites])); renderProducts(); showToast(favorites.has(id) ? 'Guardado en favoritos' : 'Quitado de favoritos'); }));
  productGrid.querySelectorAll('.mobile-product').forEach(card => card.addEventListener('click', () => openProduct(card.dataset.id)));
}

function openProduct(id) {
  const product = products.find(item => item.id === id);
  if (!product) return;
  dialog.querySelector('#dialog-content').innerHTML = `<div class="dialog-visual" style="background:${ACCENTS[product.categoria]}16;color:${ACCENTS[product.categoria]}">${getIcon(product.icono)}</div><span class="dialog-inner-category">${CATEGORY_LABELS_MOBILE[product.categoria]}</span><h2>${product.nombre}</h2><p>${product.descripcion}</p><span class="dialog-price">${formatPrice(product.precio)}</span><button class="dialog-add" data-dialog-add="${product.id}">Agregar al carrito</button>`;
  dialog.showModal();
  dialog.querySelector('[data-dialog-add]').addEventListener('click', () => { cart += 1; updateCart(); dialog.close(); showToast('Producto agregado al carrito'); });
}

document.querySelectorAll('.category-chip').forEach(button => button.addEventListener('click', () => { document.querySelectorAll('.category-chip').forEach(item => item.classList.remove('active')); button.classList.add('active'); activeCategory = button.dataset.category; renderProducts(); }));
document.querySelector('#mobile-search').addEventListener('input', event => { searchTerm = event.target.value; document.querySelector('#clear-search').style.display = searchTerm ? 'block' : 'none'; renderProducts(); });
document.querySelector('#clear-search').addEventListener('click', () => { document.querySelector('#mobile-search').value = ''; searchTerm = ''; document.querySelector('#clear-search').style.display = 'none'; renderProducts(); });
document.querySelector('[data-scroll-products]').addEventListener('click', () => document.querySelector('.store-content').scrollIntoView({ behavior: 'smooth' }));
document.querySelector('#filter-button').addEventListener('click', () => showToast('Elige una categoría para filtrar'));
document.querySelectorAll('.cart-trigger').forEach(button => button.addEventListener('click', () => showToast(cart ? `${cart} producto${cart === 1 ? '' : 's'} en tu carrito` : 'Tu carrito está vacío')));
document.querySelector('#account-button').addEventListener('click', () => showToast('Cuenta KREW próximamente'));
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
document.querySelectorAll('[data-nav]').forEach(button => button.addEventListener('click', () => { document.querySelectorAll('[data-nav]').forEach(item => item.classList.remove('active')); button.classList.add('active'); if (button.dataset.nav === 'buscar') document.querySelector('#mobile-search').focus(); }));

fetchProducts().then(data => { products = data; renderProducts(); updateCart(); }).catch(() => { products = offlineProducts; renderProducts(); updateCart(); });
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js'));
