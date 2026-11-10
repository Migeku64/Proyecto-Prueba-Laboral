# Cuentas, verificación y pedidos

La tienda web y la app móvil comparten un solo sistema de cuentas. **Para comprar hay que tener una cuenta con el correo verificado.**
Si alguien intenta finalizar la compra sin sesión, lo lleva a `cuenta.html` y, al ingresar, lo devuelve al checkout con su carrito.

## Dónde se guardan los datos

En `js/config.js`, el campo `backend` decide dónde quedan las cuentas y los pedidos:

| `backend` | Para qué | Cómo se comporta |
|---|---|---|
| `'local'` (actual) | Trabajar y presentar mientras se conecta la base de datos | Todo queda en el navegador de quien usa la página. El código de verificación se muestra en pantalla ("Modo de prueba") porque no hay servidor de correo. Funciona en `localhost` y en GitHub Pages. |
| `'supabase'` | Producción | Base de datos PostgreSQL real. Los códigos llegan al correo del cliente. |

Los formularios y las validaciones son los mismos en los dos modos. Cambiar de modo no toca ningún formulario.

## Validaciones (solo Colombia)

| Campo | Regla |
|---|---|
| Nombres / apellidos | 2 a 40 caracteres. Solo letras (con tildes y ñ), espacio, guion y apóstrofo. Sin números, símbolos ni letras repetidas 3 o más veces. |
| Tipo de documento | CC, CE, PPT o pasaporte. |
| Número de documento | CC: 6 a 10 dígitos · CE: 6 o 7 · PPT: 6 a 8 · Pasaporte: 6 a 10 letras o números. Sin puntos, sin empezar por 0, sin secuencias (123456) ni dígitos repetidos. Único por cuenta. |
| Fecha de nacimiento | Mayor de 18 años y menor de 100. |
| Celular | 10 dígitos que empiezan por 30, 31, 32, 33 o 35. Se guarda sin el +57. Único por cuenta. |
| Correo | Formato válido, máximo 120 caracteres, sin correos temporales (yopmail, mailinator…). Un correo = una cuenta: también se bloquean las variantes del mismo buzón (`nombre+algo@…` y, en Gmail, el mismo correo con o sin puntos). |
| Contraseña | 10 a 64 caracteres, con mayúscula, minúscula, número y símbolo, sin espacios. No puede contener el nombre, el correo, el documento ni palabras comunes. |
| Términos | Aceptación obligatoria de términos y del tratamiento de datos (Ley 1581 de 2012). |
| Dirección de envío | Departamento (lista de los 32 + Bogotá D.C.), municipio solo con letras y dirección por partes: vía + número + # cruce + - placa (ej. Calle 12B # 34A - 56). Barrio obligatorio, complemento e indicaciones opcionales con límite de caracteres. |

Además, en todos los campos:
- Se bloquea al escribir lo que nunca sería válido (letras en el documento, números en el nombre…).
- Se quitan espacios dobles y caracteres invisibles.
- Se rechazan `< > { } \ $` en los textos libres.

## Seguridad

- **Verificación de correo**: código de 6 dígitos que vence en 10 minutos, con máximo 5 intentos. Para reenviarlo hay que esperar 60 s.
- **Contraseñas**: nunca en texto plano. En modo local se cifran con PBKDF2-SHA256 (210.000 iteraciones y sal aleatoria). En Supabase se guardan con bcrypt.
- **Bloqueo**: 5 contraseñas erradas bloquean el ingreso 5 minutos.
- **Anti-bots**: campo trampa invisible y tiempo mínimo de llenado de 3 s. Con Supabase se puede agregar Cloudflare Turnstile.
- **Recuperar contraseña**: no revela si un correo está registrado.
- **Base de datos** (`supabase/esquema.sql`): repite todas las reglas como restricciones. Aunque alguien salte el navegador, los datos inválidos se rechazan. Además, cada cliente solo ve su perfil y sus pedidos.

> Al agregar los métodos de pago, el precio y el total se deben recalcular en el servidor. No se puede confiar en los que envía el navegador.

## Conectar la base de datos real (Supabase)

1. Crea el proyecto en [supabase.com](https://supabase.com) y copia **Project URL** y la clave **anon public** (Project Settings → API).
2. En **SQL Editor** ejecuta todo `supabase/esquema.sql`. Crea las tablas `perfiles` y `pedidos` con sus reglas.
3. En `js/config.js` cambia `backend: 'supabase'` y pega `supabaseUrl` y `supabaseAnonKey`. **Nunca** pongas la clave `service_role` ni la contraseña de la base de datos.
4. En **Authentication**:
   - **Email**: activa **Confirm email** y deja el código (OTP) en 6 dígitos.
   - **Contraseñas**: mínimo 10, con minúsculas, mayúsculas, números y símbolos.
   - **URL Configuration**: la dirección de la tienda (localhost y GitHub Pages) en Site URL y Redirect URLs.
5. En **Emails → Templates**, en "Confirm signup" y "Reset password", pon el código en el mensaje con `{{ .Token }}`. Por ejemplo:
   `<p>Tu código VOKTER es: <strong style="font-size:26px;letter-spacing:6px">{{ .Token }}</strong></p>`
6. En **Emails → SMTP Settings** configura un proveedor de correo (Resend, Brevo, Amazon SES). El correo incluido en Supabase solo envía unos pocos mensajes y únicamente al equipo del proyecto.
7. (Opcional) Anti-bots: crea un sitio en Cloudflare **Turnstile**. Pega la Site Key en `turnstileSiteKey` y la Secret Key en Supabase → **Attack Protection → CAPTCHA**.

Si la base que entrega el ingeniero no es Supabase (por ejemplo MySQL o PostgreSQL propio), sirven las mismas tablas y reglas de `esquema.sql`. Solo hace falta una API que responda las mismas operaciones de `js/backend-local.js` (registrar, verificar código, ingresar, recuperar, crear y listar pedidos) y conectarla en `getClient()` de `js/auth-core.js`.

## Probar

1. Ejecuta `python -m http.server 8080` en la carpeta del proyecto y abre `http://localhost:8080`.
2. Agrega un producto al carrito → **Finalizar compra** → crea la cuenta → escribe el código → completa la dirección → **Confirmar pedido**.
3. En **Mi cuenta** aparece el pedido.

En modo local, para borrar las cuentas de prueba: herramientas de desarrollo (F12) → Application → Local Storage → borra las claves `vokter-db-*`.

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `js/config.js` | Modo (`local` / `supabase`) y claves públicas |
| `js/colombia.js` | Departamentos, tipos de documento y vía, límites y validaciones |
| `js/auth-core.js` | Cuentas y pedidos, mensajes de error en español |
| `js/backend-local.js` | Base de datos provisional en el navegador |
| `js/auth-ui.js` | Formularios: ingresar, registro, código, recuperación |
| `cuenta.html`, `js/cuenta.js` | Página "Mi cuenta" con perfil y pedidos |
| `js/layout.js` | Checkout de la web (exige cuenta) |
| `js/app-auth.js`, `js/app-checkout.js` | Ingreso y checkout de la app móvil |
| `css/auth.css` | Estilos de formularios, checkout y pedidos |
| `supabase/esquema.sql` | Tablas `perfiles` y `pedidos` con restricciones y seguridad |
