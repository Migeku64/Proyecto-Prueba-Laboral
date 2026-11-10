// auth-core.js — cuentas de usuario y pedidos. Lo usan la web y la app: una sola cuenta para ambas.
//
// Dónde se guardan los datos (CONFIG.backend en js/config.js):
//  - 'local':    provisional, dentro del navegador (js/backend-local.js). Para trabajar mientras llega la base de datos.
//  - 'supabase': base de datos real PostgreSQL en Supabase.
//
// Capas de verificación:
//  1. Validaciones colombianas estrictas (js/colombia.js): documento, celular, mayoría de edad, nombres, dirección.
//  2. Código de 6 dígitos al correo: sin código no hay sesión.
//  3. Contraseña fuerte, cifrada en el servidor (o con PBKDF2 en modo local). Nunca en texto plano.
//  4. Anti-bots: Cloudflare Turnstile (opcional), campo trampa invisible y tiempo mínimo de llenado.
//  5. Correos desechables bloqueados; correo, documento y celular únicos; bloqueo tras 5 intentos fallidos.

import { CONFIG } from './config.js';
import * as CO from './colombia.js';

const SUPABASE_LIB = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';
const TURNSTILE_LIB = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
export const MIN_FILL_MS = 3000;
export const CODE_LENGTH = 6;

export const backendName = () => (window.__VOKTER_AUTH_CLIENT__ ? 'prueba' : CONFIG.backend || 'local');
export const isLocal = () => backendName() === 'local';
export const isConfigured = () => backendName() !== 'supabase' || Boolean(CONFIG.supabaseUrl && CONFIG.supabaseAnonKey);
export const captchaEnabled = () => backendName() === 'supabase' && Boolean(CONFIG.turnstileSiteKey);

let clientPromise = null;
export function getClient() {
  if (window.__VOKTER_AUTH_CLIENT__) return Promise.resolve(window.__VOKTER_AUTH_CLIENT__); // solo pruebas automáticas
  if (!clientPromise) {
    if (backendName() === 'supabase') {
      if (!isConfigured()) return Promise.reject(new AuthError('no_config'));
      clientPromise = import(SUPABASE_LIB).then(({ createClient }) => {
        const c = createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey, {
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'vokter-auth' }
        });
        c.orders = {
          create: (o) => c.from('pedidos').insert(o).select().single(),
          mine: () => c.from('pedidos').select('*').order('creado_at', { ascending: false })
        };
        return c;
      });
    } else {
      clientPromise = import('./backend-local.js').then((m) => m.localClient);
    }
  }
  return clientPromise;
}

// ---------- Mensajes de error en español ----------
export class AuthError extends Error {
  constructor(code, message) { super(message || MESSAGES[code] || MESSAGES.unknown); this.code = code; }
}
const MESSAGES = {
  no_config: 'Las cuentas aún no están conectadas a la base de datos. Revisa js/config.js (docs/AUTENTICACION.md).',
  insecure_context: 'Abre la tienda desde https:// o desde localhost para poder crear cuentas.',
  invalid_credentials: 'Correo o contraseña incorrectos.',
  account_locked: 'Demasiados intentos fallidos. Por seguridad, espera 5 minutos e inténtalo de nuevo.',
  email_not_confirmed: 'Tu correo aún no está verificado. Te enviamos un código para confirmarlo.',
  user_already_exists: 'Ya existe una cuenta con ese correo. Inicia sesión o recupera tu contraseña.',
  documento_exists: 'Ya existe una cuenta con ese documento.',
  phone_exists: 'Ese celular ya está registrado en otra cuenta.',
  duplicate_data: 'Ya existe una cuenta con ese correo, documento o celular.',
  otp_expired: 'El código es incorrecto o ya venció. Pide uno nuevo.',
  over_email_send_rate_limit: 'Ya enviamos varios correos. Espera unos minutos antes de pedir otro código.',
  over_request_rate_limit: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
  captcha_failed: 'No pudimos confirmar que eres una persona. Completa la verificación de nuevo.',
  weak_password: 'La contraseña es muy débil o aparece en filtraciones conocidas. Usa otra.',
  same_password: 'La nueva contraseña debe ser distinta a la anterior.',
  session_missing: 'Tu sesión terminó. Ingresa de nuevo.',
  signup_disabled: 'El registro está cerrado por ahora.',
  network: 'No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.',
  bot: 'No pudimos procesar el formulario. Recarga la página e inténtalo de nuevo.',
  too_fast: 'Fuiste muy rápido. Revisa tus datos y vuelve a enviar.',
  unknown: 'Algo salió mal. Inténtalo de nuevo en unos minutos.'
};

function translate(error) {
  if (!error) return null;
  if (error instanceof AuthError) return error;
  const code = error.code || '';
  const msg = String(error.message || '').toLowerCase();
  if (MESSAGES[code]) return new AuthError(code);
  if (code === '23505' || msg.includes('database error saving new user') || msg.includes('duplicate key')) return new AuthError('duplicate_data');
  if (msg.includes('invalid login credentials')) return new AuthError('invalid_credentials');
  if (msg.includes('email not confirmed')) return new AuthError('email_not_confirmed');
  if (msg.includes('already registered') || msg.includes('already exists')) return new AuthError('user_already_exists');
  if (msg.includes('expired') || (msg.includes('invalid') && msg.includes('token'))) return new AuthError('otp_expired');
  if (msg.includes('captcha')) return new AuthError('captcha_failed');
  if (msg.includes('rate limit') || error.status === 429) return new AuthError('over_request_rate_limit');
  if (msg.includes('password') && (msg.includes('weak') || msg.includes('pwned') || msg.includes('should'))) return new AuthError('weak_password');
  if (msg.includes('fetch') || msg.includes('network')) return new AuthError('network');
  return new AuthError('unknown');
}
async function run(fn) {
  const client = await getClient();
  let result;
  try { result = await fn(client); } catch (e) { throw translate(e); }
  if (result?.error) throw translate(result.error);
  return result?.data;
}
const auth = (fn) => run((c) => fn(c.auth));

// ---------- Validaciones de cuenta ----------
const DISPOSABLE = ['mailinator.com', 'yopmail.com', 'guerrillamail.com', 'sharklasers.com', '10minutemail.com',
  'tempmail.com', 'temp-mail.org', 'trashmail.com', 'getnada.com', 'dispostable.com', 'maildrop.cc',
  'throwawaymail.com', 'fakeinbox.com', 'mintemail.com', 'emailondeck.com', 'mohmal.com', 'tempail.com',
  'mailnesia.com', 'mytemp.email', 'tempmailo.com', 'minuteinbox.com', 'burnermail.io', 'spamgourmet.com', 'yopmail.net'];
const COMMON = ['password', 'contrasena', 'contraseña', '123456', 'qwerty', 'colombia', 'vokter', 'abc123', 'iloveyou', 'admin', 'tienda'];

export function normalizeEmail(v) { return CO.limpiar(v).toLowerCase(); }

// Forma única de un buzón: quita el "+etiqueta" y, en Gmail, los puntos.
// Así nombre.apellido@gmail.com, nombreapellido@gmail.com y nombre.apellido+x@gmail.com cuentan como el mismo correo.
export function canonicalEmail(v) {
  const email = normalizeEmail(v);
  let [local = '', domain = ''] = email.split('@');
  local = local.split('+')[0];
  if (domain === 'gmail.com' || domain === 'googlemail.com') { local = local.replace(/\./g, ''); domain = 'gmail.com'; }
  return `${local}@${domain}`;
}

export function validateEmail(v) {
  const email = normalizeEmail(v);
  if (!email) return 'Escribe tu correo.';
  if (email.length > CO.LIMITES.correo) return `Máximo ${CO.LIMITES.correo} caracteres.`;
  if (!/^[a-z0-9](?:[a-z0-9._%+-]{0,62}[a-z0-9])?@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/.test(email) || email.includes('..'))
    return 'Escribe un correo válido (ej. nombre@gmail.com).';
  const domain = email.split('@')[1];
  if (DISPOSABLE.some((d) => domain === d || domain.endsWith('.' + d))) return 'No aceptamos correos temporales. Usa tu correo personal.';
  return '';
}

export const PASSWORD_RULES = [
  { id: 'len', text: `De ${CO.LIMITES.claveMin} a ${CO.LIMITES.claveMax} caracteres`, test: (p) => p.length >= CO.LIMITES.claveMin && p.length <= CO.LIMITES.claveMax },
  { id: 'upper', text: 'Una mayúscula', test: (p) => /[A-ZÁÉÍÓÚÑ]/.test(p) },
  { id: 'lower', text: 'Una minúscula', test: (p) => /[a-záéíóúñ]/.test(p) },
  { id: 'num', text: 'Un número', test: (p) => /\d/.test(p) },
  { id: 'sym', text: 'Un símbolo (!@#$…)', test: (p) => /[^A-Za-z0-9ÁÉÍÓÚÑáéíóúñ\s]/.test(p) },
  { id: 'space', text: 'Sin espacios', test: (p) => p.length > 0 && !/\s/.test(p) }
];
export function validatePassword(p, { email = '', nombres = '', documento = '' } = {}) {
  p = String(p || '');
  if (!p) return 'Escribe una contraseña.';
  const failed = PASSWORD_RULES.find((r) => !r.test(p));
  if (failed) return `La contraseña necesita: ${failed.text.toLowerCase()}.`;
  const low = p.toLowerCase();
  if (COMMON.some((w) => low.includes(w))) return 'La contraseña es muy fácil de adivinar.';
  const user = normalizeEmail(email).split('@')[0];
  if (user.length >= 4 && low.includes(user)) return 'La contraseña no puede contener tu correo.';
  const first = CO.limpiar(nombres).split(' ')[0]?.toLowerCase() || '';
  if (first.length >= 4 && low.includes(first)) return 'La contraseña no puede contener tu nombre.';
  if (documento && documento.length >= 6 && p.includes(documento)) return 'La contraseña no puede contener tu documento.';
  if (/(.)\1{3,}/.test(p)) return 'La contraseña no puede repetir el mismo carácter tantas veces.';
  return '';
}
export function passwordScore(p) { return PASSWORD_RULES.filter((r) => r.test(String(p || ''))).length; }

export function validateCode(v) {
  return new RegExp(`^\\d{${CODE_LENGTH}}$`).test(String(v || '').trim()) ? '' : `El código tiene ${CODE_LENGTH} números.`;
}

// Campo trampa (los humanos no lo ven) y tiempo mínimo de llenado.
export function botCheck(form) {
  const trap = form.querySelector('[data-hp]');
  if (trap && trap.value) throw new AuthError('bot');
  const started = Number(form.dataset.started || 0);
  if (started && Date.now() - started < MIN_FILL_MS) throw new AuthError('too_fast');
}
export function armForm(form) { form.dataset.started = String(Date.now()); }

// ---------- Turnstile ----------
let turnstilePromise = null;
function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!turnstilePromise) {
    turnstilePromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = TURNSTILE_LIB; s.async = true; s.defer = true;
      s.onload = () => resolve(window.turnstile);
      s.onerror = () => reject(new AuthError('network'));
      document.head.appendChild(s);
    });
  }
  return turnstilePromise;
}
export async function mountCaptcha(container) {
  if (!captchaEnabled() || !container) return { getToken: () => undefined, reset() {} };
  const ts = await loadTurnstile();
  let token = '';
  const id = ts.render(container, {
    sitekey: CONFIG.turnstileSiteKey, language: 'es', theme: 'auto',
    callback: (t) => { token = t; }, 'expired-callback': () => { token = ''; }, 'error-callback': () => { token = ''; }
  });
  return {
    getToken() { if (!token) throw new AuthError('captcha_failed'); return token; },
    reset() { token = ''; try { ts.reset(id); } catch { /* sin widget */ } }
  };
}

// ---------- Acciones de cuenta ----------
const redirect = () => CONFIG.urlSitio || location.origin + location.pathname;

// perfil: { nombres, apellidos, tipo_documento, documento, nacimiento, celular }
export async function signUp({ email, password, perfil, captchaToken }) {
  const data = await auth((a) => a.signUp({
    email: normalizeEmail(email), password,
    options: {
      captchaToken, emailRedirectTo: redirect(),
      data: {
        nombres: CO.limpiar(perfil.nombres), apellidos: CO.limpiar(perfil.apellidos),
        nombre: `${CO.limpiar(perfil.nombres)} ${CO.limpiar(perfil.apellidos)}`,
        tipo_documento: perfil.tipo_documento, documento: CO.normalizarDocumento(perfil.tipo_documento, perfil.documento),
        nacimiento: perfil.nacimiento, celular: CO.normalizarCelular(perfil.celular),
        pais: 'CO', correo_canonico: canonicalEmail(email), acepta_datos: new Date().toISOString()
      }
    }
  }));
  // Supabase no revela si el correo ya existe: devuelve un usuario sin identidades.
  if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) throw new AuthError('user_already_exists');
  return { needsCode: !data?.session };
}

export const verifySignupCode = (email, code) => auth((a) => a.verifyOtp({ email: normalizeEmail(email), token: String(code).trim(), type: 'signup' }));
export const resendSignupCode = (email, captchaToken) => auth((a) => a.resend({ type: 'signup', email: normalizeEmail(email), options: { captchaToken, emailRedirectTo: redirect() } }));
export const signIn = (email, password, captchaToken) => auth((a) => a.signInWithPassword({ email: normalizeEmail(email), password, options: { captchaToken } }));
export const sendRecoveryCode = (email, captchaToken) => auth((a) => a.resetPasswordForEmail(normalizeEmail(email), { captchaToken, redirectTo: redirect() }));
export const verifyRecoveryCode = (email, code) => auth((a) => a.verifyOtp({ email: normalizeEmail(email), token: String(code).trim(), type: 'recovery' }));
export const updatePassword = (password) => auth((a) => a.updateUser({ password }));
export const updateProfile = (data) => auth((a) => a.updateUser({ data }));
export const signOut = () => auth((a) => a.signOut());

export async function currentUser() {
  if (!isConfigured()) return null;
  try { const data = await auth((a) => a.getSession()); return data?.session?.user || null; }
  catch { return null; }
}
export async function onAuthChange(cb) {
  if (!isConfigured()) return;
  try { const client = await getClient(); client.auth.onAuthStateChange((_e, session) => cb(session?.user || null)); } catch { /* sin conexión */ }
}
export function displayName(user) {
  const m = user?.user_metadata || {};
  return String(m.nombres || m.nombre || user?.email || '').split(/[\s@]/)[0];
}

// ---------- Pedidos ----------
export const createOrder = (order) => run((c) => c.orders.create(order));
export const myOrders = async () => (await run((c) => c.orders.mine())) || [];
