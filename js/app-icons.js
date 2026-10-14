(function () {
  const art = {
    headphones: '<path d="M44 118V102a56 56 0 0 1 112 0v16" fill="none" stroke="#fff" stroke-width="11" stroke-linecap="round"/><rect x="28" y="108" width="38" height="64" rx="16" fill="#fff"/><rect x="134" y="108" width="38" height="64" rx="16" fill="#fff"/><rect x="37" y="122" width="20" height="36" rx="9" fill="#9aa2b4"/><rect x="143" y="122" width="20" height="36" rx="9" fill="#9aa2b4"/>',
    cable: '<path d="M52 150C52 92 148 128 148 60" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round"/><rect x="38" y="146" width="28" height="32" rx="7" fill="#fff"/><rect x="134" y="24" width="28" height="32" rx="7" fill="#fff"/>',
    powerbank: '<rect x="60" y="26" width="80" height="148" rx="22" fill="#fff"/><rect x="76" y="46" width="12" height="9" rx="3" fill="#a8afbe"/><rect x="94" y="46" width="12" height="9" rx="3" fill="#a8afbe"/><path d="M106 82 86 118h15l-7 32 26-42h-15z" fill="#a8afbe"/>',
    holder: '<g transform="rotate(-10 100 92)"><rect x="62" y="22" width="76" height="124" rx="16" fill="#fff"/><rect x="70" y="34" width="60" height="96" rx="7" fill="#a8afbe"/></g><path d="M100 150v18M58 176h84" stroke="#fff" stroke-width="10" stroke-linecap="round"/>',
    sneaker: '<path d="M22 136c0-17 12-24 26-28l26-46c5-8 15-10 22-4l14 14c7 6 17 8 28 14 24 12 40 22 40 40v10H22z" fill="#fff"/><rect x="18" y="138" width="168" height="18" rx="9" fill="rgba(255,255,255,.6)"/><path d="M56 126c34 6 78 0 112-14" fill="none" stroke="#a8afbe" stroke-width="7" stroke-linecap="round"/>',
    audio: '<circle cx="100" cy="100" r="65" fill="rgba(255,255,255,.14)"/><path d="M55 115V99a45 45 0 0 1 90 0v16" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round"/><rect x="42" y="108" width="28" height="48" rx="12" fill="#fff"/><rect x="130" y="108" width="28" height="48" rx="12" fill="#fff"/>'
  };
  window.getIcon = function (name) {
    const aliases = { audio: 'headphones', calzado: 'sneaker', gadgets: 'powerbank', hogar: 'holder', apparel: 'headphones', gaming: 'powerbank' };
    const body = art[name] || art[aliases[name]] || art.headphones;
    return '<svg viewBox="0 0 200 200" aria-hidden="true" focusable="false">' + body + '</svg>';
  };
})();
