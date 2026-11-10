// auth-ui.js — formularios de cuenta (ingresar, registro, verificación, recuperación).
// Se monta igual en la web (cuenta.html) y en la app (app.html).
import * as A from './auth-core.js';
import * as CO from './colombia.js';
import { enlazarCorreo } from './email.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const RESEND_SECONDS = 60;
const MAX_CODE_TRIES = 5;
const L = CO.LIMITES;

const eye = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
const shield = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/></svg>';

const HEAD = {
  login: ['Ingresa a tu cuenta', 'Necesitas una cuenta verificada para comprar.'],
  registro: ['Crea tu cuenta', 'Solo para compras con envío en Colombia. Verificamos cada registro.'],
  verificar: ['Verifica tu correo', ''],
  recuperar: ['Recupera tu contraseña', 'Te enviaremos un código a tu correo.'],
  'recuperar-codigo': ['Escribe el código', ''],
  'nueva-clave': ['Crea una contraseña nueva', 'Úsala para ingresar desde ahora.']
};

function field(id, label, input, hint = '') {
  return `<div class="au-field" data-field="${id}">
    <label for="${id}">${label}</label>${input}
    ${hint ? `<small class="au-hint" id="${id}-hint">${hint}</small>` : ''}
    <small class="au-error" id="${id}-error" aria-live="polite"></small>
  </div>`;
}
function passwordInput(id, autocomplete, describedBy = '') {
  return `<div class="au-pass"><input type="password" id="${id}" name="${id}" autocomplete="${autocomplete}" required maxlength="${L.claveMax}" spellcheck="false"${describedBy ? ` aria-describedby="${describedBy}"` : ''}>
    <button type="button" class="au-eye" data-toggle="${id}" aria-label="Mostrar contraseña" aria-pressed="false">${eye}</button></div>`;
}
const honeypot = `<div class="au-hp" aria-hidden="true"><label>Sitio web<input type="text" name="sitio_web" tabindex="-1" autocomplete="off" data-hp></label></div>`;
const captcha = (name) => `<div class="au-captcha" data-captcha="${name}"></div>`;
const codeInput = (id) => `<input type="text" id="${id}" name="${id}" class="au-code" inputmode="numeric" autocomplete="one-time-code" maxlength="${A.CODE_LENGTH}" required placeholder="${'•'.repeat(A.CODE_LENGTH)}" data-filter="digitos">`;

function template({ terminos, privacidad, headingTag = 'h1' }) {
  const rules = A.PASSWORD_RULES.map((r) => `<li data-rule="${r.id}">${r.text}</li>`).join('');
  const tipos = CO.TIPOS_DOCUMENTO.map((t) => `<option value="${t.id}">${t.id} · ${t.nombre}</option>`).join('');
  return `
  <div class="au-head"><${headingTag} class="au-title" id="au-title" tabindex="-1"></${headingTag}><p class="au-sub" id="au-sub"></p></div>
  <div class="au-tabs" role="tablist" aria-label="Cuenta">
    <button type="button" role="tab" class="au-tab" data-go="login">Ingresar</button>
    <button type="button" role="tab" class="au-tab" data-go="registro">Crear cuenta</button>
  </div>
  <div class="au-msg" id="au-msg" role="alert" hidden></div>
  <div class="au-devcode" id="au-devcode" hidden></div>

  <form class="au-form" data-view="login" novalidate>
    ${field('au-login-email', 'Correo', `<input type="email" id="au-login-email" name="email" autocomplete="email" required maxlength="${L.correo}" spellcheck="false">`)}
    ${field('au-login-pass', 'Contraseña', passwordInput('au-login-pass', 'current-password'))}
    <button type="button" class="au-link au-right" data-go="recuperar">¿Olvidaste tu contraseña?</button>
    ${honeypot}${captcha('login')}
    <button type="submit" class="au-submit">Ingresar</button>
  </form>

  <form class="au-form" data-view="registro" novalidate>
    <fieldset class="au-group"><legend>Datos personales</legend>
      <div class="au-two">
        ${field('au-reg-nombres', 'Nombres', `<input type="text" id="au-reg-nombres" autocomplete="given-name" required maxlength="${L.nombre}" data-filter="letras">`)}
        ${field('au-reg-apellidos', 'Apellidos', `<input type="text" id="au-reg-apellidos" autocomplete="family-name" required maxlength="${L.nombre}" data-filter="letras">`)}
      </div>
      <div class="au-two au-doc">
        ${field('au-reg-tipo', 'Tipo de documento', `<select id="au-reg-tipo" required><option value="">Elige…</option>${tipos}</select>`)}
        ${field('au-reg-doc', 'Número de documento', `<input type="text" id="au-reg-doc" inputmode="numeric" autocomplete="off" required maxlength="${L.documento}" spellcheck="false">`, 'Sin puntos ni espacios.')}
      </div>
      <div class="au-two">
        ${field('au-reg-nac', 'Fecha de nacimiento', `<input type="date" id="au-reg-nac" autocomplete="bday" required min="1925-01-01" max="${CO.fechaMaximaNacimiento()}">`, `Debes ser mayor de ${CO.EDAD_MINIMA} años.`)}
        ${field('au-reg-cel', 'Celular', `<div class="au-prefix"><span>+57</span><input type="tel" id="au-reg-cel" autocomplete="tel-national" inputmode="numeric" required maxlength="12" placeholder="300 123 4567" data-filter="celular"></div>`)}
      </div>
    </fieldset>
    <fieldset class="au-group"><legend>Acceso</legend>
      ${field('au-reg-email', 'Correo', `<input type="email" id="au-reg-email" autocomplete="email" required maxlength="${L.correo}" spellcheck="false">`, 'Te enviaremos un código para confirmarlo.')}
      ${field('au-reg-pass', 'Contraseña', passwordInput('au-reg-pass', 'new-password', 'au-rules') + `<div class="au-meter" aria-hidden="true"><i></i></div><ul class="au-rules" id="au-rules">${rules}</ul>`)}
      ${field('au-reg-pass2', 'Confirma la contraseña', passwordInput('au-reg-pass2', 'new-password'))}
    </fieldset>
    <div class="au-field" data-field="au-reg-terms">
      <label class="au-check"><input type="checkbox" id="au-reg-terms" required>
        <span>Acepto los <a href="${terminos}" target="_blank" rel="noopener">términos y condiciones</a> y autorizo el tratamiento de mis datos personales según la <a href="${privacidad}" target="_blank" rel="noopener">política de privacidad</a> (Ley 1581 de 2012).</span></label>
      <small class="au-error" id="au-reg-terms-error" aria-live="polite"></small>
    </div>
    ${honeypot}${captcha('registro')}
    <button type="submit" class="au-submit">Crear cuenta</button>
  </form>

  <form class="au-form" data-view="verificar" novalidate>
    ${field('au-code', 'Código de verificación', codeInput('au-code'))}
    <button type="submit" class="au-submit">Verificar</button>
    ${captcha('reenviar')}
    <div class="au-row"><button type="button" class="au-link" data-resend>Reenviar código</button>
      <button type="button" class="au-link" data-go="registro">Cambiar correo</button></div>
  </form>

  <form class="au-form" data-view="recuperar" novalidate>
    ${field('au-rec-email', 'Correo de tu cuenta', `<input type="email" id="au-rec-email" autocomplete="email" required maxlength="${L.correo}" spellcheck="false">`)}
    ${honeypot}${captcha('recuperar')}
    <button type="submit" class="au-submit">Enviar código</button>
    <button type="button" class="au-link" data-go="login">Volver a ingresar</button>
  </form>

  <form class="au-form" data-view="recuperar-codigo" novalidate>
    ${field('au-rec-code', 'Código', codeInput('au-rec-code'))}
    <button type="submit" class="au-submit">Continuar</button>
    <button type="button" class="au-link" data-go="recuperar">Pedir otro código</button>
  </form>

  <form class="au-form" data-view="nueva-clave" novalidate>
    ${field('au-new-pass', 'Nueva contraseña', passwordInput('au-new-pass', 'new-password'), A.PASSWORD_RULES.map((r) => r.text).join(' · '))}
    ${field('au-new-pass2', 'Confírmala', passwordInput('au-new-pass2', 'new-password'))}
    <button type="submit" class="au-submit">Guardar contraseña</button>
  </form>

  <p class="au-trust">${shield}<span>${A.isLocal()
    ? 'Modo de prueba: las cuentas se guardan en este navegador mientras se conecta la base de datos. Contraseñas cifradas.'
    : `Registro protegido con verificación de correo${A.captchaEnabled() ? ' y anti-bots' : ''}. Tu contraseña se guarda cifrada.`}</span></p>`;
}

export function mountAuth(root, opts = {}) {
  const o = { terminos: 'ayuda.html#terminos', privacidad: 'ayuda.html#terminos', onSignedIn() {}, initialView: 'login', ...opts };
  root.classList.add('au');
  root.innerHTML = template(o);
  const $ = (s) => root.querySelector(s);
  const $$ = (s) => [...root.querySelectorAll(s)];
  const state = { view: '', email: '', codeTries: 0, captchas: {}, cooldown: 0, timer: null };

  root.querySelectorAll('[data-filter]').forEach((el) => CO.filtrarEntrada(el, el.dataset.filter));
  // Correos: el aviso aparece al salir del campo, sin esperar a enviar el formulario.
  root.querySelectorAll('input[type="email"]').forEach((el) => enlazarCorreo(el, (m) => fieldError(el.id, m), A.validateEmail));

  // ----- mensajes -----
  const msg = $('#au-msg');
  function say(text, tone = 'error') { msg.textContent = text; msg.dataset.tone = tone; msg.hidden = !text; }
  function fieldError(id, text) {
    const f = root.querySelector(`[data-field="${id}"]`);
    const el = root.querySelector(`#${id}-error`);
    if (el) el.textContent = text || '';
    if (f) f.classList.toggle('has-error', Boolean(text));
    const input = root.querySelector('#' + id);
    if (input) input.setAttribute('aria-invalid', text ? 'true' : 'false');
    return !text;
  }
  function clearErrors(form) { form.querySelectorAll('[data-field]').forEach((f) => fieldError(f.dataset.field, '')); }
  root.addEventListener('input', (e) => {
    const f = e.target.closest('[data-field]');
    if (f && f.classList.contains('has-error')) fieldError(f.dataset.field, '');
  });

  // Modo local: muestra el "correo" con el código, porque aún no hay servidor de correo.
  const dev = $('#au-devcode');
  const onDevCode = (e) => {
    if (!root.isConnected) return window.removeEventListener('vokter:codigo-local', onDevCode);
    dev.innerHTML = `<strong>Modo de prueba</strong> · Código enviado a ${esc(e.detail.email)}: <b class="au-devnum">${e.detail.code}</b>
      <small>Con la base de datos conectada, este código llegará al correo del cliente.</small>`;
    dev.hidden = false;
  };
  window.addEventListener('vokter:codigo-local', onDevCode);

  // ----- vistas -----
  async function show(view, { keepMsg = false } = {}) {
    if (!HEAD[view]) view = 'login';
    state.view = view;
    $$('.au-form').forEach((f) => { f.hidden = f.dataset.view !== view; });
    if (!['verificar', 'recuperar-codigo'].includes(view)) dev.hidden = true;
    $('.au-tabs').hidden = !['login', 'registro'].includes(view);
    $$('.au-tab').forEach((t) => { const on = t.dataset.go === view; t.classList.toggle('active', on); t.setAttribute('aria-selected', on); });
    const [title, sub] = HEAD[view];
    $('#au-title').textContent = title;
    $('#au-sub').innerHTML = view === 'verificar' || view === 'recuperar-codigo'
      ? `Enviamos un código de ${A.CODE_LENGTH} números a <strong>${esc(state.email)}</strong>. Vence en 10 minutos; revisa también la carpeta de spam.`
      : esc(sub);
    if (!keepMsg) say('');
    const form = $(`.au-form[data-view="${view}"]`);
    A.armForm(form);
    const box = form.querySelector('[data-captcha]');
    if (box && !state.captchas[box.dataset.captcha]) {
      try { state.captchas[box.dataset.captcha] = await A.mountCaptcha(box); } catch (e) { say(e.message); }
    }
    if (opts.syncHash !== false && location.hash.slice(1) !== view) history.replaceState(null, '', location.pathname + location.search + '#' + view);
    if (opts.focus !== false) form.querySelector('input:not([data-hp]), select')?.focus({ preventScroll: true });
  }
  const tokenFor = (name) => state.captchas[name]?.getToken();
  const resetCaptcha = (name) => state.captchas[name]?.reset();

  async function submitting(form, fn) {
    const btn = form.querySelector('.au-submit');
    if (btn.disabled) return;
    btn.disabled = true; btn.classList.add('is-loading'); btn.setAttribute('aria-busy', 'true');
    try { await fn(); } catch (e) { say(e.message || 'Algo salió mal.'); }
    finally { btn.disabled = false; btn.classList.remove('is-loading'); btn.removeAttribute('aria-busy'); }
  }

  function startCooldown() {
    state.cooldown = RESEND_SECONDS;
    clearInterval(state.timer);
    const tick = () => {
      $$('[data-resend]').forEach((b) => { b.disabled = state.cooldown > 0; b.textContent = state.cooldown > 0 ? `Reenviar en ${state.cooldown} s` : 'Reenviar código'; });
      if (state.cooldown-- <= 0) clearInterval(state.timer);
    };
    tick(); state.timer = setInterval(tick, 1000);
  }

  root.addEventListener('click', (e) => {
    const t = e.target.closest('[data-toggle]');
    if (t) {
      const input = root.querySelector('#' + t.dataset.toggle);
      const showIt = input.type === 'password';
      input.type = showIt ? 'text' : 'password';
      t.setAttribute('aria-pressed', showIt); t.setAttribute('aria-label', showIt ? 'Ocultar contraseña' : 'Mostrar contraseña');
      return;
    }
    const go = e.target.closest('[data-go]');
    if (go) { e.preventDefault(); show(go.dataset.go); }
  });
  const regPass = $('#au-reg-pass');
  regPass.addEventListener('input', () => {
    const p = regPass.value;
    A.PASSWORD_RULES.forEach((r) => root.querySelector(`[data-rule="${r.id}"]`).classList.toggle('ok', r.test(p)));
    const score = A.passwordScore(p);
    const meter = $('.au-meter');
    meter.style.setProperty('--score', score / A.PASSWORD_RULES.length);
    meter.dataset.level = score <= 3 ? 'low' : score < A.PASSWORD_RULES.length ? 'mid' : 'high';
  });
  // Documento: solo números, excepto el pasaporte, que acepta letras.
  const tipo = $('#au-reg-tipo'); const doc = $('#au-reg-doc');
  const cleanDoc = () => { doc.value = tipo.value === 'PA' ? doc.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase() : doc.value.replace(/\D/g, ''); };
  tipo.addEventListener('change', () => { doc.inputMode = tipo.value === 'PA' ? 'text' : 'numeric'; cleanDoc(); });
  doc.addEventListener('input', cleanDoc);

  // ----- LOGIN -----
  const loginForm = $('.au-form[data-view="login"]');
  loginForm.addEventListener('submit', (e) => { e.preventDefault(); submitting(loginForm, async () => {
    clearErrors(loginForm); say('');
    const email = $('#au-login-email').value; const pass = $('#au-login-pass').value;
    const ok = [fieldError('au-login-email', A.validateEmail(email)), fieldError('au-login-pass', pass ? '' : 'Escribe tu contraseña.')];
    if (ok.includes(false)) return;
    A.botCheck(loginForm);
    try { await A.signIn(email, pass, tokenFor('login')); }
    catch (err) {
      resetCaptcha('login');
      if (err.code === 'email_not_confirmed') { state.email = A.normalizeEmail(email); await show('verificar', { keepMsg: true }); startCooldown(); say(err.message, 'info'); return; }
      throw err;
    }
    await finish();
  }); });

  // ----- REGISTRO -----
  const regForm = $('.au-form[data-view="registro"]');
  regForm.addEventListener('submit', (e) => { e.preventDefault(); submitting(regForm, async () => {
    clearErrors(regForm); say('');
    const v = {
      nombres: $('#au-reg-nombres').value, apellidos: $('#au-reg-apellidos').value,
      tipo_documento: tipo.value, documento: doc.value, nacimiento: $('#au-reg-nac').value,
      celular: $('#au-reg-cel').value, email: $('#au-reg-email').value, pass: regPass.value, pass2: $('#au-reg-pass2').value
    };
    const checks = [
      fieldError('au-reg-nombres', CO.validarNombres(v.nombres, 'nombres')),
      fieldError('au-reg-apellidos', CO.validarNombres(v.apellidos, 'apellidos')),
      fieldError('au-reg-tipo', v.tipo_documento ? '' : 'Elige el tipo de documento.'),
      fieldError('au-reg-doc', v.tipo_documento ? CO.validarDocumento(v.tipo_documento, v.documento) : ''),
      fieldError('au-reg-nac', CO.validarNacimiento(v.nacimiento)),
      fieldError('au-reg-cel', CO.validarCelular(v.celular)),
      fieldError('au-reg-email', A.validateEmail(v.email)),
      fieldError('au-reg-pass', A.validatePassword(v.pass, { email: v.email, nombres: v.nombres, documento: CO.soloDigitos(v.documento) })),
      fieldError('au-reg-pass2', v.pass2 && v.pass2 === v.pass ? '' : 'Las contraseñas no coinciden.'),
      fieldError('au-reg-terms', $('#au-reg-terms').checked ? '' : 'Debes aceptar para crear tu cuenta.')
    ];
    if (checks.includes(false)) {
      say('Revisa los campos marcados en rojo.');
      regForm.querySelector('.has-error input, .has-error select')?.focus();
      return;
    }
    A.botCheck(regForm);
    let res;
    try { res = await A.signUp({ email: v.email, password: v.pass, perfil: v, captchaToken: tokenFor('registro') }); }
    catch (err) { resetCaptcha('registro'); throw err; }
    state.email = A.normalizeEmail(v.email); state.codeTries = 0;
    if (res.needsCode) { await show('verificar', { keepMsg: true }); startCooldown(); say('Cuenta creada. Escribe el código para activarla.', 'ok'); }
    else await finish();
  }); });

  // ----- VERIFICAR CORREO -----
  const verForm = $('.au-form[data-view="verificar"]');
  verForm.addEventListener('submit', (e) => { e.preventDefault(); submitting(verForm, async () => {
    clearErrors(verForm); say('');
    const code = $('#au-code').value;
    if (!fieldError('au-code', A.validateCode(code))) return;
    if (state.codeTries >= MAX_CODE_TRIES) { say('Demasiados intentos con este código. Pide uno nuevo.'); return; }
    try { await A.verifySignupCode(state.email, code); }
    catch (err) { state.codeTries++; $('#au-code').select(); throw err; }
    await finish('¡Listo! Tu cuenta quedó verificada.');
  }); });

  // ----- RECUPERAR -----
  const recForm = $('.au-form[data-view="recuperar"]');
  recForm.addEventListener('submit', (e) => { e.preventDefault(); submitting(recForm, async () => {
    clearErrors(recForm); say('');
    const email = $('#au-rec-email').value;
    if (!fieldError('au-rec-email', A.validateEmail(email))) return;
    A.botCheck(recForm);
    try { await A.sendRecoveryCode(email, tokenFor('recuperar')); }
    catch (err) { resetCaptcha('recuperar'); throw err; }
    state.email = A.normalizeEmail(email); state.codeTries = 0;
    await show('recuperar-codigo', { keepMsg: true });
    say('Si el correo tiene una cuenta, te llegará un código en unos segundos.', 'info');
  }); });

  const recCodeForm = $('.au-form[data-view="recuperar-codigo"]');
  recCodeForm.addEventListener('submit', (e) => { e.preventDefault(); submitting(recCodeForm, async () => {
    clearErrors(recCodeForm); say('');
    const code = $('#au-rec-code').value;
    if (!fieldError('au-rec-code', A.validateCode(code))) return;
    if (state.codeTries >= MAX_CODE_TRIES) { say('Demasiados intentos con este código. Pide uno nuevo.'); return; }
    try { await A.verifyRecoveryCode(state.email, code); }
    catch (err) { state.codeTries++; throw err; }
    await show('nueva-clave');
  }); });

  const newForm = $('.au-form[data-view="nueva-clave"]');
  newForm.addEventListener('submit', (e) => { e.preventDefault(); submitting(newForm, async () => {
    clearErrors(newForm); say('');
    const p = $('#au-new-pass').value; const p2 = $('#au-new-pass2').value;
    const ok = [fieldError('au-new-pass', A.validatePassword(p, { email: state.email })), fieldError('au-new-pass2', p2 && p === p2 ? '' : 'Las contraseñas no coinciden.')];
    if (ok.includes(false)) return;
    await A.updatePassword(p);
    await finish('Contraseña actualizada.');
  }); });

  // ----- reenviar código -----
  root.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-resend]');
    if (!b || b.disabled) return;
    say('');
    try { await A.resendSignupCode(state.email, tokenFor('reenviar')); resetCaptcha('reenviar'); state.codeTries = 0; startCooldown(); say('Te enviamos un código nuevo.', 'ok'); }
    catch (err) { resetCaptcha('reenviar'); say(err.message); }
  });

  async function finish(text) {
    const user = await A.currentUser();
    if (text) say(text, 'ok');
    o.onSignedIn(user, text);
  }

  if (!A.isConfigured()) {
    $$('.au-submit').forEach((b) => { b.disabled = true; });
    say('Las cuentas aún no están conectadas a la base de datos. Revisa js/config.js (docs/AUTENTICACION.md).', 'info');
    show(o.initialView, { keepMsg: true });
  } else show(o.initialView);

  return { show, say };
}
