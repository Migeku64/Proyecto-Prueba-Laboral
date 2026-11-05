
import { $ } from './utils.js';
import { initLayout } from './layout.js';
import { icon } from './icons.js';
import { phoneMock } from './components.js';
import { toast } from './ui.js';


const APK_URL = 'https://migeku64.github.io/Proyecto-Prueba-Laboral/descargas/fanaticos-360.apk';

const data = await initLayout();

$('#dl-btn').href = APK_URL;
$('#dl-btn').setAttribute('download', 'fanaticos-360.apk');
document.querySelector('.dl-meta')?.replaceChildren(document.createTextNode('Android - fanaticos-360.apk - instalacion manual'));
const qrImage = document.querySelector('[data-download-qr] img');
if (qrImage) {
  const qrLink = document.createElement('a');
  qrLink.href = APK_URL;
  qrLink.setAttribute('aria-label', 'Descargar APK de Fanaticos 360');
  qrLink.className = 'qr-link';
  qrImage.replaceWith(qrLink);
  qrLink.appendChild(qrImage);
}
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
