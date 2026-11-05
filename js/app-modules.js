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

  // El carrito es una accion global, no una vista; ambos accesos abren el mismo dialogo.
  document.querySelectorAll('.cart-trigger').forEach(button => {
    button.onclick = event => {
      event.preventDefault();
      event.stopPropagation();
      window.dispatchEvent(new CustomEvent('vokter:cart-open'));
    };
  });

  document.querySelector('[data-scroll-products]')?.addEventListener('click', () => setView('tienda'));
  document.querySelectorAll('.hero-drop').forEach((drop, index) => {
    if (drop.matches('a')) return;
    drop.setAttribute('role', 'button');
    drop.setAttribute('tabindex', '0');
    const activate = () => {
      if (index === 0) setView('inicio');
      if (index === 1) {
        document.querySelector('.category-scroll [data-category="audio"]')?.click();
        setView('tienda');
      }
      if (index === 2) setView('bundles');
    };
    drop.addEventListener('click', activate);
    drop.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        activate();
      }
    });
  });
  document.querySelectorAll('.category-tile[data-category]').forEach(tile => tile.addEventListener('click', () => {
    document.querySelector(`.category-scroll [data-category="${tile.dataset.category}"]`)?.click();
    setView('tienda');
  }));

  const bundlePrices = {
    running: ['$421.000', '$358.000', '$63.000'],
    tech: ['$157.000', '$126.000', '$31.000'],
    home: ['$247.000', '$222.000', '$25.000']
  };
  document.querySelectorAll('[data-bundle-action]').forEach(button => {
    const values = bundlePrices[button.dataset.bundleAction];
    const currentPrice = button.parentElement?.querySelector(':scope > strong');
    if (values && currentPrice) {
      currentPrice.outerHTML = `<div class="bundle-pricing"><span>Sin descuento</span><del>${values[0]}</del><strong>${values[1]}</strong><small>Ahorras ${values[2]}</small></div>`;
    }
  });

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
