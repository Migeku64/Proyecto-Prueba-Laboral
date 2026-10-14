# VOKTER — Plataforma web

Plataforma web de **VOKTER**, ecosistema premium de rendimiento y tecnología urbana (sneakers, gadgets y gear esencial). Es la propuesta de aplicación web para la evaluación técnica; la aplicación móvil complementaria se descarga desde la propia web.

> Referencia analizada: https://vokter-five.vercel.app/

## Qué propone esta versión

La referencia ofrece catálogo, categorías, destacados, bundles y ayuda. Esta propuesta conserva ese contenido y lo convierte en una **plataforma** más dinámica, con una experiencia inspirada en las tiendas de consola (carrusel principal, filas de categorías y un foco que resalta lo seleccionado):

- **Foco tipo consola:** la tarjeta bajo el cursor (o el foco del teclado) sube y brilla mientras las demás se atenúan. Se puede recorrer el catálogo con las **flechas del teclado**.
- **Carrusel principal** con miniaturas que se llenan como barra de progreso, pausa al pasar el cursor, cambio de color de fondo por diapositiva, parallax y deslizamiento táctil.
- **Menú de categorías** desplegable, **buscador rápido** (`/` o `Ctrl/Cmd + K`) con resultados en vivo y navegación con flechas.
- **Tienda** con búsqueda en vivo (sin importar tildes), pestañas por categoría con indicador deslizante y filtros combinables: marca, precio máximo, calificación mínima, solo ofertas y solo nuevos. Los filtros activos se muestran como chips removibles y la URL se sincroniza (`?cat=audio&q=...`).
- **Carrito lateral** con persistencia, cantidades, barra de progreso hacia el **envío gratis desde $50.000** y checkout de demostración.
- **Bundles** (Running 15%, Tech 20%, Home 10%) que se agregan completos al carrito con el descuento aplicado.
- **Ficha de producto** con selector de color (el degradado cambia con transición), inclinación 3D, cantidad, pestañas y productos relacionados.
- **Modo claro por defecto** y modo oscuro opcional (se recuerda la elección).
- **Descarga de la app móvil:** página dedicada con botón de descarga y código QR.
- Centro de ayuda (FAQ, envíos, devoluciones, términos) y contacto.

## Identidad visual

| Rol | Valor |
| --- | --- |
| Azul VOKTER (acción principal) | `#0A57F5` |
| Violeta señal (degradados) | `#7A4DFF` |
| Amarillo oferta | `#FFC931` |
| Tinta marino (texto / footer) | `#0A1128` |
| Fondo claro | `#F1F5FC` |

Cada categoría tiene su propio degradado, que se reutiliza en tarjetas, menú, carrito y ficha para dar coherencia de marca. Tipografías: **Unbounded** (títulos) y **Manrope** (texto), vía Google Fonts.

## Tecnologías

- HTML5, CSS3 (variables, `@property` para transiciones de degradados, `color-mix`, `:has`) y JavaScript moderno con **módulos ES**.
- Sin frameworks ni build: se ejecuta como sitio estático.
- Ilustraciones de producto en SVG propio (sin imágenes externas). Para usar fotos reales basta con reemplazar el SVG de `components.js`.

## Estructura

```
├── index.html · catalogo.html · producto.html · ayuda.html · contacto.html · descarga.html
├── css/styles.css          # tokens de marca, componentes e interacciones
├── js/
│   ├── main.js             # home: carrusel, categorías, destacados, bundles
│   ├── catalogo.js         # tienda: búsqueda, filtros, orden
│   ├── producto.js         # ficha de producto
│   ├── ayuda.js · contacto.js · descarga.js
│   ├── layout.js           # header, mega menú, carrito, buscador, checkout, footer (compartido)
│   ├── components.js       # tarjeta de producto, bundle, esqueletos, teléfono
│   ├── cart.js             # estado del carrito (localStorage)
│   ├── ui.js               # toast, indicador deslizante, navegación con flechas, vuelo al carrito
│   ├── theme.js · icons.js · utils.js
├── data/                   # products.json · categories.json · bundles.json
└── assets/qr-app.png       # QR de descarga de la app
```

El header, el footer, el carrito y el buscador se inyectan desde `layout.js`, así que cada página solo define su contenido.

## Ejecutar en local

Los datos se cargan con `fetch`, por lo que hay que servir la carpeta (no abrir el HTML con doble clic):

```bash
python -m http.server 8080
# luego abrir http://localhost:8080
```

También sirve la extensión *Live Server* de VS Code o `npx serve .`.

## Descarga de la app móvil

Mecanismo: **botón + código QR** en `descarga.html` (enlazada desde el menú y la home). Ambos apuntan al APK publicado como asset de un **GitHub Release**:

```
https://github.com/Migeku64/Proyecto-Prueba-Laboral/releases/latest/download/app-release.apk
```

Para publicar la app: *Releases → Draft a new release → adjuntar el archivo con el nombre `app-release.apk` → Publish*. El enlace `latest/download/...` siempre apunta a la versión más reciente, así que no hay que tocar la web al actualizar el APK. Si cambia el nombre del archivo o el repositorio, actualizar `APK_URL` en `js/descarga.js` y regenerar `assets/qr-app.png`.

## Consideraciones

- El catálogo, las descripciones y los textos de ayuda son **datos de demostración** (los 8 productos destacados y los precios parten de la referencia). El checkout no cobra ni envía datos.
- Accesibilidad: foco visible, navegación completa por teclado, etiquetas ARIA en carrusel/pestañas y respeto de `prefers-reduced-motion`.
- Siguiente paso natural: conectar el catálogo y el carrito a una API real compartida con la app móvil.

## Autores

Web: _[tu nombre]_ · App móvil: _[nombre de tu compañero]_
