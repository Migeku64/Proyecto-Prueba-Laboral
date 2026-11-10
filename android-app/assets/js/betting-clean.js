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
  const footballBets = () => {
    const blocked = /warriors|bulls|lakers|celtics|sinner|alcaraz|chiefs|eagles|nba|tenis|basket/i;
    const bets = read('fanaticos-bets', []);
    const clean = bets.filter(bet => !blocked.test(bet.matches || ''));
    if (clean.length !== bets.length) write('fanaticos-bets', clean);
    return clean;
  };

  const keys = { theme: 'fanaticos-theme', balance: 'fanaticos-balance', bets: 'fanaticos-bets', profile: 'fanaticos-profile', session: 'fanaticos-auth-session' };
  const state = { sport: 'all', league: 'all', market: 'principales', picks: [], balance: Number(localStorage.getItem(keys.balance) || 250000), authenticated: sessionStorage.getItem('fanaticos-auth-session') === 'true', source: 'local', detailId: null, lastUpdate: 0, hasLoadedReal: false };
  const marketLabels = { principales: 'Principales', goles: 'Goles', corners: 'Corners', mitad: 'Mitad' };

  let matches = [
    ['local-colombia-1', 'colombia', 'Liga BetPlay', 'Próximo', 'Partido colombiano', 'Próximo rival', ['2.10', '3.40', '3.05']],
    ['local-international-1', 'international', 'CONMEBOL Libertadores', 'Próximo', 'Partido internacional', 'Próximo rival', ['1.90', '3.35', '3.70']]
  ].map(([id, sport, league, status, home, away, odds]) => ({ id, sport, league, status, home, away, odds, real: false }));

  const ESPN_LEAGUES = [
    { slug: 'col.1', sport: 'colombia', label: 'Liga BetPlay' },
    { slug: 'col.2', sport: 'colombia', label: 'Primera B Colombia' },
    { slug: 'conmebol.libertadores', sport: 'international', label: 'CONMEBOL Libertadores' },
    { slug: 'conmebol.sudamericana', sport: 'international', label: 'CONMEBOL Sudamericana' },
    { slug: 'eng.1', sport: 'international', label: 'Premier League' },
    { slug: 'esp.1', sport: 'international', label: 'La Liga' }
  ];

  const getMatch = id => matches.find(match => match.id === id);
  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  const isoDate = date => date.toISOString().slice(0, 10).replace(/-/g, '');
  const dateList = () => { const dates = []; const from = new Date(); for (let offset = 0; offset <= 7; offset += 1) { const date = new Date(from); date.setDate(from.getDate() + offset); dates.push(isoDate(date)); } return dates; };
  const parseEspnOdds = (event, fallback) => {
    const raw = event.competitions?.[0]?.odds?.[0];
    const details = raw?.details || '';
    const values = details.match(/\d+(?:\.\d+)?/g)?.slice(0, 3);
    return values?.length === 3 ? values : fallback;
  };
  async function loadRealMatches(options = {}) {
    const dates = options.liveOnly ? [isoDate(new Date())] : dateList();
    const requests = ESPN_LEAGUES.flatMap(league => dates.map(async date => {
      const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${league.slug}/scoreboard?dates=${date}`;
      const response = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return (data.events || []).map(event => {
        const competition = event.competitions?.[0];
        const competitors = competition?.competitors || [];
        const home = competitors.find(item => item.homeAway === 'home') || competitors[0];
        const away = competitors.find(item => item.homeAway === 'away') || competitors[1];
        if (!home || !away) return null;
        const status = event.status?.type?.shortDetail || event.status?.type?.detail || 'Próximo';
        return { id: `espn-${event.id}`, sport: league.sport, league: league.label, status, home: home.team?.displayName || home.team?.name, away: away.team?.displayName || away.team?.name, odds: parseEspnOdds(event, ['2.10', '3.40', '3.05']), real: true, date: event.date, source: 'ESPN' };
      }).filter(Boolean);
    }));
    const groups = await Promise.allSettled(requests);
    const fresh = groups.flatMap(result => result.status === 'fulfilled' ? result.value : []);
    if (!fresh.length) throw new Error('No hay partidos disponibles');
    if (options.liveOnly && state.hasLoadedReal) {
      const freshById = new Map(fresh.map(match => [match.id, match]));
      matches = matches.map(match => freshById.get(match.id) || match);
      fresh.forEach(match => { if (!matches.some(current => current.id === match.id)) matches.push(match); });
    } else matches = fresh;
    state.source = 'ESPN';
    state.lastUpdate = Date.now();
    catalog.render();
    renderPopular();
    updateLiveTicker();
    if (state.detailId && $('#match-detail')?.classList.contains('open')) catalog.detail(state.detailId);
    if (!state.hasLoadedReal) toast(`Partidos reales actualizados · ${matches.length} encuentros`);
    state.hasLoadedReal = true;
  }

  function updateLiveTicker() {
    const ticker = $('#ticker-copy');
    if (!ticker) return;
    const when = state.lastUpdate ? new Date(state.lastUpdate).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '--:--';
    ticker.textContent = `Última actualización ${when} · ${matches.length} partidos`;
  }
  const toast = message => {
    const node = $('#toast'); if (!node) return;
    if (/incorrect|coincid|mayor de 18|terminos/i.test(String(message))) authAlert(message);
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

  function promptLogin(message) {
    const auth = $('#auth-screen');
    auth?.classList.remove('is-hidden');
    toast(message);
  }

  function authAlert(message) {
    let alert = $('#auth-alert');
    if (!alert) { alert = document.createElement('p'); alert.id = 'auth-alert'; alert.className = 'auth-alert'; $('.auth-card')?.appendChild(alert); }
    alert.textContent = message;
    alert.classList.add('show');
    clearTimeout(alert._timer);
    alert._timer = setTimeout(() => alert.classList.remove('show'), 4200);
  }

  function renderPopular() {
    const list = $('#popular-list');
    if (!list) return;
    const featured = matches.filter(match => match.real).slice(0, 2);
    list.innerHTML = featured.length ? featured.map(match => `<button class="popular-match" data-open-match="${escapeHtml(match.id)}"><span>${escapeHtml(match.league)}</span><b>${escapeHtml(match.home)} <i>vs</i> ${escapeHtml(match.away)}</b><small>Mercados disponibles &#8250;</small></button>`).join('') : '<div class="empty-bets">No hay partidos destacados disponibles ahora.</div>';
    $$('[data-open-match]', list).forEach(button => on(button, 'click', () => catalog.detail(button.dataset.openMatch)));
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
      if (!state.authenticated) return promptLogin('Inicia sesión para agregar selecciones al boleto.');
      const pick = { id: match.id, match: `${match.home} vs ${match.away}`, choice, odd: Number(value) };
      const existing = state.picks.find(item => item.id === match.id);
      existing ? Object.assign(existing, pick) : state.picks.push(pick);
      slip.render(); openPanel($('#bet-slip')); toast('Seleccion agregada al boleto');
    },
    confirm() {
      if (!state.authenticated) return promptLogin('Inicia sesión antes de confirmar una apuesta.');
      if (!state.picks.length) return toast('Agrega al menos una seleccion');
      const bets = footballBets();
      bets.unshift({ matches: state.picks.map(pick => pick.match).join(' + '), selections: state.picks.length, stake: money($('#stake')?.value), potential: $('#potential-win')?.textContent || '$ 0', status: 'Confirmada', sport: 'football', date: new Date().toLocaleDateString('es-CO'), createdAt: Date.now() });
      write(keys.bets, bets); state.picks.length = 0; slip.render(); renderHistory(); renderProfile(read(keys.profile, null)); closePanels(); toast('Apuesta confirmada y sincronizada en Mis apuestas y tu perfil');
    }
  };

  const catalog = {
    render() {
      const container = $('#events'); if (!container) return;
      const visible = matches.filter(match => (state.sport === 'all' || match.sport === state.sport) && (state.league === 'all' || match.league === state.league));
      container.innerHTML = visible.length ? visible.map((match, index) => `<article class="event-card" data-match-id="${match.id}" style="animation-delay:${index * 60}ms"><div class="event-top"><span class="league">${match.league}</span><span class="event-state">${match.status}</span></div><div class="teams"><span class="team">${match.home}</span><span class="versus">VS</span><span class="team">${match.away}</span></div><div class="odds">${odds(match, state.market).map(([choice, value]) => `<button class="odd-button" data-match="${match.id}" data-choice="${choice}" data-odd="${value}"><small>${choice}</small>${value}</button>`).join('')}</div><small class="event-hint">Toca el partido para ver todos los mercados ›</small></article>`).join('') : '<div class="empty-bets">No hay partidos disponibles para esta competición en los próximos días.</div>';
    },
    detail(id) {
      const match = getMatch(id) || (id === 'featured-1' ? matches.find(item => item.sport === 'colombia') : matches.find(item => item.sport === 'international')); const panel = $('#match-detail'); if (!match || !panel) return toast('Todavía no hay un partido disponible en esta liga.');
      state.detailId = match.id;
      let title = $('#detail-title') || $('.match-topbar > div strong', panel);
      if (!title) { title = document.createElement('strong'); $('.match-topbar > div', panel)?.appendChild(title); }
      title.id = 'detail-title';
      Object.assign(title.style, { display: 'block', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' });
      $('#detail-league').textContent = match.league.toUpperCase(); title.textContent = `${match.home} vs ${match.away}`; $('#detail-home').textContent = match.home; $('#detail-away').textContent = match.away; $('#detail-home-badge').textContent = match.home[0]; $('#detail-away-badge').textContent = match.away[0]; $('#detail-score').textContent = '- -'; $('#detail-time').textContent = match.status || 'Próximo'; $('#detail-event-state').textContent = '◌ Sigue el partido'; $('#detail-meta').innerHTML = `<strong>${match.league}</strong><br>Datos del calendario: ${match.source || 'respaldo local'}. Selecciona una cuota para añadirla al boleto.`;
      $('#detail-markets').innerHTML = Object.keys(marketLabels).map(market => `<section data-market-section="${market}"><div class="detail-market-title"><span>${marketLabels[market]}</span><small>Cuotas</small></div><div class="detail-odds">${odds(match, market).map(([choice, value]) => `<button class="detail-odd" data-detail-choice="${choice}" data-detail-odd="${value}"><small>${choice}</small><br>${value}</button>`).join('')}</div></section>`).join('');
      openPanel(panel);
      $$('[data-detail-choice]', panel).forEach(button => on(button, 'click', () => slip.add(match, button.dataset.detailChoice, button.dataset.detailOdd)));
    }
  };

  function renderHistory() {
    const list = $('#my-bets-list'); if (!list) return;
    const bets = footballBets();
    list.innerHTML = bets.length ? bets.map(bet => `<article class="my-bet"><div class="my-bet-head"><strong>${bet.matches || 'Partido'}</strong><span class="my-bet-status">${bet.status || 'Confirmada'}</span></div><small>${bet.date || 'Hoy'} · ${bet.selections || 1} seleccion${Number(bet.selections) === 1 ? '' : 'es'}</small><div class="my-bet-meta"><span>Apostado ${bet.stake || '$ 0'}</span><b>Ganancia ${bet.potential || '$ 0'}</b></div></article>`).join('') : '<div class="empty-bets">Todavia no tienes apuestas confirmadas.</div>';
  }

  function field(label, id, type = 'text', placeholder = '', required = false) {
    const wrapper = document.createElement('label');
    wrapper.innerHTML = `${label}<input id="${id}" type="${type}" placeholder="${placeholder}"${required ? ' required' : ''}>`;
    return wrapper;
  }

  function convertToSelect(container, id, options) {
    const input = $(`#${id}`, container);
    if (!input) return;
    const select = document.createElement('select');
    select.id = id;
    select.required = input.required;
    select.innerHTML = options.map(option => `<option value="${option}">${option}</option>`).join('');
    input.replaceWith(select);
  }

  function bindLocationSelectors(container, countryId, cityId) {
    const country = $(`#${countryId}`, container);
    const city = $(`#${cityId}`, container);
    if (!country || !city) return;
    const cities = { Colombia: ['Bogota', 'Medellin', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga', 'Pereira'], Argentina: ['Buenos Aires', 'Cordoba', 'Rosario', 'Mendoza', 'La Plata', 'Mar del Plata'], Chile: ['Santiago', 'Valparaiso', 'Concepcion', 'La Serena'], Ecuador: ['Quito', 'Guayaquil', 'Cuenca', 'Ambato'], Mexico: ['Ciudad de Mexico', 'Guadalajara', 'Monterrey', 'Puebla'], Peru: ['Lima', 'Arequipa', 'Cusco', 'Trujillo'], Venezuela: ['Caracas', 'Maracaibo', 'Valencia', 'Barquisimeto'] };
    const refreshCities = (preferred = '') => { const list = cities[country.value] || ['Otra ciudad']; city.innerHTML = list.map(item => `<option value="${item}">${item}</option>`).join(''); if (preferred && list.includes(preferred)) city.value = preferred; };
    country.addEventListener('change', () => refreshCities());
    refreshCities(city.value);
  }

  function setupExtendedRegistration() {
    const form = $('#register-form');
    if (!form || $('#register-first-name')) return;
    const legacyName = form.querySelector('label');
    legacyName?.classList.add('legacy-name-field');
    legacyName?.querySelector('input')?.removeAttribute('required');
    const extras = document.createElement('div');
    extras.className = 'registration-extra form-grid';
    [['Nombres', 'register-first-name', 'text', 'Tus nombres'], ['Apellidos', 'register-last-name', 'text', 'Tus apellidos'], ['Numero celular', 'register-phone', 'tel', '300 000 0000'], ['Fecha de nacimiento', 'register-birth-date', 'date', ''], ['Ciudad', 'register-city', 'text', 'Bogota'], ['Pais', 'register-country', 'text', 'Colombia']].forEach(item => extras.appendChild(field(...item, true)));
    const terms = document.createElement('label');
    terms.className = 'check-row';
    terms.innerHTML = '<input id="register-terms" type="checkbox" required> Acepto los terminos y condiciones';
    const adult = document.createElement('label');
    adult.className = 'check-row';
    adult.innerHTML = '<input id="register-adult" type="checkbox" required> Confirmo que soy mayor de 18 años';
    const submit = $('button[type="submit"]', form);
    const confirmPassword = field('Confirmar contraseña', 'register-password-confirm', 'password', 'Repite tu contraseña', true);
    submit ? form.insertBefore(confirmPassword, submit) : form.appendChild(confirmPassword);
    submit ? form.insertBefore(extras, submit) : form.appendChild(extras);
    convertToSelect(extras, 'register-city', ['Bogota', 'Medellin', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga', 'Pereira', 'Otra ciudad']);
    convertToSelect(extras, 'register-country', ['Colombia', 'Argentina', 'Chile', 'Ecuador', 'Mexico', 'Peru', 'Venezuela', 'Otro pais']);
    bindLocationSelectors(extras, 'register-country', 'register-city');
    submit ? form.insertBefore(terms, submit) : form.appendChild(terms);
    submit ? form.insertBefore(adult, submit) : form.appendChild(adult);
  }

  function isAdult(dateValue) {
    const birth = new Date(`${dateValue}T00:00:00`);
    if (Number.isNaN(birth.getTime())) return false;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const beforeBirthday = today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
    if (beforeBirthday) age -= 1;
    return age >= 18;
  }

  function profileMetrics(period = 'all') {
    const bets = footballBets();
    const now = Date.now();
    const limits = { day: 86400000, week: 604800000, month: 2592000000 };
    return bets.filter(bet => period === 'all' || (bet.createdAt && now - Number(bet.createdAt) <= limits[period])).length;
  }

  function renderProfile(profile = read(keys.profile, null), period = 'all') {
    const panel = $('#profile-panel');
    if (!panel) return;
    const form = $('#profile-form');
    if (profile) {
      $('#profile-title').textContent = profile.username || profile.name || 'Mi perfil';
      $('#profile-name').value = profile.name || '';
      $('#profile-email').value = profile.email || '';
      const values = { 'profile-username': profile.username || '', 'profile-first-name': profile.firstName || '', 'profile-last-name': profile.lastName || '', 'profile-phone': profile.phone || '', 'profile-country': profile.country || 'Colombia', 'profile-birth-date': profile.birthDate || '' };
      Object.entries(values).forEach(([id, value]) => { const input = $(`#${id}`); if (input) input.value = value; });
      const country = $('#profile-country'); const city = $('#profile-city'); if (country && city) { country.dispatchEvent(new Event('change')); if ([...city.options].some(option => option.value === profile.city)) city.value = profile.city; }
    }
    let stats = $('#profile-stats');
    if (!stats) { stats = document.createElement('div'); stats.id = 'profile-stats'; form?.after(stats); }
    const total = profileMetrics(period);
    const registered = profile?.registeredAt ? new Date(profile.registeredAt).toLocaleDateString('es-CO') : 'No disponible';
    stats.innerHTML = `<div class="profile-stats-head"><strong>Apuestas realizadas</strong><span>${total}</span></div><small class="profile-registered">Registro: ${registered}</small><div class="profile-periods">${[['all', 'Todo'], ['day', 'Hoy'], ['week', 'Semana'], ['month', 'Mes']].map(([key, label]) => `<button type="button" data-profile-period="${key}" class="${period === key ? 'active' : ''}">${label}</button>`).join('')}</div>`;
    $$('[data-profile-period]', stats).forEach(button => on(button, 'click', () => renderProfile(profile, button.dataset.profilePeriod)));
  }

  function setupExtendedProfile() {
    const form = $('#profile-form');
    if (!form || $('#profile-username')) return;
    $('#profile-password')?.removeAttribute('required');
    const submit = $('button[type="submit"]', form);
    const extras = document.createElement('div');
    extras.className = 'profile-extra form-grid';
    [['Nombre de usuario', 'profile-username', 'text', 'Tu usuario'], ['Nombres', 'profile-first-name', 'text', 'Tus nombres'], ['Apellidos', 'profile-last-name', 'text', 'Tus apellidos'], ['Numero celular', 'profile-phone', 'tel', '300 000 0000'], ['Fecha de nacimiento', 'profile-birth-date', 'date', ''], ['Ciudad', 'profile-city', 'text', 'Bogota'], ['Pais', 'profile-country', 'text', 'Colombia']].forEach(item => extras.appendChild(field(...item)));
    submit ? form.insertBefore(extras, submit) : form.appendChild(extras);
    convertToSelect(extras, 'profile-city', ['Bogota', 'Medellin', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga', 'Pereira', 'Otra ciudad']);
    convertToSelect(extras, 'profile-country', ['Colombia', 'Argentina', 'Chile', 'Ecuador', 'Mexico', 'Peru', 'Venezuela', 'Otro pais']);
    bindLocationSelectors(extras, 'profile-country', 'profile-city');
  }

  function setupProfileIcons() {
    const top = $('#profile-button');
    if (top) top.innerHTML = '<img class="profile-icon" src="register.png" alt="Perfil">';
    const bottom = $('.bottom-nav [data-view="profile"] span');
    if (bottom) bottom.innerHTML = '<img class="profile-icon" src="register.png" alt="Perfil">';
  }

  function setupSocialButtons() {
    const google = $('[data-social="Google"]');
    const apple = $('[data-social="Apple"]');
    const mail = $('[data-social="correo"]');
    if (google) google.innerHTML = '<span class="social-logo google-logo">G</span><span>Google</span>';
    if (apple) apple.innerHTML = '<span class="social-logo apple-logo"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.7 12.8c0-2.1 1.7-3.1 1.8-3.2-1-.1-2.2-1.1-3.8-1.1-1.5 0-2.6.8-3.3.8-.7 0-1.7-.8-2.9-.8-1.5 0-2.9.9-3.7 2.3-1.6 2.8-.4 7 1.1 9.3.8 1.1 1.6 2.3 2.8 2.2 1.1-.1 1.6-.7 2.9-.7 1.4 0 1.8.7 2.9.7 1.2 0 1.9-1.1 2.7-2.2.9-1.3 1.3-2.6 1.3-2.7-.1 0-1.8-.7-1.8-2.6ZM14.3 6.9c.6-.8 1-1.8.9-2.9-.9 0-2 .6-2.7 1.3-.6.7-1.1 1.8-1 2.8 1 .1 2.1-.5 2.8-1.2Z"/></svg></span><span>Apple</span>';
    if (mail) mail.innerHTML = '<span class="social-logo mail-logo"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 5.5h17v13h-17zM4 6l8 6 8-6"/></svg></span><span>Correo</span>';
  }

  function setupNavigation() {
    $$('.bottom-nav .nav-item').forEach(button => on(button, 'click', event => { event.preventDefault(); $$('.bottom-nav .nav-item').forEach(item => item.classList.toggle('active', item === button)); const view = button.dataset.view || (button.id === 'bet-nav' ? 'bets' : ''); if (view === 'home') window.scrollTo({ top: 0, behavior: 'smooth' }); if (view === 'live') $('.events-block')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); if (view === 'bets') { if (!state.authenticated) return promptLogin('Inicia sesión para consultar tus apuestas.'); openPanel($('#my-bets-panel')); renderHistory(); } if (view === 'profile') { if (!state.authenticated) { closePanels(); $('#auth-screen')?.classList.remove('is-hidden'); toast('Inicia sesión o crea una cuenta para ver tu perfil.'); return; } renderProfile(read(keys.profile, null)); openPanel($('#profile-panel')); } }));
    on('#profile-button', 'click', () => { if (!state.authenticated) { closePanels(); $('#auth-screen')?.classList.remove('is-hidden'); toast('Inicia sesión o crea una cuenta para ver tu perfil.'); return; } renderProfile(read(keys.profile, null)); openPanel($('#profile-panel')); });
    $$('.market-filter').forEach(button => on(button, 'click', () => { state.market = button.dataset.marketFilter; $$('.market-filter').forEach(item => item.classList.toggle('active', item === button)); catalog.render(); }));
    $$('.sport-tab').forEach(button => on(button, 'click', () => { state.sport = button.dataset.sport; state.league = 'all'; $$('.sport-tab').forEach(item => item.classList.toggle('active', item === button)); $$('.league-card').forEach(item => item.classList.remove('active')); catalog.render(); }));
    $$('.league-card').forEach(button => on(button, 'click', () => { state.league = button.dataset.league || 'all'; state.sport = state.league.includes('Colombia') || state.league.includes('BetPlay') || state.league.includes('Copa') ? 'colombia' : 'international'; $$('.league-card').forEach(item => item.classList.toggle('active', item === button)); $$('.sport-tab').forEach(item => item.classList.toggle('active', item.dataset.sport === state.sport)); catalog.render(); document.querySelector('.events-block')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
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
    on('#profile-form', 'submit', event => { event.preventDefault(); const old = read(keys.profile, {}); const profile = { ...old, name: $('#profile-name').value, email: $('#profile-email').value, username: $('#profile-username')?.value || old.username || $('#profile-name').value, firstName: $('#profile-first-name')?.value || old.firstName || '', lastName: $('#profile-last-name')?.value || old.lastName || '', phone: $('#profile-phone')?.value || old.phone || '', city: $('#profile-city')?.value || old.city || '', country: $('#profile-country')?.value || old.country || '', birthDate: $('#profile-birth-date')?.value || old.birthDate || '' }; write(keys.profile, profile); renderProfile(profile); closePanels(); toast('Perfil guardado correctamente'); });
    $$('[data-bet-tab]').forEach(tab => on(tab, 'click', () => { $$('[data-bet-tab]').forEach(item => item.classList.toggle('active', item === tab)); renderHistory(); }));
    on('#logout-button', 'click', () => { state.authenticated = false; sessionStorage.removeItem(keys.session); const authButton = $('#auth-button'); if (authButton) { authButton.textContent = 'Iniciar sesion'; authButton.classList.remove('is-authenticated'); } closePanels(); $('#auth-screen')?.classList.remove('is-hidden'); toast('Sesion cerrada'); });
    setupExtendedProfile(); renderProfile(); refresh();
  }

  function setupAuthAndTheme() {
    const auth = $('#auth-screen'); const shell = $('.app-shell'); setupExtendedRegistration();
    const refreshAuthButton = () => { const button = $('#auth-button'); if (!button) return; const profile = read(keys.profile, null); button.textContent = state.authenticated ? (profile?.username || 'Mi perfil') : 'Iniciar sesion'; button.classList.toggle('is-authenticated', state.authenticated); };
    const enter = (message, authenticated = true) => { auth?.classList.add('is-hidden'); shell?.classList.remove('app-locked'); state.authenticated = authenticated; if (authenticated) sessionStorage.setItem(keys.session, 'true'); else sessionStorage.removeItem(keys.session); refreshAuthButton(); if (message) toast(message); };
    if (state.authenticated) enter(); else refreshAuthButton();
    on('#login-form', 'submit', event => { const profile = read(keys.profile, null); const email = $('input[type="email"]', event.currentTarget)?.value.trim().toLowerCase() || ''; const password = $('input[type="password"]', event.currentTarget)?.value || ''; if (!profile || email !== String(profile.email || '').trim().toLowerCase() || password !== String(profile.password || '')) { event.preventDefault(); event.stopImmediatePropagation(); toast('Correo o contraseña incorrectos'); } }, true);
    on('#register-form', 'submit', event => { const birthDate = $('#register-birth-date')?.value; const password = $('input[type="password"]', event.currentTarget)?.value || ''; const confirmation = $('#register-password-confirm')?.value || ''; if (password !== confirmation) { event.preventDefault(); event.stopImmediatePropagation(); return toast('Las contraseñas no coinciden'); } if (!isAdult(birthDate) || !$('#register-terms')?.checked || !$('#register-adult')?.checked) { event.preventDefault(); event.stopImmediatePropagation(); toast(!isAdult(birthDate) ? 'Debes ser mayor de 18 años para registrarte' : 'Acepta los terminos y confirma tu edad'); return; } const firstName = $('#register-first-name')?.value || ''; const lastName = $('#register-last-name')?.value || ''; write(keys.profile, { name: `${firstName} ${lastName}`.trim() || 'Usuario Fanaticos', username: `${firstName} ${lastName}`.trim() || 'Usuario Fanaticos', firstName, lastName, email: $('input[type="email"]', event.currentTarget)?.value || '', password, phone: $('#register-phone')?.value || '', city: $('#register-city')?.value || '', country: $('#register-country')?.value || 'Colombia', birthDate, registeredAt: Date.now() }); }, true);
    $$('[data-auth-tab]').forEach(tab => on(tab, 'click', () => { const register = tab.dataset.authTab === 'register'; const nextForm = register ? $('#register-form') : $('#login-form'); $$('[data-auth-tab]').forEach(item => item.classList.toggle('active', item === tab)); $('#login-form')?.classList.toggle('is-hidden', register); $('#register-form')?.classList.toggle('is-hidden', !register); $('#auth-heading').textContent = register ? 'Crea tu cuenta' : 'Entra al juego'; nextForm?.classList.remove('auth-form-enter'); void nextForm?.offsetWidth; nextForm?.classList.add('auth-form-enter'); }));
    on('#login-form', 'submit', event => { event.preventDefault(); enter('Sesion demo iniciada'); }); on('#register-form', 'submit', event => { event.preventDefault(); enter('Cuenta demo creada'); }); on('#guest-access', 'click', () => enter('Estas explorando Fanaticos 360', false)); $$('[data-social]').forEach(button => on(button, 'click', () => enter(`Continuar con ${button.dataset.social} en modo demo`))); on('#auth-button', 'click', () => auth?.classList.remove('is-hidden')); on('#auth-close', 'click', () => auth?.classList.add('is-hidden'));
    if (localStorage.getItem(keys.theme) === 'light') document.body.classList.add('theme-light'); on('#theme-toggle', 'click', () => { document.body.classList.toggle('theme-light'); localStorage.setItem(keys.theme, document.body.classList.contains('theme-light') ? 'light' : 'dark'); });
  }

  function init() {
    $$('img[src="assets/app.png"]').forEach(image => image.src = 'app.png');
    $$('img[src="assets/f360-logo.png"]').forEach(image => image.src = 'f360-logo.png');
    setupProfileIcons();
    setupSocialButtons();
    catalog.render(); slip.render(); renderHistory(); setupNavigation(); setupEvents(); setupAccount(); setupAuthAndTheme();
    loadRealMatches().catch(() => { updateLiveTicker(); toast('No se pudo actualizar el calendario; mostrando partidos de respaldo.'); });
    setInterval(() => loadRealMatches({ liveOnly: true }).catch(() => updateLiveTicker()), 30000);
    $$('.reveal').forEach(item => item.classList.add('visible'));
    on('#close-slip', 'click', closePanels); on('#scrim', 'click', closePanels); $$('[data-close-panel]').forEach(button => on(button, 'click', closePanels)); on('#place-bet', 'click', () => slip.confirm()); on('#stake', 'input', () => slip.render());
    const profile = read(keys.profile, null); if (profile) { $('#profile-title').textContent = profile.name; $('#profile-name').value = profile.name; $('#profile-email').value = profile.email; }
    const splash = $('#app-splash'); if (splash) setTimeout(() => splash.classList.add('is-hidden'), matchMedia('(prefers-reduced-motion: reduce)').matches ? 250 : 1500);
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init, { once: true }) : init();
})();
