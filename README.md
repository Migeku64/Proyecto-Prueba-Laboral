# VOKTER

Tienda web y aplicacion movil de demostracion para productos de tecnologia urbana, audio, accesorios, footwear y bundles.

## Funcionalidades

- Inicio con hero, categorias, destacados y beneficios.
- Navegacion por modulos: Inicio, Tienda, Categorias, Bundles y Ayuda.
- Busqueda y filtrado de productos por categoria.
- Productos con favoritos y boton para agregar al carrito.
- Carrito accesible desde el menu superior y el menu inferior.
- Carrito persistente con `localStorage`, contador sincronizado, cantidades, eliminar productos y total actualizado.
- Panel del carrito con imagen o icono del producto, controles `+` y `-` y estado de envio gratis.
- Bundles Running, Tech y Home. Cada bundle agrega sus productos al carrito y muestra precio normal, descuento y ahorro.
- Checkout de demostracion sin cobros reales.
- Modo claro y modo oscuro con preferencia guardada.
- Animaciones respetando `prefers-reduced-motion`.
- Pagina de descarga con boton y codigo QR para la APK.

## Tecnologias

- HTML5
- CSS3 con variables, responsive design y animaciones
- JavaScript moderno sin frameworks ni proceso de compilacion
- SVG para iconos y elementos de marca
- Android WebView para la aplicacion movil

## Estructura principal

```text
app.html                 Aplicacion movil web de VOKTER
index.html               Pagina principal de la web
catalogo.html            Catalogo completo
producto.html            Detalle de producto
ayuda.html               Centro de ayuda
descarga.html            Descarga y QR de la APK
app.webmanifest          Configuracion PWA
sw.js                    Service worker
css/app.css              Estilos de la aplicacion movil
css/styles.css            Estilos de la web principal
js/commerce.js           Productos, favoritos y carrito movil
js/app-modules.js        Navegacion por modulos y bundles
js/cart.js               Estado del carrito de la web principal
js/descarga.js            Enlace y QR de descarga
data/products.json       Catalogo de productos
assets/qr-app.png        Codigo QR de VOKTER
descargas/vokter.apk     APK actual
android-app/              Proyecto Android WebView
```

## Ejecutar localmente

El proyecto usa `fetch` para cargar el catalogo, por lo que debe ejecutarse mediante un servidor local:

```bash
python -m http.server 8080
```

Luego abre:

```text
http://localhost:8080
```

Tambien puedes usar Live Server de VS Code.

## APK y descarga

La APK actual se encuentra en:

```text
descargas/vokter.apk
```

La web utiliza esta URL publica:

```text
https://migeku64.github.io/Proyecto-Prueba-Laboral/descargas/vokter.apk
```

El boton y el QR de `descarga.html` apuntan al mismo archivo. Para publicar una nueva version, reemplaza `descargas/vokter.apk` en el repositorio y vuelve a publicar GitHub Pages.

## Android

La aplicacion usa un WebView local con etiqueta e identidad visual VOKTER. El paquete tecnico actual es `com.krew.mobile`, con nombre visible `VOKTER`.

Configuracion actual:

- `minSdkVersion`: 21
- `targetSdkVersion`: 35
- `versionCode`: 2
- `versionName`: 1.1.0
- Icono: `android-app/res/drawable/vokter_mark.xml`

La APK debe estar firmada para instalarse en Android. Un archivo HTML no es una APK instalable por si solo.

## Datos de demostracion

El catalogo, precios, favoritos, carrito y checkout son demostrativos. El checkout no realiza cobros ni envia pedidos reales.

## Identidad visual

- Azul VOKTER: `#0A57F5`
- Violeta: `#7A4DFF`
- Amarillo de oferta: `#FFC931`
- Fondo claro: `#F1F5FC`
- Fondo oscuro: `#0A0F1F`

## Publicacion

El sitio puede publicarse como pagina estatica en GitHub Pages. Antes de publicar una nueva APK, verifica que el archivo conserve el nombre `vokter.apk` y que el QR siga apuntando a la ruta publica correcta.

## Autores

VOKTER - Proyecto de demostracion laboral.
