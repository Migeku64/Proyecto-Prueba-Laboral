(function () {
  const authScreen = document.querySelector('#auth-screen');
  const storeApp = document.querySelector('#store-app');
  const loginForm = document.querySelector('#login-form');
  const registerForm = document.querySelector('#register-form');
  const loginMessage = document.querySelector('#login-message');
  const registerMessage = document.querySelector('#register-message');
  const authTitle = document.querySelector('#auth-title');
  const authSubtitle = document.querySelector('#auth-subtitle');

  function getUsers() {
    try { return JSON.parse(localStorage.getItem('krew-users') || '[]'); }
    catch { return []; }
  }

  function enterStore(user) {
    localStorage.setItem('krew-session', JSON.stringify({ name: user.name, email: user.email }));
    authScreen.classList.add('is-hidden');
    storeApp.classList.remove('is-hidden');
  }

  function setMode(mode) {
    const register = mode === 'register';
    document.querySelectorAll('[data-auth-mode]').forEach(tab => tab.classList.toggle('active', tab.dataset.authMode === mode));
    loginForm.classList.toggle('is-hidden', register);
    registerForm.classList.toggle('is-hidden', !register);
    authTitle.textContent = register ? 'Crea tu cuenta KREW' : 'Bienvenido a KREW';
    authSubtitle.textContent = register ? 'Guarda tus favoritos y recibe novedades de la colección.' : 'Inicia sesión para guardar favoritos y continuar comprando.';
    loginMessage.textContent = '';
    registerMessage.textContent = '';
  }

  document.querySelectorAll('[data-auth-mode]').forEach(tab => tab.addEventListener('click', () => setMode(tab.dataset.authMode)));
  registerForm.addEventListener('submit', event => {
    event.preventDefault();
    const user = {
      name: document.querySelector('#register-name').value.trim(),
      email: document.querySelector('#register-email').value.trim().toLowerCase(),
      password: document.querySelector('#register-password').value
    };
    const users = getUsers();
    if (users.some(item => item.email === user.email)) { registerMessage.textContent = 'Ya existe una cuenta con ese correo.'; return; }
    users.push(user);
    localStorage.setItem('krew-users', JSON.stringify(users));
    enterStore(user);
  });
  loginForm.addEventListener('submit', event => {
    event.preventDefault();
    const email = document.querySelector('#login-email').value.trim().toLowerCase();
    const password = document.querySelector('#login-password').value;
    const user = getUsers().find(item => item.email === email && item.password === password);
    if (!user) { loginMessage.textContent = 'Correo o contraseña incorrectos.'; return; }
    enterStore(user);
  });

  const savedSession = JSON.parse(localStorage.getItem('krew-session') || 'null');
  if (savedSession) enterStore(savedSession);

  const accountButton = document.querySelector('#account-button');
  accountButton.addEventListener('click', event => {
    event.stopImmediatePropagation();
    localStorage.removeItem('krew-session');
    storeApp.classList.add('is-hidden');
    authScreen.classList.remove('is-hidden');
    setMode('login');
  }, true);
})();
