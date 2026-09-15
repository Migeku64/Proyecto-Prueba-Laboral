// catalogo.js — buscador en vivo + filtros por categoría/precio + orden
(async function () {
  const grid = document.querySelector("#catalog-grid");
  if (!grid) return;

  const searchInput = document.querySelector("#search-input");
  const sortSelect = document.querySelector("#sort-select");
  const resultCount = document.querySelector("#result-count");
  const clearBtn = document.querySelector("#clear-filters");
  const priceMin = document.querySelector("#price-min");
  const priceMax = document.querySelector("#price-max");
  const categoryChecks = document.querySelectorAll(".cat-check");
  const offerCheck = document.querySelector("#offer-check");

  let productos = [];

  try {
    productos = await fetchProducts();
  } catch (err) {
    grid.innerHTML = `<div class="empty-state">No se pudo cargar el catálogo. Verifica que estés abriendo el sitio desde un servidor local (no directamente el archivo .html).</div>`;
    return;
  }

  // Si la URL trae ?categoria=xxx (desde la home), preseleccionamos ese filtro.
  const params = new URLSearchParams(window.location.search);
  const categoriaInicial = params.get("categoria");
  if (categoriaInicial) {
    categoryChecks.forEach((c) => {
      c.checked = c.value === categoriaInicial;
    });
  }

  function getActiveCategories() {
    const checked = Array.from(categoryChecks)
      .filter((c) => c.checked)
      .map((c) => c.value);
    return checked.length ? checked : null; // null = todas
  }

  function applyFilters() {
    const term = searchInput.value.trim().toLowerCase();
    const categorias = getActiveCategories();
    const min = priceMin.value ? Number(priceMin.value) : 0;
    const max = priceMax.value ? Number(priceMax.value) : Infinity;
    const soloOfertas = offerCheck.checked;

    let resultado = productos.filter((p) => {
      const coincideTexto =
        !term ||
        p.nombre.toLowerCase().includes(term) ||
        p.descripcion.toLowerCase().includes(term);
      const coincideCategoria = !categorias || categorias.includes(p.categoria);
      const coincidePrecio = p.precio >= min && p.precio <= max;
      const coincideOferta = !soloOfertas || p.oferta;
      return coincideTexto && coincideCategoria && coincidePrecio && coincideOferta;
    });

    const orden = sortSelect.value;
    if (orden === "precio-asc") resultado.sort((a, b) => a.precio - b.precio);
    if (orden === "precio-desc") resultado.sort((a, b) => b.precio - a.precio);
    if (orden === "nombre") resultado.sort((a, b) => a.nombre.localeCompare(b.nombre));

    renderResultados(resultado);
  }

  function renderResultados(lista) {
    resultCount.textContent = `${lista.length} producto${lista.length === 1 ? "" : "s"} encontrado${lista.length === 1 ? "" : "s"}`;
    grid.innerHTML = lista.length
      ? lista.map(productCardHTML).join("")
      : `<div class="empty-state">No encontramos productos con esos filtros. Prueba ajustando el precio o quitando alguna categoría.</div>`;
  }

  // Buscador en vivo (sin esperar submit)
  searchInput.addEventListener("input", applyFilters);
  sortSelect.addEventListener("change", applyFilters);
  priceMin.addEventListener("input", applyFilters);
  priceMax.addEventListener("input", applyFilters);
  offerCheck.addEventListener("change", applyFilters);
  categoryChecks.forEach((c) => c.addEventListener("change", applyFilters));

  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    priceMin.value = "";
    priceMax.value = "";
    offerCheck.checked = false;
    categoryChecks.forEach((c) => (c.checked = false));
    sortSelect.value = "relevancia";
    applyFilters();
  });

  applyFilters();
})();
