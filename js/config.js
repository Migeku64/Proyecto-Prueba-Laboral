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
  urlSitio: '',

  // Datos legales del vendedor (Ley 1480 de 2011, art. 50: obligatorios en comercio electrónico).
  // ⚠️ COMPLETAR con los datos reales del negocio antes de publicar la tienda.
  empresa: {
    nombreComercial: 'VOKTER',
    razonSocial: 'VOKTER S.A.S.',          // razón social registrada en Cámara de Comercio
    nit: '901.000.000-0',                 // NIT con dígito de verificación
    direccion: 'Calle 00 # 00 - 00',
    ciudad: 'Bogotá D.C., Colombia',
    telefono: '+57 601 000 0000',
    whatsapp: '+57 300 000 0000',
    correo: 'servicioalcliente@vokter.co',
    horario: 'Lunes a viernes de 8:00 a. m. a 6:00 p. m.'
  },

  // Impuestos y entregas.
  ivaPorcentaje: 19,                      // los precios del catálogo ya incluyen IVA
  entregas: {
    ciudadesPrincipales: ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga', 'Pereira', 'Manizales', 'Cúcuta', 'Ibagué', 'Santa Marta', 'Villavicencio'],
    diasPrincipales: [2, 4],              // días hábiles después del pago
    diasResto: [4, 8]
  },

  // Pagos. Guía: docs/PAGOS.md
  pagos: {
    //   'prueba' → pasarela simulada: solo acepta tarjetas de prueba, nunca cobra.
    //   'wompi'  → pasarela real de Wompi (Bancolombia).
    pasarela: 'prueba',
    // Llave PÚBLICA de la pasarela (Wompi: pub_test_... o pub_prod_...). Nunca la llave privada ni el secreto de integridad.
    llavePublica: '',
    // Función del servidor que firma cada pago (la firma usa un secreto que no puede estar en el navegador).
    urlFirma: ''
  }
};
