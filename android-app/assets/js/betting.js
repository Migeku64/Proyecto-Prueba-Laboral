
(function(){
  const shell=document.querySelector('.app-shell');
  const events=document.querySelector('.events-block');
  const profile=document.querySelector('#profile-panel');
  const bets=document.querySelector('#my-bets-panel');
  const scrim=document.querySelector('#scrim');
  const activate=button=>document.querySelectorAll('.bottom-nav .nav-item').forEach(item=>item.classList.toggle('active',item===button));
  const open=panel=>{if(!panel)return;document.querySelectorAll('.side-panel,.bet-slip').forEach(item=>item.classList.remove('open'));panel.classList.add('open');scrim?.classList.add('show');panel.setAttribute('aria-hidden','false')};
  document.querySelectorAll('.bottom-nav .nav-item[data-view]').forEach(button=>button.addEventListener('click',event=>{
    event.preventDefault();
    activate(button);
    const view=button.dataset.view;
    if(view==='home'){window.scrollTo({top:0,behavior:'smooth'});return}
    if(view==='live'){events?.scrollIntoView({behavior:'smooth',block:'start'});document.querySelector('.market-filter[data-market-filter="principales"]')?.click();return}
    if(view==='profile'){open(profile);return}
    if(view==='bets'){open(bets);return}
  }));
  document.querySelectorAll('.events-list').forEach(list=>list.addEventListener('click',event=>{
    if(event.target.closest('.odd-button'))return;
    const card=event.target.closest('.event-card[data-match-id]');
    if(!card)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const id=card.dataset.matchId;
    document.querySelector(`[data-open-match="${id}"]`)?.click();
  }));
})();
(function(){
  document.addEventListener('click',event=>{
    const button=event.target.closest?.('.bottom-nav .nav-item');
    if(!button)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    document.querySelectorAll('.bottom-nav .nav-item').forEach(item=>item.classList.toggle('active',item===button));
    const view=button.dataset.view|| (button.id==='bet-nav'?'bets':'');
    if(view==='home')window.scrollTo({top:0,behavior:'smooth'});
    if(view==='live')document.querySelector('.events-block')?.scrollIntoView({behavior:'smooth',block:'start'});
    if(view==='profile'){const panel=document.querySelector('#profile-panel');panel?.classList.add('open');document.querySelector('#scrim')?.classList.add('show');}
    if(view==='bets'){const panel=document.querySelector('#my-bets-panel');panel?.classList.add('open');document.querySelector('#scrim')?.classList.add('show');}
  },true);
})();
function toast(message){
  const node=document.querySelector('#toast');
  if(!node)return;
  node.textContent=message;
  node.classList.add('show');
  clearTimeout(node._toastTimer);
  node._toastTimer=setTimeout(()=>node.classList.remove('show'),2200);
}
(function(){
  const close=document.querySelector('#close-slip');
  close?.addEventListener('click',event=>{
    event.preventDefault();
    event.stopImmediatePropagation();
    document.querySelector('#bet-slip')?.classList.remove('open');
    document.querySelector('#bet-slip')?.setAttribute('aria-hidden','true');
    document.querySelector('#scrim')?.classList.remove('show');
  },true);
})();
(function(){
  const historyTab=document.querySelector('[data-bet-tab="history"]');
  historyTab?.addEventListener('click',()=>setTimeout(()=>{
    const list=document.querySelector('#my-bets-list');
    if(!list)return;
    let bets=[];
    try{bets=JSON.parse(localStorage.getItem('fanaticos-bets')||'[]')}catch{}
    if(!bets.length){list.innerHTML='<div class="empty-bets">Todavia no tienes apuestas confirmadas.</div>';return}
    list.innerHTML=bets.map(item=>`<article class="my-bet"><div class="my-bet-head"><strong>${item.matches||'Partido'}</strong><span class="my-bet-status">Confirmada</span></div><small>${item.date||'Hoy'} · ${item.selections||1} seleccion${Number(item.selections)===1?'':'es'}</small><div class="my-bet-meta"><span>Apostado ${item.stake||'$ 0'}</span><b>Ganancia ${item.potential||'$ 0'}</b></div></article>`).join('')
  },0),true);
})();
(function(){
  document.addEventListener('click',event=>{
    const button=event.target.closest?.('#place-bet');
    if(!button)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const rows=[...document.querySelectorAll('#slip-items .slip-item')];
    if(!rows.length){toast('Agrega al menos una seleccion');return}
    let bets=[];
    try{bets=JSON.parse(localStorage.getItem('fanaticos-bets')||'[]')}catch{}
    bets.unshift({matches:rows.map(row=>row.querySelector('strong')?.textContent||'Partido').join(' + '),selections:rows.length,stake:'$ '+Math.round(Number(document.querySelector('#stake')?.value)||0).toLocaleString('es-CO'),potential:document.querySelector('#potential-win')?.textContent||'$ 0',status:'Confirmada',date:new Date().toLocaleDateString('es-CO')});
    localStorage.setItem('fanaticos-bets',JSON.stringify(bets));
    document.querySelector('#slip-items').innerHTML='<div class="empty-slip">Selecciona una cuota para comenzar.</div>';
    document.querySelector('#bet-count').textContent='0';
    document.querySelector('#bet-slip')?.classList.remove('open');
    document.querySelector('#scrim')?.classList.remove('show');
    toast('Apuesta confirmada y guardada en el historial');
  },true);
})();
(function(){
  const panel=document.querySelector('#match-detail'),scrim=document.querySelector('#scrim');
  if(panel&&!document.querySelector('#detail-title')){const title=document.createElement('strong');title.id='detail-title';title.textContent='Copa Fanaticos';panel.querySelector('.match-topbar > div')?.appendChild(title)}
  const games={
    'real-barca':['La Liga','Real Madrid','Barcelona'],
    'lakers-celtics':['NBA','Lakers','Celtics'],
    'sinner-alcaraz':['ATP Finals','J. Sinner','C. Alcaraz'],
    'city-arsenal':['Premier League','Man. City','Arsenal'],
    'warriors-bulls':['NBA','Warriors','Bulls'],
    'inter-juve':['Serie A','Inter Milan','Juventus'],
    'psg-marseille':['Ligue 1','PSG','Marseille'],
    'bayern-dortmund':['Bundesliga','Bayern Munich','Borussia Dortmund'],
    'america-chivas':['Liga MX','America','Chivas'],
    'chiefs-eagles':['NFL','Chiefs','Eagles']
  };
  const show=id=>{const game=games[id];if(!game||!panel)return;const [league,home,away]=game;const markets={Principales:[[home,'2.10'],['Empate','3.40'],[away,'3.05']],Goles:[['Mas 2.5','1.68'],['Menos 2.5','2.05'],['Ambos marcan','1.72']],Corners:[['Mas 8.5','1.80'],['Menos 8.5','1.92']],Mitad:[[home+' 1T','2.10'],['Empate','2.20'],[away+' 1T','3.15']]};
    document.querySelector('#detail-league').textContent=league.toUpperCase();document.querySelector('#detail-title').textContent=home+' vs '+away;document.querySelector('#detail-home').textContent=home;document.querySelector('#detail-away').textContent=away;document.querySelector('#detail-home-badge').textContent=home[0];document.querySelector('#detail-away-badge').textContent=away[0];document.querySelector('#detail-score').textContent='- -';document.querySelector('#detail-time').textContent='Proximo';document.querySelector('#detail-event-state').textContent='◌ Sigue el partido';document.querySelector('#detail-meta').innerHTML='<strong>'+league+'</strong><br>Selecciona una cuota para añadirla al boleto.';
    document.querySelector('#detail-markets').innerHTML=Object.entries(markets).map(([name,odds])=>'<section><div class="detail-market-title"><span>'+name+'</span><small>Cuotas</small></div><div class="detail-odds">'+odds.map((odd,index)=>'<button class="detail-odd" data-safe-choice="'+odd[0]+'" data-safe-odd="'+odd[1]+'"><small>'+odd[0]+'</small><br>'+odd[1]+'</button>').join('')+'</div></section>').join('');panel.classList.add('open');scrim?.classList.add('show');panel.setAttribute('aria-hidden','false');
    panel.querySelectorAll('[data-safe-choice]').forEach(button=>button.addEventListener('click',()=>{const list=document.querySelector('#slip-items');if(!list)return;list.querySelector('.empty-slip')?.remove();const item=document.createElement('div');item.className='slip-item';item.innerHTML='<div><strong>'+home+' vs '+away+'</strong><small>'+button.dataset.safeChoice+' · Cuota seleccionada</small></div><div><b>'+button.dataset.safeOdd+'</b></div>';list.appendChild(item);const count=document.querySelector('#bet-count');const ticker=document.querySelector('#ticker-bet-count');if(count)count.textContent=Number(count.textContent||0)+1;if(ticker&&count)ticker.textContent=count.textContent;panel.classList.remove('open');scrim?.classList.remove('show');document.querySelector('#bet-slip')?.classList.add('open');}));
  };
  document.addEventListener('click',event=>{const card=event.target.closest?.('[data-match-id],[data-open-match]');if(!card||event.target.closest('.odd-button'))return;event.preventDefault();event.stopImmediatePropagation();show(card.dataset.matchId||card.dataset.openMatch);},true);
})();
(function(){
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ticker=document.querySelector('#ticker-copy');
  const messages=['Mercados en vivo cada minuto','Las cuotas se actualizan en tiempo real','Elige tu mercado y arma tu boleto'];
  let messageIndex=0;
  if(ticker&&!reduced)setInterval(()=>{ticker.style.opacity='0';setTimeout(()=>{messageIndex=(messageIndex+1)%messages.length;ticker.textContent=messages[messageIndex];ticker.style.opacity='1'},220)},3600);
  const revealItems=document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}}),{threshold:.14});revealItems.forEach(item=>observer.observe(item))}else revealItems.forEach(item=>item.classList.add('visible'));
  if(!reduced)document.querySelectorAll('.promo-card,.event-card').forEach(card=>card.addEventListener('pointermove',event=>{const box=card.getBoundingClientRect();const x=(event.clientX-box.left)/box.width-.5;const y=(event.clientY-box.top)/box.height-.5;card.style.transform=`perspective(700px) rotateX(${y*-2}deg) rotateY(${x*2}deg) translateY(-3px)`;card.style.setProperty('--pointer-x',`${(x+.5)*100}%`)}));
  document.querySelectorAll('.promo-card,.event-card').forEach(card=>card.addEventListener('pointerleave',()=>{card.style.transform=''}));
})();
(function(){
  const themeKey='fanaticos-theme';const betsKey='fanaticos-bets';const profileKey='fanaticos-profile';let currentTab='active';const toast=message=>{const node=document.querySelector('#toast');if(!node)return;node.textContent=message;node.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>node.classList.remove('show'),2200)};
  const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))||fallback}catch{return fallback}};const save=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
  const themeButton=document.querySelector('#theme-toggle');const myPanel=document.querySelector('#my-bets-panel');const profilePanel=document.querySelector('#profile-panel');const scrim=document.querySelector('#scrim');
  if(localStorage.getItem(themeKey)==='light')document.body.classList.add('theme-light');
  themeButton?.addEventListener('click',()=>{document.body.classList.toggle('theme-light');localStorage.setItem(themeKey,document.body.classList.contains('theme-light')?'light':'dark');themeButton.innerHTML=document.body.classList.contains('theme-light')?'&#9790;':'&#9788;';});
  const openPanel=panel=>{document.querySelectorAll('.side-panel,.bet-slip').forEach(item=>item.classList.remove('open'));panel.classList.add('open');scrim.classList.add('show');panel.setAttribute('aria-hidden','false')};const closePanels=()=>{document.querySelectorAll('.side-panel,.bet-slip').forEach(item=>{item.classList.remove('open');item.setAttribute('aria-hidden','true')});scrim.classList.remove('show')};
  document.querySelector('#profile-button')?.addEventListener('click',()=>openPanel(profilePanel));document.querySelectorAll('[data-close-panel]').forEach(button=>button.addEventListener('click',closePanels));
  const profile=read(profileKey,null);if(profile){document.querySelector('#profile-title').textContent=profile.name;document.querySelector('#profile-name').value=profile.name;document.querySelector('#profile-email').value=profile.email;document.querySelector('#profile-password').required=false;document.querySelector('#profile-password').placeholder='Dejar vacio para conservarla'}
  document.querySelector('#profile-form')?.addEventListener('submit',event=>{event.preventDefault();const data={name:document.querySelector('#profile-name').value,email:document.querySelector('#profile-email').value};save(profileKey,data);document.querySelector('#profile-title').textContent=data.name;toast('Perfil guardado correctamente');setTimeout(closePanels,400)});document.querySelector('#logout-button')?.addEventListener('click',()=>{localStorage.removeItem(profileKey);document.querySelector('#profile-form').reset();document.querySelector('#profile-title').textContent='Crea tu perfil';toast('Sesion cerrada')});
  const renderBets=()=>{const list=document.querySelector('#my-bets-list');const bets=read(betsKey,[]).filter(item=>currentTab==='history'?item.status==='Finalizada':item.status==='Pendiente');if(!bets.length){list.innerHTML=`<div class="empty-bets">${currentTab==='history'?'Todavia no tienes apuestas finalizadas.':'Tus apuestas activas apareceran aqui al confirmar un boleto.'}</div>`;return}list.innerHTML=bets.map(item=>`<article class="my-bet"><div class="my-bet-head"><strong>${item.matches}</strong><span class="my-bet-status">${item.status}</span></div><small>${item.date} · ${item.selections} seleccion${item.selections===1?'':'es'}</small><div class="my-bet-meta"><span>Apostado ${item.stake}</span><b>Ganancia ${item.potential}</b></div></article>`).join('')};
  document.querySelectorAll('[data-bet-tab]').forEach(tab=>tab.addEventListener('click',()=>{currentTab=tab.dataset.betTab==='history'?'history':'active';document.querySelectorAll('[data-bet-tab]').forEach(item=>item.classList.toggle('active',item===tab));renderBets()}));
  const betNav=document.querySelector('#bet-nav');betNav?.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();openPanel(myPanel);renderBets()},true);document.querySelector('#open-slip')?.addEventListener('click',()=>{document.querySelector('#bet-slip').classList.add('open');scrim.classList.add('show')});
  document.querySelector('#place-bet')?.addEventListener('click',()=>{const rows=[...document.querySelectorAll('.slip-item')];if(!rows.length)return;const bets=read(betsKey,[]);const stake=Number(document.querySelector('#stake').value)||0;bets.unshift({matches:rows.map(row=>row.querySelector('strong')?.textContent||'Partido').join(' + '),selections:rows.length,stake:'$ '+Math.round(stake).toLocaleString('es-CO'),potential:document.querySelector('#potential-win').textContent,status:'Pendiente',date:new Date().toLocaleDateString('es-CO')});save(betsKey,bets);renderBets()},true);
  renderBets();
})();
(function(){const panelScrim=document.querySelector('#scrim');if(panelScrim)panelScrim.addEventListener('click',()=>{document.querySelectorAll('.side-panel').forEach(item=>item.classList.remove('open'));panelScrim.classList.remove('show')})})();
(function(){const splash=document.querySelector('#app-splash');if(!splash)return;const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;window.setTimeout(()=>splash.classList.add('is-hidden'),reduce?250:1500)})();
(function(){
  const toast=message=>{const node=document.querySelector('#toast');if(!node)return;node.textContent=message;node.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>node.classList.remove('show'),2200)};
  const auth=document.querySelector('#auth-screen');const shell=document.querySelector('.app-shell');const sessionKey='fanaticos-auth-session';
  const enterApp=message=>{auth.classList.add('is-hidden');shell.classList.remove('app-locked');sessionStorage.setItem(sessionKey,'true');if(message)toast(message)};
  if(sessionStorage.getItem(sessionKey)==='true'){auth.classList.add('is-hidden');shell.classList.remove('app-locked')}
  document.querySelectorAll('[data-auth-tab]').forEach(tab=>tab.addEventListener('click',()=>{document.querySelectorAll('[data-auth-tab]').forEach(item=>item.classList.toggle('active',item===tab));const register=tab.dataset.authTab==='register';document.querySelector('#login-form').classList.toggle('is-hidden',register);document.querySelector('#register-form').classList.toggle('is-hidden',!register);document.querySelector('#auth-heading').textContent=register?'Crea tu cuenta':'Entra al juego'}));
  document.querySelector('#login-form')?.addEventListener('submit',event=>{event.preventDefault();enterApp('Sesion demo iniciada')});document.querySelector('#register-form')?.addEventListener('submit',event=>{event.preventDefault();enterApp('Cuenta demo creada')});document.querySelector('#guest-access')?.addEventListener('click',()=>enterApp('Estas explorando Fanaticos 360'));document.querySelectorAll('[data-social]').forEach(button=>button.addEventListener('click',()=>enterApp(`Continuar con ${button.dataset.social} en modo demo`)));
  const catalog=[
    {id:'real-barca',sport:'football',league:'La Liga',state:'Proximo',home:'Real Madrid',away:'Barcelona',markets:{principales:[['1','2.10'],['X','3.40'],['2','3.05']],goles:[['Mas 2.5','1.68'],['Menos 2.5','2.05'],['Mas 3.5','2.65']],corners:[['Mas 8.5','1.80'],['Menos 8.5','1.92'],['Mas 10.5','2.25']],mitad:[['RM gana','2.55'],['Empate','2.05'],['BAR gana','3.60']]}},
    {id:'lakers-celtics',sport:'basketball',league:'NBA',state:'EN VIVO 2T',home:'Lakers',away:'Celtics',markets:{principales:[['LAL','1.85'],['Spread','1.90'],['BOS','2.20']],goles:[['Mas 215.5','1.90'],['Menos 215.5','1.90'],['Mas 225.5','2.35']],corners:[['LAL +5.5','1.75'],['BOS -5.5','2.05'],['Empate','12.0']],mitad:[['LAL 1T','1.95'],['Empate','2.80'],['BOS 1T','2.10']]}},
    {id:'sinner-alcaraz',sport:'tennis',league:'ATP Finals',state:'Manana 14:00',home:'J. Sinner',away:'C. Alcaraz',markets:{principales:[['Sinner','1.72'],['Sets','3.50'],['Alcaraz','2.05']],goles:[['2-0','2.20'],['2-1','3.40'],['3 sets','2.05']],corners:[['Mas 9.5','1.85'],['Menos 9.5','1.85'],['Mas 12.5','2.30']],mitad:[['Sinner 1S','1.75'],['Empate','6.00'],['Alcaraz 1S','2.20']]}},
    {id:'city-arsenal',sport:'football',league:'Premier League',state:'Sabado 11:30',home:'Man. City',away:'Arsenal',markets:{principales:[['1','1.88'],['X','3.60'],['2','3.75']],goles:[['Mas 2.5','1.62'],['Menos 2.5','2.18'],['Ambos marcan','1.70']],corners:[['Mas 9.5','1.78'],['Menos 9.5','1.95'],['Mas 11.5','2.45']],mitad:[['City 1T','2.15'],['Empate','2.10'],['Arsenal 1T','3.35']]}},
    {id:'warriors-bulls',sport:'basketball',league:'NBA',state:'Hoy 21:00',home:'Warriors',away:'Bulls',markets:{principales:[['GSW','1.65'],['Spread','1.92'],['CHI','2.55']],goles:[['Mas 220.5','1.88'],['Menos 220.5','1.92'],['Mas 230.5','2.40']],corners:[['GSW +4.5','1.80'],['CHI -4.5','2.00'],['Empate','13.0']],mitad:[['GSW 1T','1.82'],['Empate','2.70'],['CHI 1T','2.35']]}},
    {id:'inter-juve',sport:'football',league:'Serie A',state:'Domingo 14:00',home:'Inter Milan',away:'Juventus',markets:{principales:[['1','1.95'],['X','3.25'],['2','3.90']],goles:[['Mas 2.5','1.85'],['Menos 2.5','1.82'],['Ambos marcan','1.78']],corners:[['Mas 8.5','1.72'],['Menos 8.5','2.05'],['Mas 10.5','2.35']],mitad:[['Inter 1T','2.30'],['Empate','2.00'],['Juve 1T','3.80']]}},
    {id:'psg-marseille',sport:'football',league:'Ligue 1',state:'Sabado 15:00',home:'PSG',away:'Marseille',markets:{principales:[['1','1.55'],['X','4.20'],['2','5.40']],goles:[['Mas 2.5','1.58'],['Menos 2.5','2.25'],['Ambos marcan','1.72']],corners:[['Mas 8.5','1.76'],['Menos 8.5','1.96'],['Mas 10.5','2.30']],mitad:[['PSG 1T','1.85'],['Empate','2.45'],['Marseille 1T','4.80']]}},
    {id:'bayern-dortmund',sport:'football',league:'Bundesliga',state:'Domingo 12:30',home:'Bayern Munich',away:'Borussia Dortmund',markets:{principales:[['1','1.70'],['X','4.10'],['2','4.35']],goles:[['Mas 3.5','1.88'],['Menos 3.5','1.82'],['Ambos marcan','1.62']],corners:[['Mas 9.5','1.80'],['Menos 9.5','1.90'],['Mas 11.5','2.25']],mitad:[['Bayern 1T','1.95'],['Empate','2.40'],['Dortmund 1T','3.90']]}},
    {id:'america-chivas',sport:'football',league:'Liga MX',state:'Viernes 21:00',home:'America',away:'Chivas',markets:{principales:[['1','1.82'],['X','3.45'],['2','4.10']],goles:[['Mas 2.5','1.90'],['Menos 2.5','1.80'],['Ambos marcan','1.85']],corners:[['Mas 8.5','1.74'],['Menos 8.5','2.00'],['Mas 10.5','2.55']],mitad:[['America 1T','2.20'],['Empate','2.10'],['Chivas 1T','3.60']]}},
    {id:'chiefs-eagles',sport:'football',league:'NFL',state:'Lunes 20:15',home:'Chiefs',away:'Eagles',markets:{principales:[['KC','1.78'],['Spread','1.90'],['PHI','2.25']],goles:[['Mas 47.5','1.90'],['Menos 47.5','1.90'],['Mas 54.5','2.45']],corners:[['KC +3.5','1.82'],['PHI -3.5','1.95'],['Empate','12.0']],mitad:[['KC 1T','1.88'],['Empate','3.20'],['PHI 1T','2.15']]}}
  ];
  let sportFilter='all';let marketFilter='principales';const eventsEl=document.querySelector('#events');const detail=document.querySelector('#match-detail');const scrim=document.querySelector('#scrim');
  const currentEvents=()=>catalog.filter(item=>sportFilter==='all'||item.sport===sportFilter);
  const renderCatalog=()=>{eventsEl.innerHTML=currentEvents().map((item,index)=>{const odds=item.markets[marketFilter];return `<article class="event-card" data-match-id="${item.id}" style="animation-delay:${index*70}ms"><div class="event-top"><span class="league">${item.league}</span><span class="event-state">${item.state}</span></div><div class="teams"><span class="team">${item.home}</span><span class="versus">VS</span><span class="team">${item.away}</span></div><div class="odds">${odds.map((odd,oddIndex)=>`<button class="odd-button" data-event="${item.id}" data-odd-index="${oddIndex}"><small>${odd[0]}</small>${odd[1]}</button>`).join('')}</div><small class="event-hint">Toca el partido para ver todos los mercados &#8250;</small></article>`}).join('');eventsEl.querySelectorAll('.odd-button').forEach(button=>button.addEventListener('click',event=>{event.stopPropagation();const source=document.querySelector(`.event-card[data-match-id="${button.dataset.event}"] [data-odd-index="${button.dataset.oddIndex}"]`);source?.classList.add('selected');const match=catalog.find(item=>item.id===button.dataset.event);const odd=match.markets[marketFilter][Number(button.dataset.oddIndex)];const slipItems=document.querySelector('#slip-items');const item=document.createElement('div');item.className='slip-item';item.innerHTML=`<div><strong>${match.home} vs ${match.away}</strong><small>${odd[0]} · ${marketFilter}</small></div><div><b>${odd[1]}</b></div>`;slipItems.querySelector('.empty-slip')?.remove();slipItems.appendChild(item);document.querySelector('#bet-count').textContent=Number(document.querySelector('#bet-count').textContent)+1;document.querySelector('#ticker-bet-count').textContent=document.querySelector('#bet-count').textContent;document.querySelector('#bet-slip').classList.add('open');scrim.classList.add('show');toast('Seleccion agregada al boleto')}));eventsEl.querySelectorAll('[data-match-id]').forEach(card=>card.addEventListener('click',()=>openDetail(catalog.find(item=>item.id===card.dataset.matchId))))};
  const openDetail=match=>{if(!match)return;document.querySelector('#detail-league').textContent=match.league.toUpperCase();document.querySelector('#detail-title').textContent=match.home+' vs '+match.away;document.querySelector('#detail-meta').innerHTML=`<strong>${match.state}</strong><br>Todos los mercados disponibles para este encuentro. Selecciona una cuota para añadirla al boleto.`;document.querySelector('#detail-markets').innerHTML=Object.entries(match.markets).map(([name,odds])=>`<section><div class="detail-market-title"><span>${name==='principales'?'Principales':name==='mitad'?'Primera mitad':name[0].toUpperCase()+name.slice(1)}</span><small>Cuotas</small></div><div class="detail-odds">${odds.map((odd,index)=>`<button class="detail-odd" data-detail-event="${match.id}" data-detail-market="${name}" data-detail-index="${index}"><small>${odd[0]}</small><br>${odd[1]}</button>`).join('')}</div></section>`).join('');detail.classList.add('open');scrim.classList.add('show');detail.setAttribute('aria-hidden','false');detail.querySelectorAll('[data-detail-event]').forEach(button=>button.addEventListener('click',()=>{const odd=match.markets[button.dataset.detailMarket][Number(button.dataset.detailIndex)];const item=document.createElement('div');item.className='slip-item';item.innerHTML=`<div><strong>${match.home} vs ${match.away}</strong><small>${odd[0]} · ${button.dataset.detailMarket}</small></div><div><b>${odd[1]}</b></div>`;document.querySelector('#slip-items .empty-slip')?.remove();document.querySelector('#slip-items').appendChild(item);document.querySelector('#bet-count').textContent=Number(document.querySelector('#bet-count').textContent)+1;document.querySelector('#ticker-bet-count').textContent=document.querySelector('#bet-count').textContent;detail.classList.remove('open');document.querySelector('#bet-slip').classList.add('open');toast('Cuota añadida al boleto')}))};
  document.querySelectorAll('.sport-tab').forEach(tab=>tab.addEventListener('click',()=>{sportFilter=tab.dataset.sport;renderCatalog()}));document.querySelectorAll('.market-filter').forEach(tab=>tab.addEventListener('click',()=>{marketFilter=tab.dataset.marketFilter;document.querySelectorAll('.market-filter').forEach(item=>item.classList.toggle('active',item===tab));renderCatalog()}));document.querySelectorAll('[data-open-match]').forEach(button=>button.addEventListener('click',()=>openDetail(catalog.find(item=>item.id===button.dataset.openMatch))));document.querySelectorAll('.league-card').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('.league-card').forEach(item=>item.classList.remove('active'));button.classList.add('active');toast('Liga seleccionada: '+button.dataset.league)}));document.querySelectorAll('[data-close-panel]').forEach(button=>button.addEventListener('click',()=>{document.querySelector('#match-detail')?.classList.remove('open');scrim.classList.remove('show')}));renderCatalog();
})();
(function(){const auth=document.querySelector('#auth-screen');const open=()=>{auth?.classList.remove('is-hidden')};const close=()=>{auth?.classList.add('is-hidden')};document.querySelector('#auth-button')?.addEventListener('click',open);document.querySelector('#auth-close')?.addEventListener('click',close)})();
(function(){
  const toast=message=>{const node=document.querySelector('#toast');if(!node)return;node.textContent=message;node.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>node.classList.remove('show'),2200)};const balanceKey='fanaticos-balance';let balance=Number(localStorage.getItem(balanceKey)||250000);const money=value=>'$ '+Math.round(value).toLocaleString('es-CO');const refresh=()=>{document.querySelector('#balance-amount').textContent=money(balance);document.querySelector('#deposit-balance').textContent=money(balance)};const open=()=>{document.querySelector('#deposit-panel').classList.add('open');document.querySelector('#scrim').classList.add('show');refresh()};document.querySelector('#deposit-button')?.addEventListener('click',open);document.querySelectorAll('[data-amount]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-amount]').forEach(item=>item.classList.remove('active'));button.classList.add('active');document.querySelector('#deposit-amount').value=button.dataset.amount}));document.querySelector('#confirm-deposit')?.addEventListener('click',()=>{const amount=Number(document.querySelector('#deposit-amount').value)||0;if(amount<1000){toast('Ingresa un monto minimo de $1.000');return}balance+=amount;localStorage.setItem(balanceKey,balance);refresh();toast('Recarga demo agregada a tu saldo');setTimeout(()=>{document.querySelector('#deposit-panel').classList.remove('open');document.querySelector('#scrim').classList.remove('show')},500)});refresh();
})();
(function(){
  const button=document.querySelector('#place-bet');if(!button)return;const notify=message=>{const node=document.querySelector('#toast');if(!node)return;node.textContent=message;node.classList.add('show');clearTimeout(notify.timer);notify.timer=setTimeout(()=>node.classList.remove('show'),2200)};button.addEventListener('click',event=>{const rows=[...document.querySelectorAll('#slip-items .slip-item')];if(!rows.length)return;event.preventDefault();event.stopImmediatePropagation();const stake=Math.max(0,Number(document.querySelector('#stake').value)||0);const potential=document.querySelector('#potential-win').textContent;const bets=JSON.parse(localStorage.getItem('fanaticos-bets')||'[]');bets.unshift({matches:rows.map(row=>row.querySelector('strong')?.textContent||'Partido').join(' + '),selections:rows.length,stake:'$ '+Math.round(stake).toLocaleString('es-CO'),potential,status:'Pendiente',date:new Date().toLocaleDateString('es-CO')});localStorage.setItem('fanaticos-bets',JSON.stringify(bets));document.querySelector('#slip-items').innerHTML='<div class="empty-slip">Selecciona una cuota para comenzar.</div>';document.querySelector('#bet-count').textContent='0';document.querySelector('#ticker-bet-count').textContent='0';document.querySelector('#bet-slip').classList.remove('open');document.querySelector('#scrim').classList.remove('show');notify('Apuesta confirmada en modo demostracion')},true);
})();
(function(){const historyTab=document.querySelector('[data-bet-tab="history"]');if(!historyTab)return;historyTab.addEventListener('click',()=>{const list=document.querySelector('#my-bets-list');let bets=[];try{bets=JSON.parse(localStorage.getItem('fanaticos-bets')||'[]')}catch{};if(!bets.length){list.innerHTML='<div class="empty-bets">Todavia no tienes apuestas registradas.</div>';return}list.innerHTML=bets.map(item=>`<article class="my-bet"><div class="my-bet-head"><strong>${item.matches}</strong><span class="my-bet-status">Confirmada</span></div><small>${item.date} · ${item.selections} seleccion${item.selections===1?'':'es'}</small><div class="my-bet-meta"><span>Apostado ${item.stake}</span><b>Ganancia ${item.potential}</b></div></article>`).join('')})})();
(function(){
  const syncScoreboard=()=>{const title=document.querySelector('#detail-title')?.textContent||'';const parts=title.split(' vs ');const home=parts[0]||'Local';const away=parts[1]||'Visitante';document.querySelector('#detail-home').textContent=home;document.querySelector('#detail-away').textContent=away;document.querySelector('#detail-home-badge').textContent=home.charAt(0);document.querySelector('#detail-away-badge').textContent=away.charAt(0);const live=/EN VIVO|LIVE/i.test(document.querySelector('#detail-meta')?.textContent||'');document.querySelector('#detail-score').textContent=live?'0 - 1':'- -';document.querySelector('#detail-time').textContent=live?'2T · 74:00':'Proximo';document.querySelector('#detail-event-state').textContent=live?'◉ Sigue en vivo':'◌ Comienza pronto'};
  document.addEventListener('click',event=>{if(event.target.closest('.event-card[data-match-id]')||event.target.closest('.popular-match[data-open-match]'))setTimeout(syncScoreboard,0)});
  document.querySelectorAll('[data-detail-tab]').forEach(tab=>tab.addEventListener('click',()=>{document.querySelectorAll('[data-detail-tab]').forEach(item=>item.classList.toggle('active',item===tab));const target=tab.dataset.detailTab;document.querySelectorAll('#detail-markets section').forEach(section=>{const label=section.querySelector('.detail-market-title span')?.textContent.toLowerCase()||'';section.style.display=target==='todo'||label.includes(target==='mitad'?'primera':target)?'block':'none'})}));
})();
 /* (function(){
  const detail=document.querySelector('#match-detail');const scrim=document.querySelector('#scrim');const safeMatches={
    'real-barca':['La Liga','Real Madrid','Barcelona','2.10','3.40','3.05'],
    'lakers-celtics':['NBA','Lakers','Celtics','1.85','1.90','2.20'],
    'sinner-alcaraz':['ATP Finals','J. Sinner','C. Alcaraz','1.72','3.50','2.05'],
    'city-arsenal':['Premier League','Man. City','Arsenal','1.88','3.60','3.75'],
    'warriors-bulls':['NBA','Warriors','Bulls','1.65','1.92','2.55'],
    'inter-juve':['Serie A','Inter Milan','Juventus','1.95','3.25','3.90'],
    'psg-marseille':['Ligue 1','PSG','Marseille','1.55','4.20','5.40'],
    'bayern-dortmund':['Bundesliga','Bayern Munich','Borussia Dortmund','1.70','4.10','4.35'],
    'america-chivas':['Liga MX','America','Chivas','1.82','3.45','4.10'],
    'chiefs-eagles':['NFL','Chiefs','Eagles','1.78','1.90','2.25']
  };
  const openSafe=id=>{const data=safeMatches[id];if(!data||!detail)return;const [league,home,away,one,draw,two]=data;document.querySelector('#detail-league').textContent=league.toUpperCase();document.querySelector('#detail-title').textContent=home+' vs '+away;document.querySelector('#detail-home').textContent=home;document.querySelector('#detail-away').textContent=away;document.querySelector('#detail-home-badge').textContent=home.charAt(0);document.querySelector('#detail-away-badge').textContent=away.charAt(0);document.querySelector('#detail-score').textContent=id==='lakers-celtics'?'0 - 1':'- -';document.querySelector('#detail-time').textContent=id==='lakers-celtics'?'2T · 74:00':'Proximo';document.querySelector('#detail-event-state').textContent=id==='lakers-celtics'?'◉ Sigue en vivo':'◌ Sigue el partido';const groups={Principales:[[home,one],['Empate',draw],[away,two]],Goles:[['Mas 2.5','1.68'],['Menos 2.5','2.05'],['Ambos marcan','1.72']],Corners:[['Mas 8.5','1.80'],['Menos 8.5','1.92'],['Mas 10.5','2.35']],Mitad:[[home+' 1T','2.10'],['Empate','2.20'],[away+' 1T','3.15']]};document.querySelector('#detail-meta').innerHTML='<strong>'+data[0]+'</strong><br>Selecciona una cuota para añadirla al boleto. Las cuotas son demostrativas.';document.querySelector('#detail-markets').innerHTML=Object.entries(groups).map(([name,odds])=>'<section><div class="detail-market-title"><span>'+name+'</span><small>Cuotas</small></div><div class="detail-odds">'+odds.map((odd,index)=>'<button class="detail-odd" data-safe-event="'+id+'" data-safe-choice="'+odd[0]+'" data-safe-odd="'+odd[1]+'"><small>'+odd[0]+'</small><br>'+odd[1]+'</button>').join('')+'</div></section>').join('');detail.classList.add('open');scrim.classList.add('show');detail.setAttribute('aria-hidden','false');detail.querySelectorAll('[data-safe-event]').forEach(button=>button.addEventListener('click',()=>{const item=document.createElement('div');item.className='slip-item';item.innerHTML='<div><strong>'+home+' vs '+away+'</strong><small>'+button.dataset.safeChoice+' · Cuota seleccionada</small></div><div><b>'+button.dataset.safeOdd+'</b></div>';document.querySelector('#slip-items .empty-slip')?.remove();document.querySelector('#slip-items').appendChild(item);document.querySelector('#bet-count').textContent=Number(document.querySelector('#bet-count').textContent)+1;document.querySelector('#ticker-bet-count').textContent=document.querySelector('#bet-count').textContent;detail.classList.remove('open');document.querySelector('#bet-slip').classList.add('open');});};
  )
  document.addEventListener('click',event=>{const card=event.target.closest('[data-match-id], [data-open-match]');if(!card||event.target.closest('.odd-button'))return;event.preventDefault();event.stopImmediatePropagation();openSafe(card.dataset.matchId||card.dataset.openMatch)},true);
})();
*/
