// backend-local.js — "base de datos" provisional dentro del navegador.
// Se usa mientras no esté conectada la base de datos real (CONFIG.backend = 'local').
// Imita la misma interfaz que Supabase, así que al conectar la base real no cambia ningún formulario.
//
// Seguridad del modo local:
//  - Contraseñas cifradas con PBKDF2-SHA256 (210.000 iteraciones + sal aleatoria). Nunca en texto plano.
//  - Códigos de verificación de 6 dígitos, vencen en 10 minutos, máximo 5 intentos.
//  - 5 intentos fallidos de ingreso bloquean la cuenta 5 minutos.
//  - Correo (incluidas variantes de Gmail con puntos o +etiqueta), documento y celular únicos.
// Limitación: los datos viven solo en este navegador, y el "correo" con el código se muestra en pantalla.

const K = { users: 'vokter-db-usuarios', codes: 'vokter-db-codigos', session: 'vokter-db-sesion', tries: 'vokter-db-intentos', orders: 'vokter-db-pedidos', payments: 'vokter-db-pagos', methods: 'vokter-db-metodos' };
const CODE_TTL = 10 * 60 * 1000;
const SESSION_TTL = 8 * 60 * 60 * 1000;
const MAX_TRIES = 5;
const LOCK_MS = 5 * 60 * 1000;
const ITERATIONS = 210000;

const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* almacenamiento lleno o bloqueado */ } };
const ok = (data = {}) => ({ data, error: null });
const fail = (code, message = code) => ({ data: {}, error: { code, message } });
const subs = new Set();

const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
async function hash(password, saltB64) {
  if (!crypto?.subtle) throw Object.assign(new Error('insecure_context'), { code: 'insecure_context' });
  const salt = saltB64 ? Uint8Array.from(atob(saltB64), (c) => c.charCodeAt(0)) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS }, key, 256);
  return { hash: b64(bits), salt: b64(salt) };
}
function sameHash(a, b) { // comparación en tiempo constante
  if (a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));
const code6 = () => String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, '0');

function publicUser(u) {
  if (!u) return null;
  const { hash: _h, salt: _s, ...rest } = u;
  return rest;
}
function sessionUser() {
  const s = read(K.session, null);
  if (!s || s.exp < Date.now()) { if (s) localStorage.removeItem(K.session); return null; }
  return read(K.users, {})[s.email] || null;
}
function emit() { const u = publicUser(sessionUser()); subs.forEach((cb) => cb('CHANGE', u ? { user: u } : null)); }
function startSession(email) { write(K.session, { email, exp: Date.now() + SESSION_TTL }); emit(); }

// "Envía" el código: en modo local se muestra en pantalla.
function sendCode(email, type) {
  const codes = read(K.codes, {});
  const code = code6();
  codes[email] = { code, type, exp: Date.now() + CODE_TTL, tries: 0 };
  write(K.codes, codes);
  window.dispatchEvent(new CustomEvent('vokter:codigo-local', { detail: { email, code, type } }));
}

export const localClient = {
  backend: 'local',
  auth: {
    async signUp({ email, password, options = {} }) {
      const users = read(K.users, {});
      const meta = options.data || {};
      const all = Object.values(users);
      if (users[email]) {
        if (!users[email].email_confirmed_at) { sendCode(email, 'signup'); return ok({ user: { identities: [{}] }, session: null }); }
        return fail('user_already_exists');
      }
      if (meta.correo_canonico && all.some((u) => u.email !== email && (u.user_metadata?.correo_canonico || u.email) === meta.correo_canonico)) return fail('user_already_exists');
      if (meta.documento && all.some((u) => u.user_metadata?.tipo_documento === meta.tipo_documento && u.user_metadata?.documento === meta.documento)) return fail('documento_exists');
      if (meta.celular && all.some((u) => u.user_metadata?.celular === meta.celular)) return fail('phone_exists');
      const h = await hash(password);
      users[email] = { id: uuid(), email, ...h, user_metadata: meta, email_confirmed_at: null, created_at: new Date().toISOString() };
      write(K.users, users);
      sendCode(email, 'signup');
      return ok({ user: { identities: [{}] }, session: null });
    },

    async verifyOtp({ email, token, type }) {
      const codes = read(K.codes, {});
      const c = codes[email];
      const wanted = type === 'recovery' ? 'recovery' : 'signup';
      if (!c || c.type !== wanted || c.exp < Date.now()) return fail('otp_expired');
      if (c.tries >= MAX_TRIES) return fail('otp_expired');
      if (c.code !== String(token)) { c.tries++; write(K.codes, codes); return fail('otp_expired'); }
      delete codes[email]; write(K.codes, codes);
      const users = read(K.users, {});
      if (!users[email]) return fail('otp_expired');
      if (wanted === 'signup') users[email].email_confirmed_at = new Date().toISOString();
      write(K.users, users);
      startSession(email);
      return ok({ session: { user: publicUser(users[email]) } });
    },

    async resend({ email }) {
      const u = read(K.users, {})[email];
      if (u && !u.email_confirmed_at) sendCode(email, 'signup');
      return ok();
    },

    async signInWithPassword({ email, password }) {
      const tries = read(K.tries, {});
      const t = tries[email] || { n: 0, until: 0 };
      if (t.until > Date.now()) return fail('account_locked');
      const u = read(K.users, {})[email];
      const good = u ? sameHash((await hash(password, u.salt)).hash, u.hash) : (await hash(password), false);
      if (!good) {
        t.n++; if (t.n >= MAX_TRIES) { t.until = Date.now() + LOCK_MS; t.n = 0; }
        tries[email] = t; write(K.tries, tries);
        return fail(t.until > Date.now() ? 'account_locked' : 'invalid_credentials');
      }
      delete tries[email]; write(K.tries, tries);
      if (!u.email_confirmed_at) { sendCode(email, 'signup'); return fail('email_not_confirmed'); }
      startSession(email);
      return ok({ session: { user: publicUser(u) } });
    },

    async resetPasswordForEmail(email) {
      if (read(K.users, {})[email]) sendCode(email, 'recovery');
      return ok(); // No revela si el correo existe.
    },

    async updateUser(attrs) {
      const s = read(K.session, null);
      const users = read(K.users, {});
      const u = s && users[s.email];
      if (!u) return fail('session_missing');
      if (attrs.password) {
        if (sameHash((await hash(attrs.password, u.salt)).hash, u.hash)) return fail('same_password');
        Object.assign(u, await hash(attrs.password));
      }
      if (attrs.data) u.user_metadata = { ...u.user_metadata, ...attrs.data };
      write(K.users, users); emit();
      return ok({ user: publicUser(u) });
    },

    async getSession() { const u = sessionUser(); return ok({ session: u ? { user: publicUser(u) } : null }); },
    onAuthStateChange(cb) { subs.add(cb); return { data: { subscription: { unsubscribe: () => subs.delete(cb) } } }; },
    async signOut() { localStorage.removeItem(K.session); emit(); return ok(); }
  },

  // Pedidos del usuario con sesión.
  orders: {
    async create(order) {
      const u = sessionUser(); if (!u) return fail('session_missing');
      const all = read(K.orders, []);
      const row = { ...order, id: uuid(), usuario_id: u.id, creado_at: new Date().toISOString(), estado: order.estado === 'pago_pendiente' ? 'pago_pendiente' : 'recibido' };
      all.push(row); write(K.orders, all);
      return ok(row);
    },
    async mine() {
      const u = sessionUser(); if (!u) return ok([]);
      return ok(read(K.orders, []).filter((o) => o.usuario_id === u.id).sort((a, b) => b.creado_at.localeCompare(a.creado_at)));
    }
  },

  // Pagos: en producción los registra el servidor al recibir la confirmación (webhook) de la pasarela.
  // Aquí solo se guardan datos no sensibles: nunca el número completo de la tarjeta ni el CVV.
  payments: {
    async record(pago) {
      const u = sessionUser(); if (!u) return fail('session_missing');
      const all = read(K.payments, []);
      const row = { ...pago, id: uuid(), usuario_id: u.id, creado_at: new Date().toISOString() };
      all.push(row); write(K.payments, all);
      const orders = read(K.orders, []);
      const o = orders.find((x) => x.id === pago.pedido_id && x.usuario_id === u.id);
      if (o) { o.estado = pago.estado === 'aprobado' ? 'pagado' : 'pago_pendiente'; o.pago_id = row.id; write(K.orders, orders); }
      return ok(row);
    },
    async mine() {
      const u = sessionUser(); if (!u) return ok([]);
      return ok(read(K.payments, []).filter((p) => p.usuario_id === u.id).sort((a, b) => b.creado_at.localeCompare(a.creado_at)));
    }
  },

  // Métodos guardados: solo la referencia (token) de la pasarela y datos para mostrar.
  methods: {
    async list() {
      const u = sessionUser(); if (!u) return ok([]);
      return ok(read(K.methods, []).filter((m) => m.usuario_id === u.id).sort((a, b) => (b.predeterminado - a.predeterminado) || b.creado_at.localeCompare(a.creado_at)));
    },
    async add(m) {
      const u = sessionUser(); if (!u) return fail('session_missing');
      const all = read(K.methods, []);
      const mine = all.filter((x) => x.usuario_id === u.id);
      if (mine.length >= 5) return fail('too_many_methods');
      if (mine.some((x) => x.huella && x.huella === m.huella)) return fail('method_exists');
      const row = { ...m, id: uuid(), usuario_id: u.id, creado_at: new Date().toISOString(), predeterminado: mine.length === 0 };
      all.push(row); write(K.methods, all);
      return ok(row);
    },
    async remove(id) {
      const u = sessionUser(); if (!u) return fail('session_missing');
      let all = read(K.methods, []);
      const was = all.find((x) => x.id === id && x.usuario_id === u.id);
      all = all.filter((x) => !(x.id === id && x.usuario_id === u.id));
      if (was?.predeterminado) { const next = all.find((x) => x.usuario_id === u.id); if (next) next.predeterminado = true; }
      write(K.methods, all); return ok();
    },
    async setDefault(id) {
      const u = sessionUser(); if (!u) return fail('session_missing');
      const all = read(K.methods, []);
      all.forEach((x) => { if (x.usuario_id === u.id) x.predeterminado = x.id === id; });
      write(K.methods, all); return ok();
    }
  }
};

// Mantiene la sesión sincronizada entre pestañas.
window.addEventListener('storage', (e) => { if (e.key === K.session) emit(); });
