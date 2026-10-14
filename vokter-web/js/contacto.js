// contacto.js — formulario de contacto (demostración: no envía datos a ningún servidor)
import { $, $$ } from './utils.js';
import { initLayout } from './layout.js';
import { icon } from './icons.js';
import { toast } from './ui.js';

await initLayout();

$('#info-list').innerHTML = `
  <a class="info-item" href="https://instagram.com/vokter" target="_blank" rel="noopener">
    <span class="benefit-ico">${icon('instagram', 22)}</span>
    <div><strong>Instagram</strong><span>@vokter</span></div>
  </a>
  <a class="info-item" href="https://tiktok.com/@vokter" target="_blank" rel="noopener">
    <span class="benefit-ico">${icon('music', 22)}</span>
    <div><strong>TikTok</strong><span>@vokter</span></div>
  </a>
  <a class="info-item" href="ayuda.html#faq">
    <span class="benefit-ico">${icon('clock', 22)}</span>
    <div><strong>Preguntas frecuentes</strong><span>Respuestas inmediatas sobre envíos y pedidos</span></div>
  </a>`;

const form = $('#contact-form');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = form.email;
  const invalid = $$('input[required], textarea[required]', form).find((el) => !el.value.trim());
  if (invalid) {
    invalid.focus();
    toast('Completa tu nombre, correo y mensaje', 'error');
    return;
  }
  if (!/^\S+@\S+\.\S+$/.test(email.value.trim())) {
    email.focus();
    toast('Escribe un correo válido', 'error');
    return;
  }
  toast('Mensaje enviado. Te responderemos pronto');
  form.reset();
});
