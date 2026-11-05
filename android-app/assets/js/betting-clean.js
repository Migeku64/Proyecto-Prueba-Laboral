(() => {
  'use strict';

  /* Fanaticos 360 · controlador de la app demo */
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const on = (target, event, handler, options) => {
    const element = typeof target === 'string' ? $(target) : target;
    element?.addEventListener(event, handler, options);
  };
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));

  const keys = { theme: 'fanaticos-theme', balance: 'fanaticos-balance', bets: 'fanaticos-bets', profile: 'fanaticos-profile', session: 'fanaticos-auth-session' };
  const state = { sport: 'all', market: 'principales', picks: [], balance: Number(localStorage.getItem(keys.balance) || 250000) };
  const marketLabels = { principales: 'Principales', goles: 'Goles', corners: 'Corners', mitad: 'Mitad' };

  const matches = [
    ['real-barca', 'football', 'La Liga', 'Proximo', 'Real Madrid', 'Barcelona', ['2.10', '3.40', '3.05']],
    ['lakers-celtics', 'basketball', 'NBA', 'EN VIVO 2T', 'Lakers', 'Celtics', ['1.85', '1.90', '2.20']],
    ['sinner-alcaraz', 'tennis', 'ATP Finals', 'Manana 14:00', 'J. Sinner', 'C. Alcaraz', ['1.72', '3.50', '2.05']],
    ['city-arsenal', 'football', 'Premier League', 'Sabado 11:30', 'Man. City', 'Arsenal', ['1.88', '3.60', '3.75']],
    ['warriors-bulls', 'basketball', 'NBA', 'Hoy 21:00', 'Warriors', 'Bulls', ['1.65', '1.92', '2.55']],
    ['inter-juve', 'football', 'Serie A', 'Domingo 14:00', 'Inter Milan', 'Juventus', ['1.95', '3.25', '3.90']],
    ['psg-marseille', 'football', 'Ligue 1', 'Sabado 15:00', 'PSG', 'Marseille', ['1.55', '4.20', '5.40']],
    ['bayern-dortmund', 'football', 'Bundesliga', 'Domingo 12:30', 'Bayern Munich', 'Borussia Dortmund', ['1.70', '4.10', '4.35']],
    ['america-chivas', 'football', 'Liga MX', 'Viernes 21:00', 'America', 'Chivas', ['1.82', '3.45', '4.10']],
    ['chiefs-eagles', 'football', 'NFL', 'Lunes 20:15', 'Chiefs', 'Eagles', ['1.78', '1.90', '2.25']]
  ].map(([id, sport, league, status, home, away, odds]) => ({ id, sport, league, status, home, away, odds }));

  const getMatch = id => matches.find(match => match.id === id);
  const toast = message => {
    const node = $('#toast'); if (!node) return;
    node.textContent = message; node.classList.add('show'); clearTimeout(node._timer);
    node._timer = setTimeout(() => node.classList.remove('show'), 2200);
  };
  const money = value => '$ ' + Math.round(Number(value) || 0).toLocaleString('es-CO');
  const openPanel = panel => { if (!panel) return; $$('.side-panel,.bet-slip').forEach(item => item.classList.remove('open')); panel.classList.add('open'); panel.setAttribute('aria-hidden', 'false'); $('#scrim')?.classList.add('show'); };
  const closePanels = () => { $$('.side-panel,.bet-slip').forEach(item => { item.classList.remove('open'); item.setAttribute('aria-hidden', 'true'); }); $('#scrim')?.classList.remove('show'); };

  function odds(match, market) {
    const { home, away } = match;
    return {
      principales: [[home, match.odds[0]], ['Empate', match.odds[1]], [away, match.odds[2]]],
      goles: [['Mas 2.5', '1.68'], ['Menos 2.5', '2.05'], ['Ambos marcan', '1.72']],
      corners: [['Mas 8.5', '1.80'], ['Menos 8.5', '1.92'], ['Mas 10.5', '2.30']],
      mitad: [[home + ' 1T', '2.10'], ['Empate', '2.20'], [away + ' 1T', '3.15']]
    }[market] || [];
  }

  const slip = {
    render() {
      const list = $('#slip-items'); if (!list) return;
      $('#bet-count').textContent = state.picks.length;
      if (!state.picks.length) { list.innerHTML = '<div class="empty-slip">Selecciona una cuota para comenzar.</div>'; $('#potential-win').textContent = '$ 0'; return; }
      list.innerHTML = state.picks.map((pick, index) => `<div class="slip-item"><div><strong>${pick.match}</strong><small>${pick.choice} · Cuota seleccionada</small></div><div><b>${pick.odd.toFixed(2)}</b><button class="remove-slip" data-remove="${index}" aria-label="Eliminar seleccion">&times;</button></div></div>`).join('');
      $$('[data-remove]', list).forEach(button => on(button, 'click', () => { state.picks.splice(Number(button.dataset.remove), 1); slip.render(); }));
      const stake = Number($('#stake')?.value) || 0;
      $('#potential-win').textContent = money(stake * state.picks.reduce((total, pick) => total * pick.odd, 1));
    },
    add(match, choice, value) {
      if (!match) return;
      const pick = { id: match.id, match: `${match.home} vs ${match.away}`, choice, odd: Number(value) };
      const existing = state.picks.find(item => item.id === match.id);
      existing ? Object.assign(existing, pick) : state.picks.push(pick);
      slip.render(); openPanel($('#bet-slip')); toast('Seleccion agregada al boleto');
    },
    confirm() {
      if (!state.picks.length) return toast('Agrega al menos una seleccion');
      const bets = read(keys.bets, []);
      bets.unshift({ matches: state.picks.map(pick => pick.match).join(' + '), selections: state.picks.length, stake: money($('#stake')?.value), potential: $('#potential-win')?.textContent || '$ 0', status: 'Confirmada', date: new Date().toLocaleDateString('es-CO') });
      write(keys.bets, bets); state.picks.length = 0; slip.render(); closePanels(); toast('Apuesta confirmada y guardada en el historial');
    }
  };

  const catalog = {
    render() {
      const container = $('#events'); if (!container) return;
      container.innerHTML = matches.filter(match => state.sport === 'all' || match.sport === state.sport).map((match, index) => `<article class="event-card" data-match-id="${match.id}" style="animation-delay:${index * 60}ms"><div class="event-top"><span class="league">${match.league}</span><span class="event-state">${match.status}</span></div><div class="teams"><span class="team">${match.home}</span><span class="versus">VS</span><span class="team">${match.away}</span></div><div class="odds">${odds(match, state.market).map(([choice, value]) => `<button class="odd-button" data-match="${match.id}" data-choice="${choice}" data-odd="${value}"><small>${choice}</small>${value}</button>`).join('')}</div><small class="event-hint">Toca el partido para ver todos los mercados ›</small></article>`).join('');
    },
    detail(id) {
      const match = getMatch(id); const panel = $('#match-detail'); if (!match || !panel) return;
      let title = $('#detail-title');
      if (!title) { title = document.createElement('strong'); title.id = 'detail-title'; $('.match-topbar > div', panel)?.appendChild(title); }
      $('#detail-league').textContent = match.league.toUpperCase(); title.textContent = `${match.home} vs ${match.away}`; $('#detail-home').textContent = match.home; $('#detail-away').textContent = match.away; $('#detail-home-badge').textContent = match.home[0]; $('#detail-away-badge').textContent = match.away[0]; $('#detail-score').textContent = match.id === 'lakers-celtics' ? '0 - 1' : '- -'; $('#detail-time').textContent = match.id === 'lakers-celtics' ? '2T · 74:00' : 'Proximo'; $('#detail-event-state').textContent = match.id === 'lakers-celtics' ? '◉ Sigue en vivo' : '◌ Sigue el partido'; $('#detail-meta').innerHTML = `<strong>${match.league}</strong><br>Selecciona una cuota para añadirla al boleto.`;
      $('#detail-markets').innerHTML = Object.keys(marketLabels).map(market => `<section data-market-section="${market}"><div class="detail-market-title"><span>${marketLabels[market]}</span><small>Cuotas</small></div><div class="detail-odds">${odds(match, market).map(([choice, value]) => `<button class="detail-odd" data-detail-choice="${choice}" data-detail-odd="${value}"><small>${choice}</small><br>${value}</button>`).join('')}</div></section>`).join('');
      openPanel(panel);
      $$('[data-detail-choice]', panel).forEach(button => on(button, 'click', () => slip.add(match, button.dataset.detailChoice, button.dataset.detailOdd)));
    }
  };

  function renderHistory() {
    const list = $('#my-bets-list'); if (!list) return;
    const bets = read(keys.bets, []);
    list.innerHTML = bets.length ? bets.map(bet => `<article class="my-bet"><div class="my-bet-head"><strong>${bet.matches || 'Partido'}</strong><span class="my-bet-status">${bet.status || 'Confirmada'}</span></div><small>${bet.date || 'Hoy'} · ${bet.selections || 1} seleccion${Number(bet.selections) === 1 ? '' : 'es'}</small><div class="my-bet-meta"><span>Apostado ${bet.stake || '$ 0'}</span><b>Ganancia ${bet.potential || '$ 0'}</b></div></article>`).join('') : '<div class="empty-bets">Todavia no tienes apuestas confirmadas.</div>';
  }

  function setupNavigation() {
    $$('.bottom-nav .nav-item').forEach(button => on(button, 'click', event => { event.preventDefault(); $$('.bottom-nav .nav-item').forEach(item => item.classList.toggle('active', item === button)); const view = button.dataset.view || (button.id === 'bet-nav' ? 'bets' : ''); if (view === 'home') window.scrollTo({ top: 0, behavior: 'smooth' }); if (view === 'live') $('.events-block')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); if (view === 'bets') { openPanel($('#my-bets-panel')); renderHistory(); } if (view === 'profile') openPanel($('#profile-panel')); }));
    $$('.market-filter').forEach(button => on(button, 'click', () => { state.market = button.dataset.marketFilter; $$('.market-filter').forEach(item => item.classList.toggle('active', item === button)); catalog.render(); }));
    $$('.sport-tab').forEach(button => on(button, 'click', () => { state.sport = button.dataset.sport; $$('.sport-tab').forEach(item => item.classList.toggle('active', item === button)); catalog.render(); }));
  }

  function setupEvents() {
    on('#events', 'click', event => { const odd = event.target.closest('[data-match]'); if (odd) { event.stopPropagation(); slip.add(getMatch(odd.dataset.match), odd.dataset.choice, odd.dataset.odd); return; } const card = event.target.closest('[data-match-id]'); if (card) catalog.detail(card.dataset.matchId); });
    $$('[data-open-match]').forEach(button => on(button, 'click', event => { event.preventDefault(); catalog.detail(button.dataset.openMatch); }));
    $$('[data-detail-tab]').forEach(tab => on(tab, 'click', () => { $$('[data-detail-tab]').forEach(item => item.classList.toggle('active', item === tab)); $$('[data-market-section]').forEach(section => { section.style.display = tab.dataset.detailTab === 'todo' || section.dataset.marketSection === tab.dataset.detailTab ? 'block' : 'none'; }); }));
  }

  function setupAccount() {
    const refresh = () => { $('#balance-amount').textContent = money(state.balance); $('#deposit-balance').textContent = money(state.balance); };
    on('#deposit-button', 'click', () => { refresh(); openPanel($('#deposit-panel')); });
    $$('[data-amount]').forEach(button => on(button, 'click', () => { $$('[data-amount]').forEach(item => item.classList.remove('active')); button.classList.add('active'); $('#deposit-amount').value = button.dataset.amount; }));
    on('#confirm-deposit', 'click', () => { const amount = Number($('#deposit-amount')?.value) || 0; if (amount < 1000) return toast('Ingresa un monto minimo de $1.000'); state.balance += amount; localStorage.setItem(keys.balance, state.balance); refresh(); closePanels(); toast('Recarga demo agregada a tu saldo'); });
    on('#profile-form', 'submit', event => { event.preventDefault(); const profile = { name: $('#profile-name').value, email: $('#profile-email').value }; write(keys.profile, profile); $('#profile-title').textContent = profile.name; closePanels(); toast('Perfil guardado correctamente'); });
    $$('[data-bet-tab]').forEach(tab => on(tab, 'click', () => { $$('[data-bet-tab]').forEach(item => item.classList.toggle('active', item === tab)); renderHistory(); }));
    refresh();
  }

  function setupAuthAndTheme() {
    const auth = $('#auth-screen'); const shell = $('.app-shell');
    const enter = message => { auth?.classList.add('is-hidden'); shell?.classList.remove('app-locked'); sessionStorage.setItem(keys.session, 'true'); if (message) toast(message); };
    if (sessionStorage.getItem(keys.session) === 'true') enter();
    $$('[data-auth-tab]').forEach(tab => on(tab, 'click', () => { const register = tab.dataset.authTab === 'register'; $$('[data-auth-tab]').forEach(item => item.classList.toggle('active', item === tab)); $('#login-form')?.classList.toggle('is-hidden', register); $('#register-form')?.classList.toggle('is-hidden', !register); $('#auth-heading').textContent = register ? 'Crea tu cuenta' : 'Entra al juego'; }));
    on('#login-form', 'submit', event => { event.preventDefault(); enter('Sesion demo iniciada'); }); on('#register-form', 'submit', event => { event.preventDefault(); enter('Cuenta demo creada'); }); on('#guest-access', 'click', () => enter('Estas explorando Fanaticos 360')); $$('[data-social]').forEach(button => on(button, 'click', () => enter(`Continuar con ${button.dataset.social} en modo demo`))); on('#auth-button', 'click', () => auth?.classList.remove('is-hidden')); on('#auth-close', 'click', () => auth?.classList.add('is-hidden'));
    if (localStorage.getItem(keys.theme) === 'light') document.body.classList.add('theme-light'); on('#theme-toggle', 'click', () => { document.body.classList.toggle('theme-light'); localStorage.setItem(keys.theme, document.body.classList.contains('theme-light') ? 'light' : 'dark'); });
  }

  function init() {
    $$('img[src="assets/app.png"]').forEach(image => image.src = 'assets/f360-logo.png');
    catalog.render(); slip.render(); renderHistory(); setupNavigation(); setupEvents(); setupAccount(); setupAuthAndTheme();
    $$('.reveal').forEach(item => item.classList.add('visible'));
    on('#close-slip', 'click', closePanels); on('#scrim', 'click', closePanels); $$('[data-close-panel]').forEach(button => on(button, 'click', closePanels)); on('#place-bet', 'click', () => slip.confirm()); on('#stake', 'input', () => slip.render());
    const profile = read(keys.profile, null); if (profile) { $('#profile-title').textContent = profile.name; $('#profile-name').value = profile.name; $('#profile-email').value = profile.email; }
    const splash = $('#app-splash'); if (splash) setTimeout(() => splash.classList.add('is-hidden'), matchMedia('(prefers-reduced-motion: reduce)').matches ? 250 : 1500);
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init, { once: true }) : init();
})();
