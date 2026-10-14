// theme.js — claro por defecto; el oscuro es una opción del usuario y se recuerda.
// (Cada HTML trae un script mínimo en <head> que aplica el tema guardado antes de pintar,
// para que no haya parpadeo.)
import { icon } from './icons.js';

const KEY = 'vokter-theme';
const root = document.documentElement;

export function getTheme() {
  try { return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light'; }
  catch { return 'light'; }
}

function apply(theme, button) {
  if (theme === 'dark') root.setAttribute('data-theme', 'dark');
  else root.removeAttribute('data-theme');

  if (button) {
    button.innerHTML = theme === 'dark' ? icon('sun') : icon('moon');
    button.setAttribute('aria-label', theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro');
    button.setAttribute('aria-pressed', String(theme === 'dark'));
  }
}

export function initTheme(button) {
  apply(getTheme(), button);
  if (!button) return;

  button.addEventListener('click', () => {
    const next = root.hasAttribute('data-theme') ? 'light' : 'dark';
    try { localStorage.setItem(KEY, next); } catch { /* sin almacenamiento */ }

    // Transición suave de color entre temas
    root.classList.add('theme-fade');
    apply(next, button);
    button.animate(
      [{ transform: 'rotate(-90deg) scale(.6)' }, { transform: 'rotate(0) scale(1)' }],
      { duration: 450, easing: 'cubic-bezier(.22,1,.36,1)' }
    );
    setTimeout(() => root.classList.remove('theme-fade'), 500);
  });
}