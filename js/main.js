// main.js — renderiza los destacados de la página de inicio
(async function () {
  const grid = document.querySelector("#featured-grid");
  if (!grid) return;

  const tabs = document.querySelectorAll(".cat-tab");
  let productos = [];

  try {
    productos = await fetchProducts();
  } catch (err) {
    grid.innerHTML = `<div class="empty-state">No se pudo cargar el catálogo. Verifica que estés abriendo el sitio desde un servidor local.</div>`;
    return;
  }

  function render(categoria) {
    const filtrados =
      categoria === "todos"
        ? productos
        : productos.filter((p) => p.categoria === categoria);

    grid.innerHTML = filtrados
      .slice(0, 8)
      .map(productCardHTML)
      .join("");
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      render(tab.dataset.cat);
    });
  });

  render("todos");
})();
