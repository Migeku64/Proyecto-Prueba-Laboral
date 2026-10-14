// ayuda.js — centro de ayuda: pestañas (#faq, #envios, #devoluciones, #terminos) + acordeón
import { $, $$, escapeHTML, formatPrice } from './utils.js';
import { initLayout } from './layout.js';
import { icon } from './icons.js';
import { FREE_SHIPPING_FROM, SHIPPING_FEE } from './cart.js';
import { bindIndicator } from './ui.js';

await initLayout();

// Textos de demostración para la propuesta; reemplazar por las políticas reales de la tienda.
const TOPICS = [
  {
    key: 'faq', label: 'Preguntas frecuentes',
    items: [
      ['¿Cuánto tarda en llegar mi pedido?', 'Despachamos en 24-48 horas. El tiempo exacto de entrega depende de tu ciudad y se confirma al hacer el pedido.'],
      ['¿Desde qué valor el envío es gratis?', `El envío es gratis desde ${formatPrice(FREE_SHIPPING_FROM)}. Debajo de ese valor se cobra una tarifa fija de ${formatPrice(SHIPPING_FEE)}.`],
      ['¿Mi compra está protegida?', 'Sí. Toda compra en VOKTER está protegida y los productos cuentan con garantía de calidad.'],
      ['¿Puedo combinar productos con descuento?', 'Los bundles ya incluyen su descuento (Running 15%, Tech 20% y Home 10%). Los agregas al carrito con un solo clic.'],
      ['¿Hay app móvil?', 'Sí, tenemos app para Android. Descárgala desde la página “App móvil” con el botón o el código QR.']
    ]
  },
  {
    key: 'envios', label: 'Envíos',
    items: [
      ['Tiempos de entrega', 'Preparamos y despachamos tu pedido en 24-48 horas. Recibirás los datos de seguimiento por mensaje.'],
      ['Costo del envío', `Gratis desde ${formatPrice(FREE_SHIPPING_FROM)}. Por debajo de ese valor, la tarifa es de ${formatPrice(SHIPPING_FEE)} y la ves en el carrito antes de pagar.`],
      ['Cobertura', 'Enviamos a las principales ciudades del país. Si tu ciudad no aparece, escríbenos y lo revisamos.']
    ]
  },
  {
    key: 'devoluciones', label: 'Devoluciones',
    items: [
      ['¿Cómo pido un cambio o devolución?', 'Escríbenos desde la página de contacto con tu número de pedido y cuéntanos qué pasó. Te indicamos los pasos.'],
      ['Productos con defecto', 'Si algo llega con defecto de fábrica, lo cambiamos. Nuestra promesa es calidad premium 100% garantizada.'],
      ['Estado del producto', 'Para cambios por talla o preferencia, el producto debe estar sin uso y en su empaque original.']
    ]
  },
  {
    key: 'terminos', label: 'Privacidad y términos',
    items: [
      ['Privacidad', 'Usamos tus datos únicamente para gestionar pedidos y, si te suscribes, enviarte novedades. No los compartimos con terceros ajenos al envío.'],
      ['Términos de uso', 'Al comprar en VOKTER aceptas las condiciones de venta, envío y garantía descritas en este centro de ayuda.']
    ]
  }
];

const tabsEl = $('#help-tabs');
const panel = $('#help-panel');

tabsEl.innerHTML = TOPICS.map((t) =>
  `<button type="button" class="tab" role="tab" aria-selected="false" data-key="${t.key}">${escapeHTML(t.label)}</button>`
).join('');
const indicator = bindIndicator(tabsEl, '.tab');

function show(key, { updateHash = true } = {}) {
  const topic = TOPICS.find((t) => t.key === key) || TOPICS[0];
  $$('.tab', tabsEl).forEach((t) => {
    const on = t.dataset.key === topic.key;
    t.classList.toggle('active', on);
    t.setAttribute('aria-selected', String(on));
  });
  indicator.sync();

  panel.innerHTML = topic.items.map(([q, a], i) => `
    <div class="acc-item${i === 0 ? ' open' : ''}" style="animation: rise .5s var(--ease) backwards; animation-delay:${i * 60}ms">
      <button type="button" class="acc-q" aria-expanded="${i === 0}">${escapeHTML(q)}${icon('down', 20)}</button>
      <div class="acc-a"><div><p>${escapeHTML(a)}</p></div></div>
    </div>`).join('');

  if (updateHash) history.replaceState(null, '', `#${topic.key}`);
}

tabsEl.addEventListener('click', (e) => {
  const tab = e.target.closest('.tab');
  if (tab) show(tab.dataset.key);
});

panel.addEventListener('click', (e) => {
  const q = e.target.closest('.acc-q');
  if (!q) return;
  const item = q.closest('.acc-item');
  const open = item.classList.toggle('open');
  q.setAttribute('aria-expanded', String(open));
});

window.addEventListener('hashchange', () => show(location.hash.slice(1), { updateHash: false }));
show(location.hash.slice(1), { updateHash: false });
