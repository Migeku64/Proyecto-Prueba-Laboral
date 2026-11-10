// ayuda.js — centro de ayuda: pestañas (#faq, #envios, #devoluciones, #terminos) + acordeón
import { $, $$, escapeHTML, formatPrice } from './utils.js';
import { initLayout } from './layout.js';
import { icon } from './icons.js';
import { FREE_SHIPPING_FROM, SHIPPING_FEE } from './cart.js';
import { bindIndicator } from './ui.js';
import { CONFIG } from './config.js';

const E = CONFIG.empresa;

await initLayout();

// Textos base según la Ley 1480 de 2011 (Estatuto del Consumidor) y la Ley 1581 de 2012.
// ⚠️ Plantilla: el negocio debe revisarlos con su asesor legal y completar sus datos en js/config.js.
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
      ['Estado del producto', 'Para cambios por talla o preferencia, el producto debe estar sin uso y en su empaque original.'],
      ['Derecho de retracto (5 días hábiles)', `Por ser una compra a distancia, puedes retractarte dentro de los 5 días hábiles siguientes a la entrega (art. 47, Ley 1480 de 2011). Escríbenos a ${E.correo} con tu número de pedido. Devuelves el producto en el mismo estado en que lo recibiste y los costos de transporte de la devolución corren por tu cuenta. Te reintegramos el dinero dentro de los 30 días calendario siguientes. No aplica a productos perecederos, de uso personal ni bienes hechos a la medida.`],
      ['Reversión del pago', `Si pagaste con tarjeta, PSE u otro medio electrónico, puedes pedir la reversión del pago dentro de los 5 días hábiles siguientes a conocer el problema cuando: fuiste víctima de fraude, la operación no fue solicitada, el producto no se recibió o no corresponde a lo pedido o está defectuoso (art. 51, Ley 1480 de 2011 y Decreto 587 de 2016). Presenta la queja a ${E.correo} y al emisor del medio de pago, y devuelve el producto si lo recibiste.`],
      ['Garantía legal', 'Todos los productos tienen la garantía legal que exige la ley colombiana: calidad, idoneidad y seguridad. Si un producto falla, lo reparamos, cambiamos o te devolvemos el dinero según el caso.']
    ]
  },
  {
    key: 'pagos', label: 'Medios de pago',
    items: [
      ['¿Cómo puedo pagar?', 'Con tarjeta de crédito o débito (Visa, Mastercard, American Express y Diners), PSE desde cualquier banco, Nequi, Botón Bancolombia o en efectivo en Efecty y corresponsales bancarios con un código de pago.'],
      ['¿Puedo pagar a cuotas?', 'Sí. Con tarjeta de crédito eliges de 1 a 36 cuotas al pagar. Los intereses dependen de tu banco.'],
      ['¿Es seguro pagar aquí?', `Sí. El pago lo procesa una pasarela certificada PCI DSS. ${E.nombreComercial} nunca ve ni guarda el número completo de tu tarjeta ni su código de seguridad: solo recibimos la confirmación del pago y los últimos 4 dígitos.`],
      ['¿Qué pasa si pago en efectivo?', 'Recibes un código de pago con fecha límite. Tu pedido se confirma y se despacha cuando el pago llega, normalmente el mismo día hábil.'],
      ['Mi pago fue rechazado', 'Puedes intentarlo con otro medio de pago desde el mismo pedido, o más tarde desde "Mi cuenta" con el botón "Pagar ahora". No se hace ningún cobro por un pago rechazado.'],
      ['Factura electrónica', 'Emitimos factura electrónica según la DIAN. Al pagar eliges si va a tu nombre o al de una empresa (NIT). Llega al correo después de confirmar el pago.'],
      ['Precios e IVA', `Todos los precios están en pesos colombianos (COP) e incluyen IVA (${CONFIG.ivaPorcentaje}%). Antes de pagar ves el valor del envío y el total.`]
    ]
  },
  {
    key: 'terminos', label: 'Privacidad y términos',
    items: [
      ['Privacidad', 'Usamos tus datos únicamente para gestionar pedidos y, si te suscribes, enviarte novedades. No los compartimos con terceros ajenos al envío.'],
      ['Términos de uso', `Al comprar en ${E.nombreComercial} aceptas las condiciones de venta, envío y garantía descritas en este centro de ayuda.`],
      ['Tratamiento de datos personales', `Tratamos tus datos según la Ley 1581 de 2012 para gestionar tu cuenta, pedidos, pagos y facturación. Puedes conocer, actualizar, rectificar o pedir la supresión de tus datos escribiendo a ${E.correo}.`],
      ['Información del vendedor', `${E.razonSocial} · NIT ${E.nit} · ${E.direccion}, ${E.ciudad} · Teléfono ${E.telefono} · ${E.correo} · ${E.horario}.`],
      ['Protección al consumidor', 'Si tienes una queja que no hayamos resuelto, puedes acudir a la Superintendencia de Industria y Comercio (www.sic.gov.co).']
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
