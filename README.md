# KREW — Evolución de VOKTER

Propuesta técnica desarrollada como evolución de la plataforma de referencia [VOKTER](https://vokter-five.vercel.app/), entregada como parte de una prueba de evaluación técnica.

KREW es una tienda urbana de tecnología y streetwear (audio, calzado, apparel, gadgets, hogar y gaming) con foco en:

- Buscador y filtros combinables (categoría, rango de precio, solo ofertas) que VOKTER no ofrece.
- Modo oscuro / claro persistente.
- Diseño propio con identidad visual distinta a la referencia (tipografía industrial condensada + tipografía técnica, tarjetas de borde recto identificadas por color de categoría en vez de tarjetas genéricas con sombra).
- Página dedicada de descarga de la app móvil, con botón directo y código QR.

## Tecnologías utilizadas

- HTML5, CSS3 (variables nativas para theming, sin frameworks de CSS).
- JavaScript vanilla (ES6+), sin dependencias ni build step.
- Datos de catálogo simulados en `data/products.json`.
- Tipografías: [Big Shoulders Display](https://fonts.google.com/specimen/Big+Shoulders+Display) e [IBM Plex Sans](https://fonts.google.com/specimen/IBM+Plex+Sans) vía Google Fonts.

## Estructura del proyecto

```
vokter-evolution/
├── index.html          # Página de inicio (hero + destacados por categoría)
├── catalogo.html        # Catálogo completo con buscador y filtros
├── producto.html         # Detalle de un producto (?id=)
├── contacto.html         # Formulario de contacto
├── descarga.html          # Descarga de la app móvil (botón + QR)
├── css/
│   └── styles.css         # Tokens de color/tipografía y estilos de todo el sitio
├── js/
│   ├── theme.js            # Toggle de modo oscuro/claro con localStorage
│   ├── icons.js             # Íconos SVG inline por categoría
│   ├── utils.js              # Formato de precio, carga de productos, render de tarjetas
│   ├── main.js                 # Lógica de la home (destacados por categoría)
│   └── catalogo.js              # Buscador en vivo + filtros + orden del catálogo
├── data/
│   └── products.json            # Catálogo simulado (12 productos, 6 categorías)
├── assets/
│   └── qr-app.png                 # QR de ejemplo apuntando a la descarga del APK
├── descargas/                      # Carpeta destino sugerida si se sirve el .apk desde el repo
└── README.md
```

## Cómo instalar y ejecutar localmente

Como el catálogo se carga con `fetch()`, el sitio debe abrirse desde un servidor local (abrir el `index.html` con doble clic no funciona por restricciones de seguridad del navegador). Opciones:

**Con Python (viene preinstalado en la mayoría de sistemas):**
```bash
cd vokter-evolution
python3 -m http.server 8080
```
Luego abre `http://localhost:8080` en el navegador.

**Con la extensión "Live Server" de VS Code:**
Clic derecho sobre `index.html` → "Open with Live Server".

**Con Node.js:**
```bash
npx serve .
```

## Funcionalidades implementadas

- **Catálogo dinámico**: los productos se cargan desde `data/products.json` y se renderizan con JS.
- **Buscador en vivo**: filtra por nombre o descripción mientras se escribe.
- **Filtros combinables**: categoría (multi-selección), rango de precio (mín/máx) y "solo ofertas", todos aplicables al mismo tiempo.
- **Orden de resultados**: por precio (asc/desc) o nombre.
- **Modo oscuro/claro**: toggle en el header, persistente entre sesiones (`localStorage`) y que respeta la preferencia del sistema operativo si el usuario no ha elegido una manualmente.
- **Página de producto**: detalle individual accedido por `producto.html?id=...`.
- **Descarga de la app móvil**: página dedicada con botón de descarga directa y código QR, según lo solicitado en el requerimiento.

## Descarga aplicación móvil

El mecanismo elegido es un **botón de descarga directa + código QR** en `descarga.html`, apuntando al `.apk` publicado como **Release de GitHub** (no versionado directamente en el repositorio, para no inflar el historial de git con binarios).


## Autor

Aplicativo web desarrollado por Miguel Pinilla como parte de la prueba técnica. La aplicación móvil fue desarrollada por Santiago Perez.
