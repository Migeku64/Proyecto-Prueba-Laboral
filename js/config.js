// config.js — conexión de la tienda con la base de datos.
// Guía paso a paso: docs/AUTENTICACION.md

export const CONFIG = {
  // Dónde se guardan cuentas y pedidos:
  //   'local'    → provisional, dentro del navegador. Funciona en localhost y GitHub Pages sin servidor.
  //                Los códigos de verificación se muestran en pantalla (no hay servidor de correo).
  //   'supabase' → base de datos real (PostgreSQL). Requiere supabaseUrl y supabaseAnonKey.
  backend: 'local',

  // Supabase → Project Settings → API. Son valores PÚBLICOS por diseño.
  // Nunca pongas aquí la clave "service_role" ni la contraseña de la base de datos.
  supabaseUrl: '',
  supabaseAnonKey: '',

  // Cloudflare Turnstile (anti-bots, solo con 'supabase'). Debe coincidir con la configurada en Supabase.
  turnstileSiteKey: '',

  // Dirección pública de la tienda, para los enlaces de los correos (opcional).
  urlSitio: ''
};
