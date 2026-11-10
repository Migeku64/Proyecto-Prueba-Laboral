# Pagos

La tienda (web y app) cobra en 2 pasos: **envío** y **pago**. Se puede pagar con:

- Tarjeta de crédito o débito, con cuotas
- PSE
- Nequi
- Botón Bancolombia
- Efectivo (Efecty o corresponsal bancario, con código de pago)

En **Mi cuenta** cada cliente tiene:

- **Métodos de pago**: tarjetas guardadas y celular de Nequi, con un método predeterminado y la opción de eliminar.
- **Historial de pagos**: estado de cada pago y comprobante imprimible.

## Cumplimiento en Colombia

| Exigencia | Dónde está |
|---|---|
| Datos del vendedor visibles: razón social, NIT, dirección, teléfono y correo (Ley 1480, art. 50) | Pie de página, Ayuda → "Información del vendedor" y comprobante. **Completar en `js/config.js` → `empresa`.** |
| Precio total con IVA y costo de envío antes de pagar (art. 50) | Checkout → "Resumen del pedido": subtotal, envío, base gravable, IVA incluido (19 %) y total |
| Tiempo de entrega informado | Checkout → entrega estimada en días hábiles, según la ciudad (`js/config.js` → `entregas`) |
| Aceptación expresa antes de pagar | Casilla obligatoria de términos, privacidad, retracto y reversión. Se guarda la fecha de aceptación en el pedido |
| Derecho de retracto, 5 días hábiles (art. 47) | Ayuda → Devoluciones |
| Reversión del pago (art. 51 y Decreto 587 de 2016) | Ayuda → Devoluciones |
| Garantía legal | Ayuda → Devoluciones |
| Factura electrónica (DIAN) | Checkout: a nombre de la persona o de una empresa, con NIT validado con su dígito de verificación. La emisión la hace el backend con el proveedor de facturación |
| Tratamiento de datos (Ley 1581 de 2012) | Registro (autorización) y Ayuda → Privacidad y términos |
| Enlace a la autoridad de protección al consumidor | Pie de página → Superintendencia de Industria y Comercio |

> Los textos legales son una plantilla basada en la ley. El negocio que compre la tienda debe revisarlos con su asesor legal.

## Seguridad (PCI DSS)

| Regla | Cómo se cumple |
|---|---|
| La tienda nunca recibe el número completo de la tarjeta ni el CVV | Los datos de pago se escriben en la ventana de la pasarela. A la tienda solo vuelven el estado, la referencia, la marca y los últimos 4 dígitos. |
| Las tarjetas guardadas no exponen datos | Se guarda la referencia (token) que entrega la pasarela, junto con la marca, los últimos 4 dígitos y el vencimiento. Máximo 5 métodos por cliente y sin duplicados. |
| El navegador no decide que un pedido está pagado | Con la pasarela real, el estado lo registra el servidor después de consultarlo a la pasarela (`registrar-pago`) y de recibir su notificación firmada (`wompi-eventos`). Los clientes no pueden escribir en la tabla `pagos`. |
| Nadie puede pagar menos de lo debido | La firma de cada pago (`firmar-pago`) usa el total guardado en la base de datos, no el que envía el navegador. |
| Los secretos no salen del servidor | En `js/config.js` solo va la llave **pública**. El secreto de integridad y el de eventos van como *secrets* de las Edge Functions. |
| Cada cliente ve solo lo suyo | Seguridad por filas (RLS) en `pedidos`, `pagos` y `metodos_pago`. |

## Modo actual: pasarela de prueba

`js/config.js` → `pagos.pasarela: 'prueba'`. Es una pasarela simulada que funciona sin cuenta de comercio. **No cobra.**

| Tarjeta de prueba | Resultado |
|---|---|
| 4242 4242 4242 4242 (Visa) | Aprobada |
| 5555 5555 5555 4444 (Mastercard) | Aprobada |
| 3782 822463 10005 (Amex) | Aprobada |
| 4111 1111 1111 1111 | Rechazada: fondos insuficientes |
| 4000 0000 0000 0002 | Rechazada por el banco |

Sirve cualquier fecha futura y cualquier CVV. **Cualquier tarjeta real se rechaza y se borra del campo.**

- **PSE, Nequi y Botón Bancolombia** muestran una pantalla del banco simulada para aprobar o rechazar.
- **Efectivo** genera un código de pago y deja el pedido en "Pago pendiente".

## Conectar Wompi (pagos reales)

Wompi es de Bancolombia y acepta tarjetas, PSE, Nequi, Botón Bancolombia y efectivo. Los pasos son:

1. **El negocio crea su cuenta de comercio** en [comercios.wompi.co](https://comercios.wompi.co). Debe quedar a nombre del negocio, con RUT y cuenta bancaria. En **Desarrolladores** están las llaves de **pruebas** y de **producción**.
2. **Activar la base de datos real.** Sigue `docs/AUTENTICACION.md`. El archivo `supabase/esquema.sql` ya incluye las tablas `metodos_pago` y `pagos`.
3. **Desplegar las 3 funciones del servidor** (carpeta `supabase/functions/`) con el [CLI de Supabase](https://supabase.com/docs/guides/cli):
   ```bash
   supabase secrets set WOMPI_INTEGRITY_SECRET=test_integrity_... WOMPI_EVENTS_SECRET=test_events_... WOMPI_ENV=sandbox
   supabase functions deploy firmar-pago
   supabase functions deploy registrar-pago
   supabase functions deploy wompi-eventos --no-verify-jwt
   ```
4. **En el panel de Wompi**, en **URL de eventos**, pon `https://<tu-proyecto>.supabase.co/functions/v1/wompi-eventos`.
5. **En `js/config.js`:**
   ```js
   pagos: {
     pasarela: 'wompi',
     llavePublica: 'pub_test_...',        // luego pub_prod_...
     urlFirma: 'https://<tu-proyecto>.supabase.co/functions/v1/firmar-pago'
   }
   ```
6. **Prueba con las llaves de prueba** de Wompi y sus tarjetas de prueba. Cuando todo funcione, cambia a las llaves de producción y pon `WOMPI_ENV=production`.

> Con Wompi, las tarjetas guardadas necesitan su API de *payment sources*, lo que implica un paso más en el servidor. Mientras tanto, el cliente paga en el widget de Wompi cada vez y "Agregar tarjeta" muestra un aviso. Nequi sí se puede guardar.

## Otra pasarela (Mercado Pago, ePayco)

La página no depende de una pasarela en particular. En `js/payments.js` cada pasarela es un "adaptador" con la función `pagar()`, que devuelve `{ estado, referencia, metodo, detalle }`. Para agregar otra:

1. Escribe su adaptador siguiendo el de `wompi`.
2. Escribe sus funciones de firma y de notificación, siguiendo las de `supabase/functions/`.
3. Cambia `pagos.pasarela` en `js/config.js`.

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `js/payments.js` | Métodos de pago, validación de tarjetas (Luhn, vencimiento, CVV), adaptadores de pasarela, registro de pagos |
| `js/gateway-test.js` | Pasarela de prueba |
| `js/payments-ui.js` | Selector de método, resultado, métodos guardados, historial y comprobante |
| `js/layout.js`, `js/app-checkout.js` | Checkout de la web y de la app |
| `css/payments.css` | Estilos de pagos y de la pasarela |
| `supabase/esquema.sql` | Tablas `metodos_pago` y `pagos` con sus reglas |
| `supabase/functions/*` | Firma de pagos, verificación y notificaciones de Wompi |
