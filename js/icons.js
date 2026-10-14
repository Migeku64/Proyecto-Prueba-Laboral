// icons.js — ilustraciones de producto (blancas, se asientan sobre fondos de color)
// y los íconos de interfaz. Todo es SVG inline: no hay imágenes externas que cargar.

const W = '#fff';
const SH = 'rgba(0,0,0,.22)';
const SH2 = 'rgba(0,0,0,.14)';

const ART = {
  headphones: `
    <path d="M44 118V102a56 56 0 0 1 112 0v16" fill="none" stroke="${W}" stroke-width="11" stroke-linecap="round"/>
    <rect x="28" y="108" width="38" height="64" rx="16" fill="${W}"/>
    <rect x="134" y="108" width="38" height="64" rx="16" fill="${W}"/>
    <rect x="37" y="122" width="20" height="36" rx="9" fill="${SH}"/>
    <rect x="143" y="122" width="20" height="36" rx="9" fill="${SH}"/>
    <path d="M62 40a56 56 0 0 1 40-14" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="4" stroke-linecap="round"/>`,

  earbuds: `
    <rect x="46" y="104" width="108" height="72" rx="30" fill="${W}"/>
    <path d="M46 132h108" stroke="${SH2}" stroke-width="4"/>
    <circle cx="100" cy="132" r="6" fill="${SH}"/>
    <ellipse cx="74" cy="64" rx="17" ry="22" fill="${W}"/>
    <rect x="83" y="64" width="10" height="38" rx="5" fill="${W}"/>
    <ellipse cx="126" cy="64" rx="17" ry="22" fill="${W}" opacity=".8"/>
    <rect x="107" y="64" width="10" height="38" rx="5" fill="${W}" opacity=".8"/>
    <ellipse cx="70" cy="58" rx="6" ry="9" fill="rgba(255,255,255,.55)"/>`,

  cable: `
    <path d="M52 150C52 92 148 128 148 60" fill="none" stroke="${W}" stroke-width="10" stroke-linecap="round"/>
    <rect x="38" y="146" width="28" height="32" rx="7" fill="${W}"/>
    <rect x="44" y="134" width="16" height="16" rx="3" fill="${W}" opacity=".7"/>
    <rect x="134" y="24" width="28" height="32" rx="7" fill="${W}"/>
    <rect x="140" y="14" width="16" height="14" rx="3" fill="${W}" opacity=".7"/>
    <path d="M52 150C52 92 148 128 148 60" fill="none" stroke="${SH2}" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round"/>`,

  charger: `
    <rect x="58" y="58" width="84" height="94" rx="18" fill="${W}"/>
    <rect x="80" y="30" width="9" height="32" rx="3" fill="${W}" opacity=".85"/>
    <rect x="111" y="30" width="9" height="32" rx="3" fill="${W}" opacity=".85"/>
    <rect x="82" y="120" width="36" height="11" rx="5.500" fill="${SH}"/>
    <path d="M104 78 90 102h11l-5 20 17-26h-11z" fill="${SH2}"/>`,

  powerbank: `
    <rect x="60" y="26" width="80" height="148" rx="22" fill="${W}"/>
    <rect x="76" y="46" width="12" height="9" rx="3" fill="${SH}"/>
    <rect x="94" y="46" width="12" height="9" rx="3" fill="${SH}"/>
    <rect x="112" y="46" width="12" height="9" rx="3" fill="${SH2}"/>
    <path d="M106 82 86 118h15l-7 32 26-42h-15z" fill="${SH}"/>
    <rect x="88" y="160" width="24" height="6" rx="3" fill="${SH2}"/>`,

  holder: `
    <g transform="rotate(-10 100 92)">
      <rect x="62" y="22" width="76" height="124" rx="16" fill="${W}"/>
      <rect x="70" y="34" width="60" height="96" rx="7" fill="${SH}"/>
      <circle cx="100" cy="140" r="3.500" fill="${SH2}"/>
    </g>
    <path d="M100 150v18" stroke="${W}" stroke-width="10" stroke-linecap="round"/>
    <path d="M58 176h84" stroke="${W}" stroke-width="12" stroke-linecap="round"/>`,

  sneaker: `
    <path d="M22 136c0-17 12-24 26-28l26-46c5-8 15-10 22-4l14 14c7 6 17 8 28 14 24 12 40 22 40 40v10H22z" fill="${W}"/>
    <rect x="18" y="138" width="168" height="18" rx="9" fill="rgba(255,255,255,.6)"/>
    <path d="M92 72l11 11M101 64l13 13M111 68l10 9" stroke="${SH}" stroke-width="4" stroke-linecap="round"/>
    <path d="M56 126c34 6 78 0 112-14" fill="none" stroke="${SH}" stroke-width="7" stroke-linecap="round"/>`,

  hoodie: `
    <path d="M70 38 38 60 20 120l30 10 8-28v66h84v-66l8 28 30-10-18-60-32-22c-4 18-16 28-30 28S74 56 70 38z" fill="${W}"/>
    <path d="M78 40c6 16 38 16 44 0" fill="none" stroke="${SH}" stroke-width="4" stroke-linecap="round"/>
    <path d="M92 58v22M108 58v22" stroke="${SH2}" stroke-width="4" stroke-linecap="round"/>
    <path d="M74 132h52l-8 24H82z" fill="${SH2}"/>`,

  sheets: `
    <rect x="34" y="124" width="132" height="26" rx="10" fill="${W}"/>
    <rect x="42" y="98" width="116" height="26" rx="10" fill="${W}" opacity=".85"/>
    <rect x="50" y="72" width="100" height="26" rx="10" fill="${W}" opacity=".7"/>
    <path d="m100 24 7 15 16 2-12 11 3 16-14-8-14 8 3-16-12-11 16-2z" fill="${W}"/>
    <path d="M44 138h112" stroke="${SH2}" stroke-width="3" stroke-dasharray="3 7" stroke-linecap="round"/>`,

  console: `
    <path d="M56 66h88c26 0 40 32 33 64-4 20-22 24-33 8l-8-12H64l-8 12c-11 16-29 12-33-8-7-32 7-64 33-64z" fill="${W}"/>
    <path d="M66 88v22M55 99h22" stroke="${SH}" stroke-width="8" stroke-linecap="round"/>
    <circle cx="137" cy="90" r="6.500" fill="${SH}"/><circle cx="151" cy="101" r="6.500" fill="${SH}"/>
    <circle cx="137" cy="112" r="6.500" fill="${SH}"/><circle cx="123" cy="101" r="6.500" fill="${SH}"/>
    <rect x="88" y="94" width="24" height="8" rx="4" fill="${SH2}"/>`,

  stick: `
    <rect x="26" y="82" width="124" height="38" rx="16" fill="${W}"/>
    <rect x="146" y="90" width="30" height="22" rx="5" fill="${W}" opacity=".7"/>
    <circle cx="58" cy="101" r="6" fill="${SH}"/>
    <path d="M78 101h46" stroke="${SH2}" stroke-width="5" stroke-linecap="round"/>
    <path d="M60 52c26-22 62-22 88 0" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="5" stroke-linecap="round"/>
    <path d="M76 66c16-12 40-12 56 0" fill="none" stroke="rgba(255,255,255,.8)" stroke-width="5" stroke-linecap="round"/>`,

  projector: `
    <rect x="28" y="70" width="144" height="78" rx="20" fill="${W}"/>
    <circle cx="124" cy="109" r="26" fill="${SH}"/>
    <circle cx="124" cy="109" r="14" fill="rgba(255,255,255,.65)"/>
    <rect x="46" y="96" width="30" height="7" rx="3.500" fill="${SH2}"/>
    <rect x="46" y="112" width="20" height="7" rx="3.500" fill="${SH2}"/>
    <rect x="52" y="148" width="14" height="12" rx="4" fill="${W}" opacity=".8"/>
    <rect x="134" y="148" width="14" height="12" rx="4" fill="${W}" opacity=".8"/>`,

  phone: `
    <rect x="56" y="18" width="88" height="164" rx="22" fill="${W}"/>
    <rect x="65" y="34" width="70" height="132" rx="10" fill="${SH}"/>
    <rect x="86" y="24" width="28" height="6" rx="3" fill="${SH2}"/>
    <rect x="72" y="44" width="56" height="30" rx="8" fill="rgba(255,255,255,.75)"/>
    <rect x="72" y="82" width="26" height="30" rx="7" fill="rgba(255,255,255,.55)"/>
    <rect x="102" y="82" width="26" height="30" rx="7" fill="rgba(255,255,255,.55)"/>
    <rect x="72" y="120" width="56" height="12" rx="6" fill="rgba(255,255,255,.4)"/>`
};

export function art(key, cls = 'art') {
  const body = ART[key] || ART.holder;
  return `<svg class="${cls}" viewBox="0 0 200 200" role="img" aria-hidden="true" focusable="false">${body}</svg>`;
}

const stroke = (d, extra = '') =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;

const ICON = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.500-3.500"/>',
  cart: '<path d="M3 4h2.500l2.200 11.500a2 2 0 0 0 2 1.500h7.600a2 2 0 0 0 2-1.500L21 8H6.200"/><circle cx="10" cy="20.500" r="1.200"/><circle cx="17" cy="20.500" r="1.200"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.900 4.900l1.400 1.400M17.700 17.700l1.400 1.400M2 12h2M20 12h2M4.900 19.100l1.400-1.400M17.700 6.300l1.400-1.400"/>',
  moon: '<path d="M20 14.500A8.500 8.500 0 1 1 9.500 4 7 7 0 0 0 20 14.500z"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  check: '<path d="m5 12.500 4.500 4.500L19 7.500"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>',
  truck: '<path d="M2 6h11v10H2zM13 10h4l3 3v3h-7"/><circle cx="7" cy="17.500" r="1.800"/><circle cx="17" cy="17.500" r="1.800"/>',
  shield: '<path d="M12 3 4.500 6v5.500c0 4.500 3.200 8 7.500 9.500 4.300-1.500 7.500-5 7.500-9.500V6z"/><path d="m9 12 2.200 2.200L15.500 10"/>',
  award: '<circle cx="12" cy="9" r="6"/><path d="m8.500 14 -1.500 7 5-3 5 3-1.500-7"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M5 12v8h14v-8M8 8a2.500 2.500 0 1 1 0-5c2 0 4 2 4 5 0-3 2-5 4-5a2.500 2.500 0 1 1 0 5"/>',
  download: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
  phone: '<rect x="7" y="2.500" width="10" height="19" rx="2.500"/><path d="M11 18.500h2"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2.500"/><path d="m4 7 8 6 8-6"/>',
  instagram: '<rect x="3.500" y="3.500" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17" cy="7" r=".8" fill="currentColor"/>',
  music: '<path d="M10 18V6l10-2v12"/><circle cx="7.500" cy="18" r="2.500"/><circle cx="17.500" cy="16" r="2.500"/>',
  filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.500" cy="8.500" r="1.200"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  sparkle: '<path d="m12 3 1.800 5.200L19 10l-5.200 1.800L12 17l-1.800-5.200L5 10l5.200-1.800zM19 17l.8 2.200L22 20l-2.200.8L19 23l-.8-2.200L16 20l2.200-.8z"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>'
};

export function icon(name, size = 20) {
  return stroke(ICON[name] || '', `width="${size}" height="${size}" aria-hidden="true" focusable="false"`);
}

export function starIcon(size = 14) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true"><path d="m12 2.800 2.800 5.800 6.300.9-4.600 4.400 1.100 6.300L12 17.200l-5.600 3 1.100-6.300L2.900 9.500l6.300-.9z"/></svg>`;
}
