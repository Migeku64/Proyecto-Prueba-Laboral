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

  const resetMarker = 'fanaticos-data-reset-3.18';
  if (localStorage.getItem(resetMarker) !== 'done') {
    Object.keys(localStorage).filter(key => key.startsWith('fanaticos-')).forEach(key => localStorage.removeItem(key));
    sessionStorage.clear();
    localStorage.setItem(resetMarker, 'done');
  }
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

  function updateBonusVisibility() {
    $('.promo-card')?.classList.toggle('is-hidden', localStorage.getItem('fanaticos-bonus-claimed') === 'true');
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
      const stake = Number($('#stake')?.value) || 0;
      if (stake < 1000) return toast('El monto mínimo para apostar es de $ 1.000');
      if (stake > state.balance) { openPanel($('#bet-slip')); return toast(`Saldo insuficiente. Tienes ${money(state.balance)} disponibles; reduce el monto o recarga saldo.`); }
      const bets = footballBets();
      state.balance -= stake;
      localStorage.setItem(keys.balance, state.balance);
      $('#balance-amount').textContent = money(state.balance);
      $('#deposit-balance').textContent = money(state.balance);
      bets.unshift({ matches: state.picks.map(pick => pick.match).join(' + '), selections: state.picks.length, stake: money(stake), potential: $('#potential-win')?.textContent || '$ 0', status: 'Confirmada', sport: 'football', date: new Date().toLocaleDateString('es-CO'), createdAt: Date.now() });
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

  function convertPhoneField(container, id, countryId) {
    const input = $(`#${id}`, container);
    if (!input) return;
    const codes = { Colombia: '+57', Argentina: '+54', Chile: '+56', Ecuador: '+593', Mexico: '+52', Peru: '+51', Venezuela: '+58' };
    const control = document.createElement('div');
    control.className = 'phone-control';
    control.innerHTML = `<select id="${id}-code" aria-label="Código de país"><option value="+57">+57</option><option value="+54">+54</option><option value="+56">+56</option><option value="+593">+593</option><option value="+52">+52</option><option value="+51">+51</option><option value="+58">+58</option></select>`;
    input.type = 'tel'; input.inputMode = 'numeric'; input.pattern = '[0-9]*'; input.maxLength = 15; input.placeholder = '300 000 0000'; input.addEventListener('input', () => { input.value = input.value.replace(/\D/g, ''); });
    input.replaceWith(control); control.appendChild(input);
    const country = $(`#${countryId}`, container); const code = $(`#${id}-code`, container);
    const syncCode = () => { if (codes[country?.value]) code.value = codes[country.value]; };
    country?.addEventListener('change', syncCode); syncCode();
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
    convertPhoneField(extras, 'register-phone', 'register-country');
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
      const country = $('#profile-country'); const city = $('#profile-city'); if (country && city) { country.dispatchEvent(new Event('change')); if ([...city.options].some(option => option.value === profile.city)) city.value = profile.city; } if ($('#profile-phone-code') && profile.phoneCode) $('#profile-phone-code').value = profile.phoneCode;
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
    convertPhoneField(extras, 'profile-phone', 'profile-country');
  }

  function profileFromForm() {
    const old = read(keys.profile, {});
    const documentValue = $('#profile-document')?.value.trim() || '';
    return { ...old, name: $('#profile-name').value, email: $('#profile-email').value, username: $('#profile-username')?.value || old.username || $('#profile-name').value, firstName: $('#profile-first-name')?.value || old.firstName || '', lastName: $('#profile-last-name')?.value || old.lastName || '', phone: $('#profile-phone')?.value || old.phone || '', phoneCode: $('#profile-phone-code')?.value || old.phoneCode || '+57', city: $('#profile-city')?.value || old.city || '', country: $('#profile-country')?.value || old.country || 'Colombia', birthDate: $('#profile-birth-date')?.value || old.birthDate || '', documentType: old.documentType || 'CC', document: documentValue.replace(new RegExp(`^${old.documentType || 'CC'}\\s*`, 'i'), '') };
  }

  function showProfileConfirmation(profile) {
    const onlyLetters = value => /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+(?: [A-Za-zÁÉÍÓÚáéíóúÑñÜü]+)*$/.test(String(value || '').trim());
    if ((profile.firstName && !onlyLetters(profile.firstName)) || (profile.lastName && !onlyLetters(profile.lastName))) { toast('Nombres y apellidos solo pueden contener letras y espacios.'); return; }
    let box = $('#profile-confirmation');
    if (!box) { box = document.createElement('div'); box.id = 'profile-confirmation'; box.className = 'profile-confirmation'; $('#profile-form')?.appendChild(box); }
    box.innerHTML = '<strong>¿Guardar cambios?</strong><small>Confirma para actualizar tus datos.</small><div><button type="button" class="confirm-save" id="confirm-profile-save">✓ Confirmar</button><button type="button" class="cancel-save" id="cancel-profile-save">× Cancelar</button></div>';
    box.classList.add('show');
    on('#confirm-profile-save', 'click', () => { write(keys.profile, profile); renderProfile(profile); box.classList.remove('show'); closePanels(); toast('Perfil actualizado correctamente'); });
    on('#cancel-profile-save', 'click', () => { renderProfile(read(keys.profile, null)); box.classList.remove('show'); toast('Cambios cancelados'); });
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
    const paymentCards = () => read('fanaticos-payments', []);
    const renderDepositMethods = () => { let wrap = $('#deposit-payment-method'); if (!wrap) { wrap = document.createElement('div'); wrap.id = 'deposit-payment-method'; wrap.className = 'deposit-payment-method'; $('#deposit-amount')?.closest('label')?.before(wrap); } const list = paymentCards(); if (!list.length) { wrap.innerHTML = '<strong>No tienes una tarjeta agregada.</strong><small>Agrega un metodo de pago en tu perfil antes de recargar saldo.</small><button type="button" class="outline-button full" id="go-add-payment">Agregar tarjeta</button>'; on('#go-add-payment', 'click', () => { closePanels(); openPanel($('#profile-panel')); setTimeout(() => $('#add-payment')?.click(), 120); }); return false; } wrap.innerHTML = `<label>Metodo de pago<select id="deposit-payment-select">${list.map(card => `<option value="${card.id}">${card.brand} ···· ${card.last4}${card.holder ? ` · ${card.holder}` : ''}</option>`).join('')}</select></label><small>Selecciona la tarjeta que se usara para esta recarga.</small>`; return true; };
    on('#deposit-button', 'click', () => { refresh(); openPanel($('#deposit-panel')); renderDepositMethods(); });
    $$('[data-action="bonus"]').forEach(button => on(button, 'click', () => { if (!state.authenticated) return promptLogin('Inicia sesión para reclamar el bono de bienvenida.'); if (localStorage.getItem('fanaticos-bonus-claimed') === 'true') return updateBonusVisibility(); const bonus = 100000; state.balance += bonus; localStorage.setItem(keys.balance, state.balance); localStorage.setItem('fanaticos-bonus-claimed', 'true'); updateBonusVisibility(); refresh(); toast('Bono de bienvenida agregado: $ 100.000'); }));
    $$('[data-amount]').forEach(button => on(button, 'click', () => { $$('[data-amount]').forEach(item => item.classList.remove('active')); button.classList.add('active'); $('#deposit-amount').value = button.dataset.amount; }));
    on('#confirm-deposit', 'click', () => { const amount = Number($('#deposit-amount')?.value) || 0; if (!paymentCards().length) return toast('Primero agrega una tarjeta en Métodos de pago.'); if (!$('#deposit-payment-select')?.value) return toast('Escoge un metodo de pago.'); if (amount < 1000) return toast('Ingresa un monto minimo de $1.000'); state.balance += amount; localStorage.setItem(keys.balance, state.balance); refresh(); closePanels(); toast('Recarga demo agregada a tu saldo'); });
    on('#profile-form', 'submit', event => { event.preventDefault(); const old = read(keys.profile, {}); const profile = { ...old, name: $('#profile-name').value, email: $('#profile-email').value, username: $('#profile-username')?.value || old.username || $('#profile-name').value, firstName: $('#profile-first-name')?.value || old.firstName || '', lastName: $('#profile-last-name')?.value || old.lastName || '', phone: $('#profile-phone')?.value || old.phone || '', city: $('#profile-city')?.value || old.city || '', country: $('#profile-country')?.value || old.country || '', birthDate: $('#profile-birth-date')?.value || old.birthDate || '' }; write(keys.profile, profile); renderProfile(profile); closePanels(); toast('Perfil guardado correctamente'); });
    $$('[data-bet-tab]').forEach(tab => on(tab, 'click', () => { $$('[data-bet-tab]').forEach(item => item.classList.toggle('active', item === tab)); renderHistory(); }));
    on('#logout-button', 'click', () => { state.authenticated = false; sessionStorage.removeItem(keys.session); const authButton = $('#auth-button'); if (authButton) { authButton.textContent = 'Iniciar sesion'; authButton.classList.remove('is-authenticated'); } closePanels(); $('#auth-screen')?.classList.remove('is-hidden'); toast('Sesion cerrada'); });
    setupExtendedProfile(); on('#profile-form', 'submit', event => { event.preventDefault(); event.stopImmediatePropagation(); showProfileConfirmation(profileFromForm()); }, true); renderProfile(); updateBonusVisibility(); refresh();
  }

  function setupAuthAndTheme() {
    const auth = $('#auth-screen'); const shell = $('.app-shell'); setupExtendedRegistration();
    const refreshAuthButton = () => { let button = $('#auth-button'); if (!button) return; const profile = read(keys.profile, null); if (state.authenticated && button.tagName === 'BUTTON') { const visual = document.createElement('span'); visual.id = 'auth-button'; visual.className = button.className; button.replaceWith(visual); button = visual; } button.textContent = state.authenticated ? (profile?.username || 'Mi perfil') : 'Iniciar sesion'; button.classList.toggle('is-authenticated', state.authenticated); };
    const enter = (message, authenticated = true) => { auth?.classList.add('is-hidden'); shell?.classList.remove('app-locked'); state.authenticated = authenticated; if (authenticated) sessionStorage.setItem(keys.session, 'true'); else sessionStorage.removeItem(keys.session); refreshAuthButton(); if (message) toast(message); };
    if (state.authenticated) enter(); else refreshAuthButton();
    on('#login-form', 'submit', event => { const profile = read(keys.profile, null); const email = $('input[type="email"]', event.currentTarget)?.value.trim().toLowerCase() || ''; const password = $('input[type="password"]', event.currentTarget)?.value || ''; if (!profile || email !== String(profile.email || '').trim().toLowerCase() || password !== String(profile.password || '')) { event.preventDefault(); event.stopImmediatePropagation(); toast('Correo o contraseña incorrectos'); } }, true);
    on('#register-form', 'submit', event => { const birthDate = $('#register-birth-date')?.value; const password = $('input[type="password"]', event.currentTarget)?.value || ''; const confirmation = $('#register-password-confirm')?.value || ''; if (password !== confirmation) { event.preventDefault(); event.stopImmediatePropagation(); return toast('Las contraseñas no coinciden'); } if (!isAdult(birthDate) || !$('#register-terms')?.checked || !$('#register-adult')?.checked) { event.preventDefault(); event.stopImmediatePropagation(); toast(!isAdult(birthDate) ? 'Debes ser mayor de 18 años para registrarte' : 'Acepta los terminos y confirma tu edad'); return; } const firstName = $('#register-first-name')?.value || ''; const lastName = $('#register-last-name')?.value || ''; write(keys.profile, { name: `${firstName} ${lastName}`.trim() || 'Usuario Fanaticos', username: `${firstName} ${lastName}`.trim() || 'Usuario Fanaticos', firstName, lastName, email: $('input[type="email"]', event.currentTarget)?.value || '', password, phone: $('#register-phone')?.value || '', city: $('#register-city')?.value || '', country: $('#register-country')?.value || 'Colombia', birthDate, registeredAt: Date.now() }); }, true);
    $$('[data-auth-tab]').forEach(tab => on(tab, 'click', () => { const register = tab.dataset.authTab === 'register'; const nextForm = register ? $('#register-form') : $('#login-form'); $$('[data-auth-tab]').forEach(item => item.classList.toggle('active', item === tab)); $('#login-form')?.classList.toggle('is-hidden', register); $('#register-form')?.classList.toggle('is-hidden', !register); $('#auth-heading').textContent = register ? 'Crea tu cuenta' : 'Entra al juego'; nextForm?.classList.remove('auth-form-enter'); void nextForm?.offsetWidth; nextForm?.classList.add('auth-form-enter'); }));
    on('#login-form', 'submit', event => { event.preventDefault(); enter('Sesion demo iniciada'); }); on('#register-form', 'submit', event => { event.preventDefault(); enter('Cuenta demo creada'); }); on('#guest-access', 'click', () => enter('Estas explorando Fanaticos 360', false)); $$('[data-social]').forEach(button => on(button, 'click', () => enter(`Continuar con ${button.dataset.social} en modo demo`))); on('#auth-button', 'click', () => { if (!state.authenticated) auth?.classList.remove('is-hidden'); }); on('#auth-close', 'click', () => auth?.classList.add('is-hidden'));
    if (localStorage.getItem(keys.theme) === 'light') document.body.classList.add('theme-light'); on('#theme-toggle', 'click', () => { document.body.classList.toggle('theme-light'); localStorage.setItem(keys.theme, document.body.classList.contains('theme-light') ? 'light' : 'dark'); });
  }

  function setupSecurityAndPayments() {
    const strength = value => { let score = 0; if (value.length >= 8) score += 1; if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1; if (/\d/.test(value)) score += 1; if (/[^A-Za-z0-9]/.test(value)) score += 1; return score; };
    const validName = value => /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+(?: [A-Za-zÁÉÍÓÚáéíóúÑñÜü]+)*$/.test(value.trim());
    const password = $('#register-password');
    const gmailOnly = input => { if (!input) return; input.pattern = '[A-Za-z0-9._%+-]+@gmail\\.com'; input.title = 'Usa un correo que termine en @gmail.com'; };
    gmailOnly($('#login-email')); gmailOnly($('#register-email')); gmailOnly($('#profile-email'));
    const validGmail = value => /^[^\s@]+@gmail\.com$/i.test(String(value || '').trim());
    on('#login-form', 'submit', event => { const email = $('#login-email')?.value.trim() || ''; if (!validGmail(email)) { event.preventDefault(); event.stopImmediatePropagation(); toast('Solo se permiten correos terminados en @gmail.com.'); } }, true);
    on('#login-form', 'submit', event => { const email = $('#login-email')?.value.trim().toLowerCase() || ''; const passwordValue = $('#login-password')?.value || ''; const oldProfile = read(keys.profile, null); const users = read('fanaticos-users', []); const accounts = users.length ? users : (oldProfile ? [oldProfile] : []); const account = accounts.find(item => String(item.email || '').trim().toLowerCase() === email && String(item.password || '') === passwordValue); if (!account) { event.preventDefault(); event.stopImmediatePropagation(); toast('Correo o contrasena incorrectos.'); return; } write(keys.profile, account); }, true);
    on('#register-form', 'submit', event => { const email = $('#register-email')?.value.trim() || ''; if (!validGmail(email)) { event.preventDefault(); event.stopImmediatePropagation(); const message = $('#register-error'); if (message) message.textContent = 'El correo debe terminar en @gmail.com.'; toast('El correo debe terminar en @gmail.com.'); } }, true);
    const cleanNameInput = input => { if (!input) return; input.addEventListener('input', () => { input.value = input.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü ]/g, '').replace(/\s{2,}/g, ' '); }); input.addEventListener('paste', event => { event.preventDefault(); const text = (event.clipboardData || window.clipboardData).getData('text'); input.value += text.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü ]/g, ''); input.dispatchEvent(new Event('input', { bubbles: true })); }); };
    cleanNameInput($('#register-first-name')); cleanNameInput($('#register-last-name')); cleanNameInput($('#profile-first-name')); cleanNameInput($('#profile-last-name'));
    const numericOnly = input => { if (!input) return; input.inputMode = 'numeric'; input.pattern = '[0-9]*'; input.addEventListener('input', () => { input.value = input.value.replace(/\D/g, ''); }); input.addEventListener('keydown', event => { if (event.key.length === 1 && !/[0-9]/.test(event.key)) event.preventDefault(); }); };
    numericOnly($('#register-document'));
    const colombianPhone = input => { if (!input) return; input.inputMode = 'numeric'; input.maxLength = 12; input.placeholder = '300 123 4567'; input.addEventListener('input', () => { const digits = input.value.replace(/\D/g, '').slice(0, 10); input.value = digits.replace(/(\d{3})(\d{3})(\d{0,4})/, (_, a, b, c) => [a, b, c].filter(Boolean).join(' ')); }); input.addEventListener('keydown', event => { if (event.key.length === 1 && !/[0-9]/.test(event.key)) event.preventDefault(); }); };
    colombianPhone($('#register-phone')); colombianPhone($('#profile-phone'));
    const addPasswordToggle = input => { if (!input || input.dataset.passwordToggle) return; input.dataset.passwordToggle = 'true'; const button = document.createElement('button'); button.type = 'button'; button.className = 'password-toggle'; button.textContent = 'Mostrar'; button.setAttribute('aria-label', 'Mostrar contrasena'); input.insertAdjacentElement('afterend', button); button.addEventListener('click', () => { const visible = input.type === 'text'; input.type = visible ? 'password' : 'text'; button.textContent = visible ? 'Mostrar' : 'Ocultar'; button.setAttribute('aria-label', visible ? 'Mostrar contrasena' : 'Ocultar contrasena'); }); };
    addPasswordToggle($('#login-password')); addPasswordToggle($('#register-password')); addPasswordToggle($('#register-password-confirm'));
    on(password, 'input', () => { const score = strength(password.value); const bar = $('#password-meter-bar'); const text = $('#password-meter-text'); if (!bar || !text) return; bar.style.width = `${score * 25}%`; bar.dataset.level = score < 2 ? 'bad' : score < 4 ? 'medium' : 'good'; text.textContent = score < 2 ? 'Seguridad baja' : score < 4 ? 'Seguridad media' : 'Seguridad alta'; });
    on('#register-form', 'submit', event => {
      const form = event.currentTarget; const names = $('#register-first-name', form)?.value.trim() || ''; const surnames = $('#register-last-name', form)?.value.trim() || ''; const pass = ($('#register-password', form)?.value || '').trim(); const confirm = ($('#register-password-confirm', form)?.value || '').trim(); const documentNumber = $('#register-document', form)?.value.trim() || ''; const phone = $('#register-phone', form)?.value.replace(/\D/g, '') || '';
      const message = $('#register-error'); if (message) message.textContent = ''; const fail = text => { event.preventDefault(); event.stopImmediatePropagation(); if (message) message.textContent = text; toast(text); };
      let accounts = read('fanaticos-users', []); const oldProfile = read(keys.profile, null); if (!accounts.length && oldProfile) { accounts = [oldProfile]; write('fanaticos-users', accounts); }
      const email = $('#register-email', form)?.value.trim().toLowerCase() || ''; if (accounts.some(item => String(item.email || '').trim().toLowerCase() === email)) return fail('Este correo ya esta registrado. Usa otro correo de Gmail.');
      if (!validName(names) || !validName(surnames)) return fail('Nombres y apellidos solo pueden contener letras.');
      if (pass.length < 8 || strength(pass) < 2) return fail('La contrasena debe tener minimo 8 caracteres y mayor seguridad.');
      if (pass !== confirm) return fail('Las contrasenas no coinciden.');
      if (!/^[A-Za-z0-9-]{5,20}$/.test(documentNumber)) return fail('El numero de documento no es valido.');
      if (!/^3\d{9}$/.test(phone)) return fail('El celular debe tener exactamente 10 digitos y comenzar por 3.');
      window.setTimeout(() => { const current = read(keys.profile, {}); const account = { ...current, firstName: names, lastName: surnames, name: `${names} ${surnames}`, username: `${names} ${surnames}`, documentType: $('#register-document-type', form)?.value || 'CC', document: documentNumber, phone }; write(keys.profile, account); const updatedAccounts = read('fanaticos-users', []); if (!updatedAccounts.some(item => String(item.email || '').trim().toLowerCase() === email)) { updatedAccounts.push(account); write('fanaticos-users', updatedAccounts); } }, 0);
    }, true);

    const hydrateDocument = () => { const current = read(keys.profile, null); if (current && $('#profile-document')) $('#profile-document').value = `${current.documentType || ''} ${current.document || ''}`.trim(); };
    hydrateDocument();
    const setEditing = editing => { $$('#profile-fields input').forEach(input => { input.readOnly = !editing; }); $$('#profile-fields select').forEach(select => { select.disabled = !editing; }); $('#edit-profile')?.classList.toggle('is-hidden', editing); $('#save-profile')?.classList.toggle('is-hidden', !editing); $('#cancel-profile')?.classList.toggle('is-hidden', !editing); };
    on('#edit-profile', 'click', () => setEditing(true));
    on('#profile-form', 'submit', event => { const firstName = $('#profile-first-name')?.value.trim() || ''; const lastName = $('#profile-last-name')?.value.trim() || ''; const email = $('#profile-email')?.value.trim() || ''; const phone = ($('#profile-phone')?.value || '').replace(/\D/g, ''); if (!validGmail(email)) { event.preventDefault(); event.stopImmediatePropagation(); toast('El correo debe terminar en @gmail.com.'); return; } if ((firstName && !validName(firstName)) || (lastName && !validName(lastName))) { event.preventDefault(); event.stopImmediatePropagation(); toast('Nombres y apellidos solo pueden contener letras y espacios.'); return; } if (phone && !/^3\d{9}$/.test(phone)) { event.preventDefault(); event.stopImmediatePropagation(); toast('El celular debe tener exactamente 10 digitos y comenzar por 3.'); } }, true);
    on('#register-password-confirm', 'input', () => { const message = $('#register-error'); const pass = $('#register-password')?.value.trim() || ''; const confirm = $('#register-password-confirm')?.value.trim() || ''; if (message && (!confirm || pass === confirm)) message.textContent = ''; else if (message) message.textContent = 'Las contrasenas no coinciden.'; });
    on('#cancel-profile', 'click', () => { renderProfile(read(keys.profile, null)); setEditing(false); toast('Cambios cancelados'); });
    on(document, 'click', event => { if (event.target.closest('#confirm-profile-save')) { setEditing(false); hydrateDocument(); } });

    const paymentKey = 'fanaticos-payments'; const cards = () => read(paymentKey, []); const brand = number => /^4/.test(number) ? 'VISA' : /^(5[1-5]|2)/.test(number) ? 'MASTERCARD' : 'TARJETA';
    const renderPayments = () => { const target = $('#saved-payments'); if (!target) return; const list = cards(); target.innerHTML = list.length ? list.map(card => `<article class="saved-payment"><strong>${card.brand} ···· ${card.last4}</strong><small>Vence ${card.expiry}</small><button type="button" data-remove-payment="${card.id}" aria-label="Eliminar tarjeta">&times;</button></article>`).join('') : '<div class="empty-payment">No tienes metodos de pago guardados.</div>'; $$('[data-remove-payment]', target).forEach(button => on(button, 'click', () => { write(paymentKey, cards().filter(card => card.id !== button.dataset.removePayment)); renderPayments(); toast('Metodo de pago eliminado'); })); };
    on('#add-payment', 'click', () => { if (!state.authenticated) return promptLogin('Inicia sesion para agregar una tarjeta.'); $('#payment-dialog')?.showModal(); });
    on('#payment-form', 'submit', event => { event.preventDefault(); const number = $('#card-number').value.replace(/\D/g, ''); const expiry = $('#card-expiry').value.trim(); const cvv = $('#card-cvv').value.trim(); const message = $('#payment-error'); const fail = text => { if (message) message.textContent = text; toast(text); }; if (!/^\d{16}$/.test(number)) return fail('Ingresa una tarjeta de 16 digitos.'); if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) return fail('Usa el formato MM/AA.'); if (!/^\d{3,4}$/.test(cvv)) return fail('El codigo de seguridad no es valido.'); const list = cards(); list.push({ id: String(Date.now()), brand: brand(number), last4: number.slice(-4), expiry }); write(paymentKey, list); $('#payment-dialog').close(); event.currentTarget.reset(); if (message) message.textContent = ''; renderPayments(); toast('Tarjeta guardada de forma segura'); });
    on('#card-number', 'input', event => { const number = event.target.value.replace(/\D/g, '').slice(0, 16); event.target.value = number.replace(/(.{4})/g, '$1 ').trim(); });
    on('#card-expiry', 'input', event => { const value = event.target.value.replace(/\D/g, '').slice(0, 4); event.target.value = value.length > 2 ? `${value.slice(0, 2)}/${value.slice(2)}` : value; });
    let editingPaymentId = null;
    const decoratePaymentCards = () => { const target = $('#saved-payments'); if (!target) return; $$('.saved-payment', target).forEach(card => { if (card.querySelector('[data-edit-payment]')) return; const remove = card.querySelector('[data-remove-payment]'); if (!remove) return; const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'edit-payment'; edit.dataset.editPayment = remove.dataset.removePayment; edit.textContent = 'Editar'; edit.setAttribute('aria-label', 'Editar tarjeta'); remove.parentElement?.insertBefore(edit, remove); }); };
    const paymentObserver = new MutationObserver(decoratePaymentCards); if ($('#saved-payments')) paymentObserver.observe($('#saved-payments'), { childList: true, subtree: true });
    on(document, 'click', event => { const edit = event.target.closest('[data-edit-payment]'); if (!edit) return; const card = cards().find(item => item.id === edit.dataset.editPayment); if (!card) return; editingPaymentId = card.id; const title = $('.payment-dialog h2'); if (title) title.textContent = 'Editar tarjeta'; $('#card-holder').value = card.holder || ''; $('#card-expiry').value = card.expiry || ''; $('#card-number').value = ''; $('#card-cvv').value = ''; $('#card-number').placeholder = 'Dejar vacio para conservarla'; $('#card-cvv').placeholder = 'No necesario si no cambia'; $('#payment-dialog')?.showModal(); });
    on('#payment-form', 'submit', event => { if (!editingPaymentId) return; event.preventDefault(); event.stopImmediatePropagation(); const list = cards(); const current = list.find(item => item.id === editingPaymentId); const holder = $('#card-holder').value.trim() || current?.holder || 'Tarjeta guardada'; const expiry = $('#card-expiry').value.trim(); const newNumber = $('#card-number').value.replace(/\D/g, ''); const message = $('#payment-error'); if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) { if (message) message.textContent = 'Usa el formato MM/AA.'; return; } if (newNumber && !/^\d{16}$/.test(newNumber)) { if (message) message.textContent = 'La tarjeta debe tener 16 digitos.'; return; } const updated = { ...current, holder, expiry, brand: newNumber ? brand(newNumber) : current.brand, last4: newNumber ? newNumber.slice(-4) : current.last4 }; write(paymentKey, list.map(item => item.id === editingPaymentId ? updated : item)); $('#payment-dialog').close(); event.currentTarget.reset(); editingPaymentId = null; if (message) message.textContent = ''; $('#card-number').placeholder = '0000 0000 0000 0000'; $('#card-cvv').placeholder = 'CVV'; const title = $('.payment-dialog h2'); if (title) title.textContent = 'Agregar tarjeta'; renderPayments(); decoratePaymentCards(); toast('Tarjeta actualizada correctamente'); }, true);
    renderPayments(); decoratePaymentCards();
  }

  function init() {
    $$('img[src="assets/app.png"]').forEach(image => image.src = 'app.png');
    $$('img[src="assets/f360-logo.png"]').forEach(image => image.src = 'f360-logo.png');
    setupProfileIcons();
    setupSocialButtons();
    catalog.render(); slip.render(); renderHistory(); setupNavigation(); setupEvents(); setupAccount(); setupSecurityAndPayments(); setupAuthAndTheme();
    setTimeout(() => loadRealMatches().catch(() => { updateLiveTicker(); toast('No se pudo actualizar el calendario; mostrando partidos de respaldo.'); }), 120);
    setInterval(() => loadRealMatches({ liveOnly: true }).catch(() => updateLiveTicker()), 30000);
    $$('.reveal').forEach(item => item.classList.add('visible'));
    on('#close-slip', 'click', closePanels); on('#scrim', 'click', closePanels); $$('[data-close-panel]').forEach(button => on(button, 'click', closePanels)); on('#place-bet', 'click', () => slip.confirm()); on('#stake', 'input', () => slip.render());
    const profile = read(keys.profile, null); if (profile) { $('#profile-title').textContent = profile.name; $('#profile-name').value = profile.name; $('#profile-email').value = profile.email; }
    const splash = $('#app-splash'); if (splash) setTimeout(() => splash.classList.add('is-hidden'), matchMedia('(prefers-reduced-motion: reduce)').matches ? 180 : 650);
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init, { once: true }) : init();
})();
