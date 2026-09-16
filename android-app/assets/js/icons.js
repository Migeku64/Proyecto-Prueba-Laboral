// icons.js — íconos SVG inline por categoría (evita depender de imágenes externas)
const ICONS = {
  audio: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 14v-3a8 8 0 0 1 16 0v3"/><rect x="2.5" y="14" width="5" height="7" rx="1.5"/><rect x="16.5" y="14" width="5" height="7" rx="1.5"/></svg>`,
  calzado: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 17c0-2 2-3 4-4l5-3c1.5-1 2-2.5 4-2.5 1.2 0 2 1 2 2v2.5c2 .3 3.5 1.5 3.5 3.5v2H3z"/><path d="M3 17h18"/></svg>`,
  apparel: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 4 4 7l2 3 2-1.4V20h8V8.6L18 10l2-3-4-3-2 1.5h-4z"/></svg>`,
  gadgets: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="6" y="3" width="12" height="18" rx="2"/><path d="M10 18h4"/></svg>`,
  hogar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/></svg>`,
  gaming: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="8" width="20" height="9" rx="4"/><path d="M7 11v4M5 13h4"/><circle cx="16" cy="11.5" r="1"/><circle cx="18.5" cy="14" r="1"/></svg>`
};

function getIcon(categoria) {
  return ICONS[categoria] || ICONS.gadgets;
}
