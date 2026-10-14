(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const views = ['inicio', 'tienda', 'categorias', 'bundles', 'ayuda'];
  const sections = {
    inicio: ['.store-hero', '.benefits-row'],
    tienda: ['.featured-section'],
    categorias: ['.category-section'],
    bundles: ['.bundles-module'],
    ayuda: ['.help-module']
  };

  function setView(view) {
    const next = views.includes(view) ? view : 'inicio';
    document.body.classList.remove(...views.map(item => `app-view-${item}`));
    document.body.classList.add(`app-view-${next}`);
    document.querySelectorAll('.app-nav-link, .store-nav-item').forEach(button => {
      const buttonView = button.dataset.nav === 'buscar' || button.dataset.nav === 'favoritos' ? 'tienda' : button.dataset.nav;
      button.classList.toggle('active', buttonView === next);
    });
    document.querySelectorAll('.app-module').forEach(section => section.classList.remove('module-enter'));
    sections[next].forEach(selector => document.querySelectorAll(selector).forEach(section => {
      section.classList.add('app-module');
      requestAnimationFrame(() => section.classList.add('module-enter'));
    }));
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  document.querySelectorAll('[data-nav]:not([data-nav="carrito"])').forEach(button => button.addEventListener('click', () => {
    const view = button.dataset.nav === 'buscar' || button.dataset.nav === 'favoritos' ? 'tienda' : button.dataset.nav;
    setView(view);
    if (button.dataset.nav === 'buscar') document.querySelector('#mobile-search')?.focus();
  }));

  document.querySelector('[data-scroll-products]')?.addEventListener('click', () => setView('tienda'));
  document.querySelector('.hero-ghost')?.addEventListener('click', () => {
    document.querySelector('[data-category="calzado"]')?.click();
    setView('tienda');
  });

  document.querySelectorAll('[data-bundle-action]').forEach(button => button.addEventListener('click', () => {
    const bundles = {
      running: { name: 'Bundle Running', ids: ['sneaker-runner-x', 'balaca-pro-air', 'powerbank-10k'] },
      tech: { name: 'Bundle Tech', ids: ['p9-tipo-apple', 'cargador-pared-20w', 'cable-usbc-trenzado'] },
      home: { name: 'Bundle Home', ids: ['sabanas-star-home', 'protector-colchon', 'soporte-escritorio'] }
    };
    const bundle = bundles[button.dataset.bundleAction];
    window.dispatchEvent(new CustomEvent('vokter:add-bundle', { detail: bundle.ids }));
    const toast = document.querySelector('#toast');
    toast.textContent = `${bundle.name} agregado al carrito`;
    toast.classList.add('show');
    clearTimeout(window.vokterToastTimer);
    window.vokterToastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
    if (!reduceMotion) button.animate([{ transform: 'scale(1)' }, { transform: 'scale(.94)' }, { transform: 'scale(1)' }], { duration: 360, easing: 'cubic-bezier(.22,1,.36,1)' });
  }));

  setView('inicio');
})();
