const fallbackProducts = [
  ['aud-01','Auriculares NOVA Pulse','audio',249000,319000,true,'Auriculares inalámbricos con cancelación de ruido activa y 30h de batería.'],
  ['aud-02','Parlante KREW Boom','audio',189000,0,false,'Parlante portátil resistente al agua IPX6, sonido 360°.'],
  ['cal-01','Tenis GRYT Runner','calzado',329000,0,false,'Suela de espuma reactiva, malla transpirable, edición urbana.'],
  ['cal-02','Botas URBN Trek','calzado',279000,349000,true,'Botas impermeables con suela antideslizante para ciudad.'],
  ['ropa-01','Chaqueta KREW Shell','apparel',219000,0,false,'Cortavientos técnico con bolsillos sellados y capucha ajustable.'],
  ['ropa-02','Hoodie NOVA Grid','apparel',139000,0,false,'Hoodie de algodón pesado con estampado reflectivo.'],
  ['gad-01','Power Bank VOLT 20K','gadgets',129000,159000,true,'20.000 mAh, carga rápida 65W, doble puerto USB-C.'],
  ['gad-02','Cable TRAX USB-C 2m','gadgets',39000,0,false,'Cable trenzado reforzado, carga rápida 100W.'],
  ['gad-03','Smartwatch PULSE X','gadgets',349000,0,false,'Monitor de ritmo cardíaco, GPS y batería de 7 días.'],
  ['hog-01','Lámpara LOOP LED','hogar',89000,0,false,'Lámpara de escritorio regulable con carga inalámbrica en la base.'],
  ['game-01','Control ARC Wireless','gaming',169000,199000,true,'Control inalámbrico multiplataforma con gatillos programables.'],
  ['game-02','Soporte GRID Console','gaming',59000,0,false,'Soporte vertical con ventilación para consolas de nueva generación.']
].map(item => ({ id:item[0], nombre:item[1], categoria:item[2], precio:item[3], precioAnterior:item[4], oferta:item[5], descripcion:item[6], icono:item[2], stock:12 }));

let products = [];
let cart = Number(localStorage.getItem('krew-cart') || 0);
let favorites = new Set(JSON.parse(localStorage.getItem('krew-favorites') || '[]'));
let activeCategory = 'todos';
let searchTerm = '';
const labels = { audio:'Audio', calzado:'Calzado', apparel:'Apparel', gadgets:'Gadgets', hogar:'Hogar', gaming:'Gaming' };
const accents = { audio:'#1976d2', calzado:'#3d6f9f', apparel:'#315d80', gadgets:'#147f9c', hogar:'#597590', gaming:'#2453a0' };
const grid = document.querySelector('#mobile-products');
const count = document.querySelector('#product-count');
const toast = document.querySelector('#toast');
const dialog = document.querySelector('#product-dialog');

function money(value) { return value.toLocaleString('es-CO', { style:'currency', currency:'COP', maximumFractionDigits:0 }); }
function notify(message) { toast.textContent = message; toast.classList.add('show'); clearTimeout(notify.timer); notify.timer = setTimeout(() => toast.classList.remove('show'), 1800); }
function saveCart() { localStorage.setItem('krew-cart', cart); document.querySelectorAll('#cart-count,#cart-count-bottom').forEach(item => item.textContent = cart); }
function visible() { return products.filter(item => (activeCategory === 'todos' || item.categoria === activeCategory) && (!searchTerm || `${item.nombre} ${item.descripcion}`.toLowerCase().includes(searchTerm.toLowerCase()))); }
function render() {
  const items = visible();
  count.textContent = `${items.length} ${items.length === 1 ? 'producto' : 'productos'}`;
  grid.innerHTML = items.length ? items.map(item => `<article class="mobile-product" data-id="${item.id}" style="--accent:${accents[item.categoria]}"><div class="product-visual">${item.oferta ? '<span class="tag">OFERTA</span>' : ''}<button class="favorite ${favorites.has(item.id) ? 'active' : ''}" data-favorite="${item.id}" aria-label="Favorito">${favorites.has(item.id) ? '♥' : '♡'}</button>${getIcon(item.icono)}</div><div class="mobile-product-body"><span class="product-category">${labels[item.categoria]}</span><h3>${item.nombre}</h3><span class="mobile-price">${money(item.precio)}</span>${item.oferta ? `<span class="mobile-old-price">${money(item.precioAnterior)}</span>` : ''}<button class="add-product" data-add="${item.id}" aria-label="Agregar al carrito">+</button></div></article>`).join('') : '<div class="loading-state">No encontramos productos con esa búsqueda.</div>';
  grid.querySelectorAll('[data-add]').forEach(button => button.addEventListener('click', event => { event.stopPropagation(); cart += 1; saveCart(); notify('Producto agregado al carrito'); }));
  grid.querySelectorAll('[data-favorite]').forEach(button => button.addEventListener('click', event => { event.stopPropagation(); const id = button.dataset.favorite; favorites.has(id) ? favorites.delete(id) : favorites.add(id); localStorage.setItem('krew-favorites', JSON.stringify([...favorites])); render(); notify(favorites.has(id) ? 'Guardado en favoritos' : 'Quitado de favoritos'); }));
  grid.querySelectorAll('.mobile-product').forEach(card => card.addEventListener('click', () => openProduct(card.dataset.id)));
}
function openProduct(id) { const item = products.find(product => product.id === id); if (!item) return; dialog.querySelector('#dialog-content').innerHTML = `<div class="dialog-visual" style="background:${accents[item.categoria]}16;color:${accents[item.categoria]}">${getIcon(item.icono)}</div><span class="dialog-inner-category">${labels[item.categoria]}</span><h2>${item.nombre}</h2><p>${item.descripcion}</p><span class="dialog-price">${money(item.precio)}</span><button class="dialog-add" id="dialog-add">Agregar al carrito</button>`; dialog.showModal(); dialog.querySelector('#dialog-add').onclick = () => { cart += 1; saveCart(); dialog.close(); notify('Producto agregado al carrito'); }; }
document.querySelectorAll('.category-chip').forEach(button => button.addEventListener('click', () => { document.querySelectorAll('.category-chip').forEach(item => item.classList.remove('active')); button.classList.add('active'); activeCategory = button.dataset.category; render(); }));
document.querySelector('#mobile-search').addEventListener('input', event => { searchTerm = event.target.value; document.querySelector('#clear-search').style.display = searchTerm ? 'block' : 'none'; render(); });
document.querySelector('#clear-search').addEventListener('click', () => { document.querySelector('#mobile-search').value = ''; searchTerm = ''; document.querySelector('#clear-search').style.display = 'none'; render(); });
document.querySelector('[data-scroll-products]').addEventListener('click', () => document.querySelector('.store-content').scrollIntoView({ behavior:'smooth' }));
document.querySelector('#filter-button').addEventListener('click', () => notify('Elige una categoría para filtrar'));
document.querySelectorAll('.cart-trigger').forEach(button => button.addEventListener('click', () => notify(cart ? `${cart} producto${cart === 1 ? '' : 's'} en tu carrito` : 'Tu carrito está vacío')));
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
document.querySelectorAll('[data-nav]').forEach(button => button.addEventListener('click', () => { document.querySelectorAll('[data-nav]').forEach(item => item.classList.remove('active')); button.classList.add('active'); if (button.dataset.nav === 'buscar') document.querySelector('#mobile-search').focus(); }));
fetchProducts().then(data => { products = data; render(); saveCart(); }).catch(() => { products = fallbackProducts; render(); saveCart(); });
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js'));
