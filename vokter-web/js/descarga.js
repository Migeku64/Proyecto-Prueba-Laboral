// descarga.js — página de descarga de la app móvil
import { $ } from './utils.js';
import { initLayout } from './layout.js';
import { icon } from './icons.js';
import { phoneMock } from './components.js';
import { toast } from './ui.js';

// Enlace de descarga directa del APK: archivo adjunto a un Release de GitHub.
// Al publicar una nueva versión basta con subir el .apk al Release más reciente con este nombre.
// (assets/qr-app.png apunta a este mismo enlace; si lo cambias, vuelve a generar el QR.)
const APK_URL = 'https://github.com/Migeku64/Proyecto-Prueba-Laboral/releases/latest/download/app-release.apk';

const data = await initLayout();

$('#dl-btn').href = APK_URL;
$('#copy-link').innerHTML = `${icon('copy', 18)}Copiar enlace`;
$('#phone-mock').innerHTML = phoneMock(data);
$('#perk-1').innerHTML = icon('sparkle', 24);
$('#perk-2').innerHTML = icon('cart', 24);
$('#perk-3').innerHTML = icon('tag', 24);

$('#copy-link').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(APK_URL);
    toast('Enlace de descarga copiado');
  } catch {
    toast('No se pudo copiar. Mantén presionado el botón Descargar para copiarlo', 'error');
  }
});
