// gateway-test.js — pasarela de pagos SIMULADA para trabajar sin cuenta de comercio.
// Se comporta como una pasarela real (ventana propia, resultados aprobado/rechazado/pendiente)
// pero solo acepta tarjetas de prueba y nunca cobra. Cualquier tarjeta real se rechaza y se borra.
// Nada de lo que se escribe aquí se guarda: a la tienda solo vuelve marca, últimos 4 y estado.
import * as PG from './payments.js';
import { BANCOS_PSE } from './payments.js';
import { TIPOS_DOCUMENTO, validarCelular, normalizarCelular, filtrarEntrada, validarDocumento, validarNombres } from './colombia.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const peso = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

// Tarjetas de prueba (las mismas que publican las pasarelas para sus ambientes de prueba).
export const TARJETAS_PRUEBA = {
  '4242424242424242': { estado: 'aprobado' },
  '5555555555554444': { estado: 'aprobado' },
  '378282246310005': { estado: 'aprobado' },
  '36227206271667': { estado: 'aprobado' },
  '4111111111111111': { estado: 'rechazado', mensaje: 'Fondos insuficientes.' },
  '4000000000000002': { estado: 'rechazado', mensaje: 'El banco rechazó la transacción.' }
};

const lock = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>';
const referencia = () => 'PRB-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
const token = () => 'tok_prueba_' + Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, '0')).join('');

function field(id, label, input, extra = '') {
  return `<div class="gw-field" data-gw="${id}"><label for="${id}">${label}</label>${input}${extra}<small class="gw-err" id="${id}-err"></small></div>`;
}

function shell({ titulo, monto, cuerpo }) {
  return `
  <div class="gw-top">
    <div class="gw-brand">${lock}<span>Pasarela segura</span></div>
    <button type="button" class="gw-x" data-gw-close aria-label="Cerrar y volver a la tienda">×</button>
  </div>
  <div class="gw-test" role="note"><strong>MODO DE PRUEBA</strong> · No se cobra dinero. No ingreses tarjetas reales.</div>
  <div class="gw-merchant"><div><small>Comercio</small><strong>VOKTER</strong></div>${monto != null ? `<div class="gw-amount"><small>Total a pagar</small><strong>${peso.format(monto)}</strong></div>` : ''}</div>
  <h2 class="gw-title">${titulo}</h2>
  <div class="gw-body">${cuerpo}</div>
  <p class="gw-foot">${lock}<span>Tus datos se transmiten cifrados a la pasarela. VOKTER no ve ni guarda el número de tu tarjeta ni el código de seguridad.</span></p>`;
}

function abrir(html) {
  const dlg = document.createElement('dialog');
  dlg.className = 'gw';
  dlg.setAttribute('aria-label', 'Pasarela de pagos');
  dlg.innerHTML = html;
  document.body.appendChild(dlg);
  dlg.showModal();
  dlg.querySelectorAll('[data-filter]').forEach((el) => filtrarEntrada(el, el.dataset.filter));
  return dlg;
}

function esperar(dlg, ms) {
  dlg.querySelector('.gw-body').innerHTML = `<div class="gw-wait"><span class="gw-spin"></span><p>Procesando con el banco…</p></div>`;
  return new Promise((r) => setTimeout(r, ms));
}

function err(dlg, id, text) {
  const e = dlg.querySelector(`#${id}-err`); if (e) e.textContent = text || '';
  dlg.querySelector(`[data-gw="${id}"]`)?.classList.toggle('bad', Boolean(text));
  return !text;
}

// ---------- Formulario de tarjeta ----------
function formTarjeta({ cobro, guardar, comprador }) {
  const cuotas = Array.from({ length: 36 }, (_, i) => `<option value="${i + 1}">${i + 1} ${i ? 'cuotas' : 'cuota'}</option>`).join('');
  return `<form class="gw-form" data-form="tarjeta" novalidate autocomplete="off">
    ${field('gw-num', 'Número de la tarjeta', '<div class="gw-cardnum"><input id="gw-num" inputmode="numeric" maxlength="23" autocomplete="off" placeholder="0000 0000 0000 0000" spellcheck="false"><span class="gw-brandtag" id="gw-brandtag"></span></div>')}
    ${field('gw-tit', 'Nombre como aparece en la tarjeta', `<input id="gw-tit" maxlength="40" autocomplete="off" data-filter="letras" value="${esc((comprador?.nombre || '').toUpperCase())}">`)}
    <div class="gw-two">
      ${field('gw-ven', 'Vence (MM/AA)', '<input id="gw-ven" inputmode="numeric" maxlength="5" placeholder="MM/AA" autocomplete="off">')}
      ${field('gw-cvv', 'Código de seguridad', '<input id="gw-cvv" type="password" inputmode="numeric" maxlength="4" placeholder="CVV" autocomplete="off">')}
    </div>
    ${cobro ? field('gw-cuo', 'Número de cuotas', `<select id="gw-cuo">${cuotas}</select>`, '<small class="gw-hint">Con tarjeta débito se paga en 1 cuota.</small>') : ''}
    ${guardar ? '<label class="gw-check"><input type="checkbox" id="gw-save"> Guardar esta tarjeta para mis próximas compras</label>' : ''}
    <div class="gw-help"><strong>Tarjetas de prueba</strong><span>Aprobada: 4242 4242 4242 4242 · 5555 5555 5555 4444</span><span>Rechazada: 4111 1111 1111 1111 · Cualquier fecha futura y CVV</span></div>
    <button type="submit" class="gw-pay">${lock}${cobro ? `Pagar ${peso.format(cobro)}` : 'Verificar y guardar tarjeta'}</button>
  </form>`;
}

function leerTarjeta(dlg) {
  const num = PG.soloDigitos(dlg.querySelector('#gw-num').value);
  const marca = PG.marcaTarjeta(num);
  const ven = dlg.querySelector('#gw-ven').value;
  const cvv = dlg.querySelector('#gw-cvv').value;
  const tit = dlg.querySelector('#gw-tit').value;
  let numErr = PG.validarNumeroTarjeta(num);
  if (!numErr && !TARJETAS_PRUEBA[num]) {
    numErr = 'Modo de prueba: usa una de las tarjetas de prueba. Las tarjetas reales no se aceptan.';
    dlg.querySelector('#gw-num').value = '';
  }
  const ok = [
    err(dlg, 'gw-num', numErr),
    err(dlg, 'gw-tit', validarNombres(tit, 'datos del titular')),
    err(dlg, 'gw-ven', PG.validarVencimiento(ven)),
    err(dlg, 'gw-cvv', PG.validarCVV(cvv, marca))
  ];
  dlg.querySelector('#gw-cvv').value = ''; // el CVV nunca se conserva
  if (ok.includes(false)) return null;
  const vence = ven.replace(/\s/g, '');
  return {
    prueba: TARJETAS_PRUEBA[num],
    tarjeta: { tipo: 'tarjeta', marca, ultimos4: num.slice(-4), vence, titular: tit.trim().toUpperCase(), token: token(), huella: `${marca}-${num.slice(-4)}-${vence}` },
    cuotas: Number(dlg.querySelector('#gw-cuo')?.value || 1),
    guardar: Boolean(dlg.querySelector('#gw-save')?.checked)
  };
}

function enlazarTarjeta(dlg) {
  const num = dlg.querySelector('#gw-num');
  num.addEventListener('input', () => {
    num.value = PG.formatoNumero(num.value);
    const m = PG.marcaTarjeta(num.value);
    const tag = dlg.querySelector('#gw-brandtag'); tag.textContent = m; tag.dataset.marca = m;
    dlg.querySelector('#gw-cvv').maxLength = m === 'American Express' ? 4 : 3;
  });
  const ven = dlg.querySelector('#gw-ven');
  ven.addEventListener('input', () => {
    const d = PG.soloDigitos(ven.value).slice(0, 4);
    ven.value = d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  });
  dlg.querySelector('#gw-cvv').addEventListener('input', (e) => { e.target.value = PG.soloDigitos(e.target.value); });
}

// ---------- Pantalla del banco (PSE, Botón Bancolombia, Nequi) ----------
function bancoSimulado(dlg, { titulo, texto }) {
  return new Promise((resolve) => {
    dlg.querySelector('.gw-title').textContent = titulo;
    dlg.querySelector('.gw-body').innerHTML = `<div class="gw-bank">
      <p>${texto}</p>
      <div class="gw-sim"><small>Simulación del banco</small>
        <button type="button" class="gw-pay" data-r="aprobado">Aprobar el pago</button>
        <button type="button" class="gw-ghost" data-r="rechazado">Rechazar</button></div></div>`;
    dlg.querySelector('.gw-bank').addEventListener('click', (e) => { const b = e.target.closest('[data-r]'); if (b) resolve(b.dataset.r); });
  });
}

function ciclo(dlg, onSubmit) {
  return new Promise((resolve) => {
    dlg.addEventListener('click', (e) => { if (e.target.closest('[data-gw-close]')) { dlg.close(); resolve(null); } });
    dlg.addEventListener('cancel', (e) => { e.preventDefault(); dlg.close(); resolve(null); });
    dlg.addEventListener('close', () => setTimeout(() => dlg.remove(), 50));
    dlg.addEventListener('submit', async (e) => {
      e.preventDefault();
      const r = await onSubmit(e.target);
      if (r) { dlg.close(); resolve(r); }
    });
  });
}

export const gatewayPrueba = {
  async pagar({ pedido, metodo, guardado, comprador }) {
    const monto = pedido.total;
    const ref = referencia();
    const docOpts = TIPOS_DOCUMENTO.filter((t) => t.id !== 'PPT').map((t) => `<option value="${t.id}"${t.id === comprador?.tipo_documento ? ' selected' : ''}>${t.id}</option>`).join('') + '<option value="NIT">NIT</option>';
    let titulo; let cuerpo;
    if (metodo === 'tarjeta') { titulo = 'Paga con tarjeta'; cuerpo = formTarjeta({ cobro: monto, guardar: true, comprador }); }
    else if (metodo === 'tarjeta_guardada') {
      titulo = `${esc(guardado.marca)} ${PG.enmascarar(guardado.ultimos4)}`;
      cuerpo = `<form class="gw-form" data-form="guardada" novalidate autocomplete="off">
        <p class="gw-note">Confirma el código de seguridad de tu tarjeta guardada (vence ${esc(guardado.vence)}).</p>
        ${field('gw-cvv', 'Código de seguridad', `<input id="gw-cvv" type="password" inputmode="numeric" maxlength="${guardado.marca === 'American Express' ? 4 : 3}" autocomplete="off" data-filter="digitos">`)}
        ${field('gw-cuo', 'Número de cuotas', `<select id="gw-cuo">${Array.from({ length: 36 }, (_, i) => `<option value="${i + 1}">${i + 1} ${i ? 'cuotas' : 'cuota'}</option>`).join('')}</select>`)}
        <button type="submit" class="gw-pay">${lock}Pagar ${peso.format(monto)}</button></form>`;
    } else if (metodo === 'pse') {
      titulo = 'Paga con PSE';
      cuerpo = `<form class="gw-form" data-form="pse" novalidate autocomplete="off">
        ${field('gw-per', 'Tipo de persona', '<select id="gw-per"><option value="natural">Persona natural</option><option value="juridica">Persona jurídica</option></select>')}
        ${field('gw-banco', 'Banco', `<select id="gw-banco"><option value="">Elige tu banco…</option>${BANCOS_PSE.map((b) => `<option>${b}</option>`).join('')}</select>`)}
        <div class="gw-two">${field('gw-tdoc', 'Documento', `<select id="gw-tdoc">${docOpts}</select>`)}
          ${field('gw-doc', 'Número', `<input id="gw-doc" inputmode="numeric" maxlength="10" data-filter="digitos" value="${esc(comprador?.documento || '')}">`)}</div>
        <button type="submit" class="gw-pay">${lock}Ir a mi banco</button></form>`;
    } else if (metodo === 'nequi') {
      titulo = 'Paga con Nequi';
      cuerpo = `<form class="gw-form" data-form="nequi" novalidate autocomplete="off">
        ${field('gw-cel', 'Celular registrado en Nequi', `<input id="gw-cel" type="tel" inputmode="numeric" maxlength="12" data-filter="celular" value="${esc(comprador?.celular || '')}">`)}
        <button type="submit" class="gw-pay">${lock}Enviar notificación a Nequi</button></form>`;
    } else if (metodo === 'bancolombia') {
      titulo = 'Botón Bancolombia';
      cuerpo = `<form class="gw-form" data-form="bancolombia" novalidate><p class="gw-note">Te llevaremos a tu Sucursal Virtual Personas para aprobar el pago con tu usuario y clave del banco.</p>
        <button type="submit" class="gw-pay">${lock}Continuar a Bancolombia</button></form>`;
    } else {
      titulo = 'Paga en efectivo';
      cuerpo = `<form class="gw-form" data-form="efectivo" novalidate><p class="gw-note">Generaremos un código para que pagues en Efecty o en un corresponsal bancario. Tu pedido se confirma cuando recibamos el pago.</p>
        <button type="submit" class="gw-pay">Generar código de pago</button></form>`;
    }
    const dlg = abrir(shell({ titulo, monto, cuerpo }));
    if (metodo === 'tarjeta') enlazarTarjeta(dlg);

    const r = await ciclo(dlg, async (form) => {
      const tipo = form.dataset.form;
      if (tipo === 'tarjeta') {
        const t = leerTarjeta(dlg); if (!t) return null;
        await esperar(dlg, 1400);
        return { estado: t.prueba.estado, mensaje: t.prueba.mensaje || null, referencia: ref, metodo: 'tarjeta',
          detalle: { marca: t.tarjeta.marca, ultimos4: t.tarjeta.ultimos4, cuotas: t.cuotas }, guardar: t.guardar && t.prueba.estado === 'aprobado', tarjeta: t.tarjeta };
      }
      if (tipo === 'guardada') {
        if (!err(dlg, 'gw-cvv', PG.validarCVV(dlg.querySelector('#gw-cvv').value, guardado.marca))) return null;
        const cuotas = Number(dlg.querySelector('#gw-cuo').value);
        await esperar(dlg, 1200);
        return { estado: 'aprobado', referencia: ref, metodo: 'tarjeta', detalle: { marca: guardado.marca, ultimos4: guardado.ultimos4, cuotas } };
      }
      if (tipo === 'pse') {
        const banco = dlg.querySelector('#gw-banco').value; const tdoc = dlg.querySelector('#gw-tdoc').value; const doc = dlg.querySelector('#gw-doc').value;
        const ok = [err(dlg, 'gw-banco', banco ? '' : 'Elige tu banco.'),
          err(dlg, 'gw-doc', tdoc === 'NIT' ? (/^\d{9,10}$/.test(doc) ? '' : 'El NIT tiene 9 o 10 dígitos, sin dígito de verificación.') : validarDocumento(tdoc, doc))];
        if (ok.includes(false)) return null;
        const res = await bancoSimulado(dlg, { titulo: banco, texto: `Estás pagando ${peso.format(monto)} a VOKTER desde ${esc(banco)}.` });
        await esperar(dlg, 900);
        return { estado: res, mensaje: res === 'rechazado' ? 'El banco no aprobó el débito.' : null, referencia: ref, metodo: 'pse', detalle: { banco, persona: dlg.querySelector('#gw-per')?.value || 'natural' } };
      }
      if (tipo === 'nequi') {
        const cel = dlg.querySelector('#gw-cel').value;
        if (!err(dlg, 'gw-cel', validarCelular(cel))) return null;
        const n = normalizarCelular(cel);
        const res = await bancoSimulado(dlg, { titulo: 'Revisa tu app Nequi', texto: `Enviamos una notificación al ${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}. Ábrela y acepta el pago de ${peso.format(monto)}.` });
        await esperar(dlg, 900);
        return { estado: res, mensaje: res === 'rechazado' ? 'El pago fue rechazado desde la app Nequi.' : null, referencia: ref, metodo: 'nequi', detalle: { celular: n } };
      }
      if (tipo === 'bancolombia') {
        const res = await bancoSimulado(dlg, { titulo: 'Sucursal Virtual Personas', texto: `Aprueba el pago de ${peso.format(monto)} a VOKTER.` });
        await esperar(dlg, 900);
        return { estado: res, referencia: ref, metodo: 'bancolombia', detalle: {} };
      }
      await esperar(dlg, 700);
      const codigo = String(Math.floor(10000000 + Math.random() * 89999999));
      return { estado: 'pendiente', referencia: ref, metodo: 'efectivo', detalle: { codigo, convenio: '110757', vence: new Date(Date.now() + 72 * 3600e3).toISOString() },
        mensaje: 'Paga en Efecty o un corresponsal antes de 72 horas.' };
    });
    return r || { estado: 'cancelado' };
  },

  // Verifica una tarjeta y devuelve solo su referencia segura (token) y datos para mostrar.
  async tokenizar({ comprador }) {
    const dlg = abrir(shell({ titulo: 'Agregar tarjeta', monto: null, cuerpo: formTarjeta({ cobro: 0, guardar: false, comprador }) }));
    enlazarTarjeta(dlg);
    return ciclo(dlg, async () => {
      const t = leerTarjeta(dlg); if (!t) return null;
      if (t.prueba.estado !== 'aprobado') { err(dlg, 'gw-num', `El banco no aprobó la verificación: ${t.prueba.mensaje}`); return null; }
      await esperar(dlg, 1100);
      return t.tarjeta;
    });
  }
};
