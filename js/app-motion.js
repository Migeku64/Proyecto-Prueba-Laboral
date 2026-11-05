(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealItems = document.querySelectorAll('.reveal-on-scroll');
  const iconItems = document.querySelectorAll('[data-category-icon]');
  const navItems = document.querySelectorAll('.app-nav-link, .store-nav-item');

  iconItems.forEach((item) => { item.innerHTML = window.getIcon(item.dataset.categoryIcon); });

  const themeButton = document.querySelector('[data-theme-toggle]');
  const applyTheme = (theme) => {
    if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
    if (themeButton) themeButton.setAttribute('aria-pressed', String(theme === 'dark'));
    if (themeButton) themeButton.innerHTML = theme === 'dark' ? '&#9788;' : '&#9790;';
  };
  let savedTheme = 'light';
  try { savedTheme = localStorage.getItem('vokter-theme') === 'dark' ? 'dark' : 'light'; } catch (error) { /* almacenamiento opcional */ }
  applyTheme(savedTheme);
  themeButton?.addEventListener('click', () => {
    const nextTheme = document.documentElement.hasAttribute('data-theme') ? 'light' : 'dark';
    try { localStorage.setItem('vokter-theme', nextTheme); } catch (error) { /* almacenamiento opcional */ }
    applyTheme(nextTheme);
  });

  if (reduceMotion) revealItems.forEach((item) => item.classList.add('is-visible'));
  else {
    const observer = new IntersectionObserver((entries, current) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); current.unobserve(entry.target); }
      });
    }, { threshold: .12 });
    revealItems.forEach((item) => observer.observe(item));
  }

  const header = document.querySelector('#app-header');
  const syncHeader = () => header && header.classList.toggle('is-scrolled', window.scrollY > 12);
  window.addEventListener('scroll', syncHeader, { passive: true });
  syncHeader();

  document.querySelectorAll('.hero-drop').forEach((drop, index, all) => {
    drop.addEventListener('click', () => {
      all.forEach((item) => item.classList.remove('active'));
      drop.classList.add('active');
      drop.animate([{ transform: 'translateY(4px)' }, { transform: 'translateY(-5px)' }, { transform: 'translateY(0)' }], { duration: 460, easing: 'cubic-bezier(.22,1,.36,1)' });
    });
    if (!reduceMotion) drop.style.animationDelay = (index * 80) + 'ms';
  });

  const productGrid = document.querySelector('#mobile-products');
  productGrid?.addEventListener('click', (event) => {
    const card = event.target.closest('.mobile-product');
    if (card && !reduceMotion) card.animate([{ transform: 'scale(1)' }, { transform: 'scale(.985)' }, { transform: 'scale(1)' }], { duration: 260, easing: 'ease-out' });
  });
})();
