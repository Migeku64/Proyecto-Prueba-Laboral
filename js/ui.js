// ui.js — micro-interacciones reutilizables (responden a acciones del usuario)
import { $, $$, reducedMotion } from './utils.js';
import { icon } from './icons.js';

// ---- Toast -----------------------------------------------------------------
export function toast(message, tone = 'ok') {
  let host = $('#toasts');
  if (!host) {
    host = document.createElement('div');
    host.id = 'toasts';
    host.setAttribute('role', 'status');
    host.setAttribute('aria-live', 'polite');
    document.body.append(host);
  }
  const node = document.createElement('div');
  node.className = `toast toast-${tone}`;
  node.innerHTML = `${icon(tone === 'ok' ? 'check' : 'close', 18)}<span></span>`;
  node.querySelector('span').textContent = message;
  host.append(node);
  requestAnimationFrame(() => node.classList.add('in'));
  setTimeout(() => {
    node.classList.remove('in');
    setTimeout(() => node.remove(), 400);
  }, 2800);
}

// ---- Indicador deslizante (pestañas y navegación) --------------------------
// Un único elemento .ind se desplaza y cambia de ancho hasta el ítem activo,
// o hasta el que tenga el cursor/foco si hover = true.
export function bindIndicator(container, itemSelector, { hover = false } = {}) {
  if (!container) return { sync() {} };

  let ind = container.querySelector(':scope > .ind');
  if (!ind) {
    ind = document.createElement('span');
    ind.className = 'ind';
    ind.setAttribute('aria-hidden', 'true');
    container.prepend(ind);
  }

  const place = (el) => {
    if (!el) { ind.style.opacity = '0'; return; }
    ind.style.opacity = '1';
    ind.style.width = `${el.offsetWidth}px`;
    ind.style.height = `${el.offsetHeight}px`;
    ind.style.transform = `translate(${el.offsetLeft}px, ${el.offsetTop}px)`;
  };

  const active = () =>
    container.querySelector(
      `${itemSelector}.active, ${itemSelector}[aria-current="page"], ${itemSelector}[aria-selected="true"]`
    );

  const sync = () => place(active());

  const syncInstant = () => {
    ind.style.transition = 'none';
    sync();
    requestAnimationFrame(() => requestAnimationFrame(() => { ind.style.transition = ''; }));
  };

  if (hover) {
    container.addEventListener('mouseover', (e) => {
      const target = e.target.closest(itemSelector);
      if (target && container.contains(target)) place(target);
    });
    container.addEventListener('mouseleave', sync);
    container.addEventListener('focusin', (e) => {
      const target = e.target.closest(itemSelector);
      if (target) place(target);
    });
    container.addEventListener('focusout', sync);
  }

  syncInstant();
  if (document.fonts?.ready) document.fonts.ready.then(syncInstant);
  if ('ResizeObserver' in window) new ResizeObserver(syncInstant).observe(container);
  else window.addEventListener('resize', syncInstant);

  return { sync };
}

// ---- Navegación con flechas del teclado, como en una consola ---------------
export function enableArrowNav(container, itemSelector) {
  if (!container) return;
  container.addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    const items = $$(itemSelector, container).filter((el) => el.offsetParent !== null);
    const current = items.find((el) => el === document.activeElement);
    if (!current) return;

    const cr = current.getBoundingClientRect();
    const cx = cr.left + cr.width / 2;
    const cy = cr.top + cr.height / 2;
    let best = null;
    let bestScore = Infinity;

    for (const el of items) {
      if (el === current) continue;
      const r = el.getBoundingClientRect();
      const dx = r.left + r.width / 2 - cx;
      const dy = r.top + r.height / 2 - cy;
      let ok;
      let score;
      if (e.key === 'ArrowRight') { ok = dx > 8; score = Math.abs(dy) * 3 + dx; }
      else if (e.key === 'ArrowLeft') { ok = dx < -8; score = Math.abs(dy) * 3 - dx; }
      else if (e.key === 'ArrowDown') { ok = dy > 8; score = Math.abs(dx) * 3 + dy; }
      else { ok = dy < -8; score = Math.abs(dx) * 3 - dy; }
      if (ok && score < bestScore) { best = el; bestScore = score; }
    }

    if (best) {
      e.preventDefault();
      best.focus();
      best.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
        behavior: reducedMotion() ? 'auto' : 'smooth'
      });
    }
  });
}

// ---- El producto "vuela" hasta el carrito ----------------------------------
export function bumpCart() {
  const btn = $('#cart-btn');
  if (!btn || reducedMotion()) return;
  btn.animate(
    [{ transform: 'scale(1)' }, { transform: 'scale(1.28)' }, { transform: 'scale(1)' }],
    { duration: 380, easing: 'ease-out' }
  );
}

export function flyToCart(fromEl, c1 = '#0A57F5', c2 = '#7A4DFF') {
  const target = $('#cart-btn');
  if (!fromEl || !target || reducedMotion()) { bumpCart(); return; }

  const a = fromEl.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const dot = document.createElement('div');
  dot.className = 'fly-dot';
  dot.style.left = `${a.left + a.width / 2 - 22}px`;
  dot.style.top = `${a.top + a.height / 2 - 22}px`;
  dot.style.background = `linear-gradient(135deg, ${c1}, ${c2})`;
  document.body.append(dot);

  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const anim = dot.animate(
    [
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.55}px, ${dy * 0.55 - 70}px) scale(.9)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${dx}px, ${dy}px) scale(.25)`, opacity: 0.35 }
    ],
    { duration: 720, easing: 'cubic-bezier(.5,0,.3,1)' }
  );
  anim.onfinish = () => { dot.remove(); bumpCart(); };
}
