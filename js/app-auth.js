// app-auth.js — acceso a la app móvil con la misma cuenta real de la web (Supabase).
import { mountAuth } from './auth-ui.js';
import * as A from './auth-core.js';

const authScreen = document.querySelector('#auth-screen');
const storeApp = document.querySelector('#store-app');
const mount = document.querySelector('#auth-mount');

function enterStore() {
  authScreen.classList.add('is-hidden');
  storeApp.classList.remove('is-hidden');
}
function showLogin(view = 'login') {
  storeApp.classList.add('is-hidden');
  authScreen.classList.remove('is-hidden');
  mountAuth(mount, { initialView: view, syncHash: false, onSignedIn: (user) => { if (user) enterStore(); } });
}

// Botón de cuenta: cerrar sesión.
document.querySelector('#account-button')?.addEventListener('click', async (event) => {
  event.stopImmediatePropagation();
  try { await A.signOut(); } finally { showLogin('login'); }
}, true);

const user = await A.currentUser();
if (user && user.email_confirmed_at) enterStore();
else showLogin();
A.onAuthChange((u) => { if (!u && !storeApp.classList.contains('is-hidden')) showLogin(); });
