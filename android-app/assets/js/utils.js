// utils.js — helpers compartidos entre páginas
function formatPrice(valor) {
  return valor.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  });
}

async function fetchProducts() {
  const res = await fetch("data/products.json");
  if (!res.ok) throw new Error("No se pudo cargar el catálogo");
  return res.json();
}

const CATEGORY_LABELS = {
  audio: "Audio",
  calzado: "Calzado",
  apparel: "Apparel",
  gadgets: "Gadgets",
  hogar: "Hogar",
  gaming: "Gaming"
};

function productCardHTML(p) {
  const oferta = p.oferta
    ? `<span class="tag-oferta">Oferta</span>`
    : "";
  const precioAnterior = p.oferta
    ? `<span class="price-old">${formatPrice(p.precioAnterior)}</span>`
    : "";
  const stockBajo =
    p.stock <= 8 ? `<span class="stock-low">Quedan ${p.stock}</span>` : "";

  return `
    <a class="product-card" href="producto.html?id=${p.id}" style="--card-accent: var(--cat-${p.categoria})">
      <div class="product-thumb">
        ${oferta}
        ${getIcon(p.icono)}
      </div>
      <div class="product-body">
        <span class="product-cat">${CATEGORY_LABELS[p.categoria] || p.categoria}</span>
        <span class="product-name">${p.nombre}</span>
        <p class="product-desc">${p.descripcion}</p>
        <div class="product-price-row">
          <span class="price-now">${formatPrice(p.precio)}</span>
          ${precioAnterior}
        </div>
        ${stockBajo}
      </div>
    </a>`;
}
