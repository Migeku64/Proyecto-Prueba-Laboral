// payments-ui.js — piezas visuales de pagos: selector de método, resultado, métodos guardados,
// historial y comprobante. Las usan el checkout de la web, la app y "Mi cuenta".
import * as PG from './payments.js';
import { CONFIG } from './config.js';
import { desgloseIVA } from './colombia.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const peso = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const fecha = (iso) => new Date(iso).toLocaleString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
const corto = (id) => 'VK-' + String(id).replace(/-/g, '').slice(0, 8).toUpperCase();

const SVG = {
  card: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6 15h4"/>',
  bank: '<path d="M3 10h18L12 4 3 10Z"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/>',
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18h2"/>',
  cash: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.8"/><path d="M6 9v.01M18 15v.01"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  star: '<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5Z"/>',
  receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6M9 12h6"/>'
};
export const ico = (n, s = 20) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SVG[n] || ''}</svg>`;

export function marcaChip(marca) {
  const cls = { Visa: 'visa', Mastercard: 'mc', 'American Express': 'amex', 'Diners Club': 'diners' }[marca] || 'gen';
  const txt = { Visa: 'VISA', Mastercard: 'MC', 'American Express': 'AMEX', 'Diners Club': 'DINERS' }[marca] || 'CARD';
  return `<span class="pm-brand pm-${cls}" aria-label="${esc(marca || 'Tarjeta')}">${txt}</span>`;
}

function describeMetodo(m) {
  if (m.tipo === 'tarjeta') return { titulo: `${m.marca} ${PG.enmascarar(m.ultimos4)}`, sub: `Vence ${m.vence} · ${m.titular || ''}`, marca: marcaChip(m.marca) };
  if (m.tipo === 'nequi') return { titulo: `Nequi ${m.celular.slice(0, 3)} ${m.celular.slice(3, 6)} ${m.celular.slice(6)}`, sub: 'Celular para pagos con Nequi', marca: `<span class="pm-ico">${ico('phone')}</span>` };
  return { titulo: m.tipo, sub: '', marca: '' };
}

// ---------- Selector de método (checkout) ----------
export function mountPicker(container, { guardados = [], name = 'metodo' } = {}) {
  const tarjetas = guardados.filter((g) => g.tipo === 'tarjeta');
  const nequi = guardados.find((g) => g.tipo === 'nequi' && g.predeterminado) || guardados.find((g) => g.tipo === 'nequi');
  const opcion = (value, titulo, sub, marca, extra = '') => `
    <label class="pm-opt"><input type="radio" name="${name}" value="${esc(value)}" ${extra}>
      <span class="pm-mark">${marca}</span><span class="pm-txt"><strong>${titulo}</strong><small>${sub}</small></span><span class="pm-radio" aria-hidden="true"></span></label>`;
  const pre = guardados.find((g) => g.predeterminado);
  container.innerHTML = `
    ${tarjetas.length ? `<p class="pm-group">Tus tarjetas guardadas</p>${tarjetas.map((t) => {
      const d = describeMetodo(t);
      return opcion(`guardada:${t.id}`, esc(d.titulo), esc(d.sub), d.marca, pre?.id === t.id ? 'checked' : '');
    }).join('')}<p class="pm-group">Otros métodos</p>` : ''}
    ${PG.METODOS.map((m) => opcion(m.id, esc(m.nombre), esc(m.id === 'nequi' && nequi ? `Celular guardado ${nequi.celular}` : m.detalle),
      `<span class="pm-ico">${ico(m.icono)}</span>`, !pre && m.id === 'tarjeta' ? 'checked' : (pre?.tipo === 'nequi' && m.id === 'nequi' ? 'checked' : ''))).join('')}
    <p class="pm-secure">${ico('lock', 15)}<span>Pago procesado por una pasarela certificada PCI DSS. VOKTER nunca ve ni guarda el número de tu tarjeta.</span></p>`;
  return {
    seleccion() {
      const v = container.querySelector(`input[name="${name}"]:checked`)?.value;
      if (!v) return null;
      if (v.startsWith('guardada:')) return { metodo: 'tarjeta_guardada', guardado: tarjetas.find((t) => t.id === v.slice(9)) };
      return { metodo: v, guardado: v === 'nequi' ? nequi : null };
    }
  };
}

// ---------- Resultado del pago ----------
export function resultadoHTML(r, pedido) {
  const d = r.detalle || {};
  const medio = r.metodo === 'tarjeta' ? `${d.marca} ${PG.enmascarar(d.ultimos4)}${d.cuotas > 1 ? ` · ${d.cuotas} cuotas` : ''}`
    : r.metodo === 'pse' ? `PSE · ${d.banco}` : r.metodo === 'nequi' ? `Nequi · ${d.celular}` : PG.nombreMetodo(r.metodo);
  const conf = {
    aprobado: ['ok', 'check', '¡Pago aprobado!', 'Recibimos tu pago. Te avisaremos cuando despachemos tu pedido.'],
    pendiente: ['wait', 'clock', 'Pago pendiente', r.mensaje || 'Estamos esperando la confirmación del banco.'],
    rechazado: ['bad', 'x', 'Pago rechazado', r.mensaje || 'El pago no fue aprobado. Puedes intentarlo con otro método.'],
    error: ['bad', 'x', 'No pudimos procesar el pago', 'Inténtalo de nuevo en unos minutos.']
  }[r.estado] || ['wait', 'clock', 'Pago en proceso', ''];
  return `
    <div class="pr pr-${conf[0]}">
      <div class="pr-ico">${ico(conf[1], 34)}</div>
      <h2>${conf[2]}</h2>
      <p>${esc(conf[3])}</p>
      <dl class="pr-data">
        <dt>Pedido</dt><dd>${esc(corto(pedido.id))}</dd>
        <dt>Valor</dt><dd>${peso.format(pedido.total)}</dd>
        <dt>Medio de pago</dt><dd>${esc(medio)}</dd>
        <dt>Referencia</dt><dd class="pr-ref">${esc(r.referencia)}</dd>
        ${r.metodo === 'efectivo' && d.codigo ? `<dt>Código de pago</dt><dd class="pr-code">${esc(d.codigo)}</dd><dt>Convenio</dt><dd>${esc(d.convenio)}</dd><dt>Paga antes de</dt><dd>${esc(fecha(d.vence))}</dd>` : ''}
      </dl>
      ${r.guardada ? `<p class="pr-note">${ico('check', 15)} Guardamos tu tarjeta de forma segura para tus próximas compras.</p>` : ''}
      ${r.avisoGuardar ? `<p class="pr-note">${esc(r.avisoGuardar)}</p>` : ''}
    </div>`;
}

// ---------- Métodos guardados (Mi cuenta) ----------
export async function mountMetodos(container, { comprador, toast }) {
  const pintar = async () => {
    let lista = [];
    try { lista = await PG.misMetodos(); } catch (e) { container.innerHTML = `<p class="pf-loading">${esc(e.message)}</p>`; return; }
    container.innerHTML = `
      <div class="pm-list">${lista.length ? lista.map((m) => {
        const d = describeMetodo(m);
        return `<div class="pm-saved${m.predeterminado ? ' is-default' : ''}">
          <span class="pm-mark">${d.marca}</span>
          <span class="pm-txt"><strong>${esc(d.titulo)}</strong><small>${esc(d.sub)}</small></span>
          ${m.predeterminado ? `<span class="pm-default">${ico('star', 13)}Predeterminado</span>` : `<button type="button" class="pm-act" data-def="${esc(m.id)}">Usar por defecto</button>`}
          <button type="button" class="pm-del" data-del="${esc(m.id)}" aria-label="Eliminar ${esc(d.titulo)}">${ico('trash', 18)}</button>
        </div>`;
      }).join('') : `<div class="pm-none">${ico('card', 26)}<p>No tienes métodos guardados. Al pagar con tarjeta puedes guardarla, o agrégala aquí.</p></div>`}</div>
      <div class="pm-add">
        <button type="button" class="btn btn-primary" data-add="tarjeta">${ico('card', 18)}Agregar tarjeta</button>
        <button type="button" class="btn btn-ghost" data-add="nequi">${ico('phone', 18)}Agregar Nequi</button>
      </div>
      <form class="pm-nequi" hidden novalidate>
        <label for="pm-nequi-cel">Celular de Nequi</label>
        <div class="pm-nequi-row"><div class="au-prefix"><span>+57</span><input type="tel" id="pm-nequi-cel" inputmode="numeric" maxlength="12" placeholder="300 123 4567"></div>
          <button type="submit" class="btn btn-primary">Guardar</button><button type="button" class="btn btn-ghost" data-cancel>Cancelar</button></div>
        <small class="au-error" id="pm-nequi-err"></small>
      </form>
      <p class="pm-secure">${ico('lock', 15)}<span>Las tarjetas se guardan como una referencia cifrada de la pasarela de pagos. VOKTER no almacena números de tarjeta ni códigos de seguridad.</span></p>`;
  };
  container.addEventListener('click', async (e) => {
    const b = e.target.closest('button'); if (!b) return;
    try {
      if (b.dataset.add === 'tarjeta') { const t = await PG.agregarTarjeta(comprador); if (t) { toast('Tarjeta guardada'); await pintar(); } }
      else if (b.dataset.add === 'nequi') { const f = container.querySelector('.pm-nequi'); f.hidden = false; f.querySelector('input').focus(); }
      else if (b.hasAttribute('data-cancel')) { container.querySelector('.pm-nequi').hidden = true; }
      else if (b.dataset.def) { await PG.metodoPredeterminado(b.dataset.def); toast('Método predeterminado actualizado'); await pintar(); }
      else if (b.dataset.del) {
        if (b.dataset.confirm !== '1') { b.dataset.confirm = '1'; b.classList.add('is-confirm'); b.innerHTML = 'Eliminar'; setTimeout(() => { if (b.isConnected) { b.dataset.confirm = ''; b.classList.remove('is-confirm'); b.innerHTML = ico('trash', 18); } }, 3500); return; }
        await PG.eliminarMetodo(b.dataset.del); toast('Método eliminado'); await pintar();
      }
    } catch (err) { toast(err.message, 'error'); }
  });
  container.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { validarCelular, normalizarCelular } = await import('./colombia.js');
    const v = container.querySelector('#pm-nequi-cel').value;
    const m = validarCelular(v);
    container.querySelector('#pm-nequi-err').textContent = m;
    if (m) return;
    const cel = normalizarCelular(v);
    try { await PG.guardarMetodo({ tipo: 'nequi', celular: cel, huella: `nequi-${cel}` }); toast('Nequi guardado'); await pintar(); }
    catch (err) { container.querySelector('#pm-nequi-err').textContent = err.message; }
  });
  container.addEventListener('input', (e) => { if (e.target.id === 'pm-nequi-cel') e.target.value = e.target.value.replace(/[^\d ]/g, ''); });
  await pintar();
}

// ---------- Historial de pagos (Mi cuenta) ----------
export async function mountHistorial(container) {
  let pagos = [];
  try { pagos = await PG.misPagos(); } catch (e) { container.innerHTML = `<p class="pf-loading">${esc(e.message)}</p>`; return; }
  if (!pagos.length) { container.innerHTML = `<div class="pm-none">${ico('receipt', 26)}<p>Aquí verás cada pago con su estado y comprobante.</p></div>`; return; }
  container.innerHTML = `<div class="ph-wrap"><table class="ph">
    <thead><tr><th scope="col">Fecha</th><th scope="col">Pedido</th><th scope="col">Medio</th><th scope="col" class="num">Valor</th><th scope="col">Estado</th><th scope="col"><span class="sr-only">Comprobante</span></th></tr></thead>
    <tbody>${pagos.map((p, i) => {
      const d = p.detalle || {};
      const medio = p.metodo === 'tarjeta' ? `${d.marca || 'Tarjeta'} ${PG.enmascarar(d.ultimos4 || '----')}` : p.metodo === 'pse' ? `PSE · ${d.banco || ''}` : PG.nombreMetodo(p.metodo);
      return `<tr><td>${esc(new Date(p.creado_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }))}</td><td>${esc(corto(p.pedido_id))}</td><td>${esc(medio)}</td><td class="num">${peso.format(p.monto)}</td>
        <td><span class="ph-st ph-${esc(p.estado)}">${esc(PG.ESTADOS_PAGO[p.estado] || p.estado)}</span></td>
        <td><button type="button" class="pm-act" data-rec="${i}" aria-label="Ver comprobante del pago ${esc(p.referencia)}">${ico('receipt', 15)}<span class="ph-rec-txt">Comprobante</span></button></td></tr>`;
    }).join('')}</tbody></table></div>`;
  container.addEventListener('click', (e) => {
    const b = e.target.closest('[data-rec]'); if (!b) return;
    comprobante(pagos[Number(b.dataset.rec)]);
  });
}

function comprobante(p) {
  const d = p.detalle || {};
  const dlg = document.createElement('dialog');
  dlg.className = 'modal rc';
  dlg.innerHTML = `
    <div class="rc-head"><strong>${esc(CONFIG.empresa.nombreComercial)}</strong><span>Comprobante de pago</span></div>
    <span class="ph-st ph-${esc(p.estado)}">${esc(PG.ESTADOS_PAGO[p.estado] || p.estado)}</span>
    <p class="rc-amount">${peso.format(p.monto)}</p>
    <dl class="pr-data">
      <dt>Base gravable</dt><dd>${peso.format(desgloseIVA(p.monto, CONFIG.ivaPorcentaje).base)}</dd>
      <dt>IVA (${CONFIG.ivaPorcentaje}%)</dt><dd>${peso.format(desgloseIVA(p.monto, CONFIG.ivaPorcentaje).iva)}</dd>
      <dt>Fecha</dt><dd>${esc(fecha(p.creado_at))}</dd>
      <dt>Pedido</dt><dd>${esc(corto(p.pedido_id))}</dd>
      <dt>Medio de pago</dt><dd>${esc(PG.nombreMetodo(p.metodo))}${d.marca ? ` · ${esc(d.marca)} ${PG.enmascarar(d.ultimos4)}` : ''}${d.banco ? ` · ${esc(d.banco)}` : ''}${d.cuotas > 1 ? ` · ${d.cuotas} cuotas` : ''}</dd>
      <dt>Referencia</dt><dd class="pr-ref">${esc(p.referencia)}</dd>
      ${d.codigo ? `<dt>Código de pago</dt><dd class="pr-code">${esc(d.codigo)}</dd>` : ''}
      <dt>Pasarela</dt><dd>${p.pasarela === 'prueba' ? 'Pasarela de prueba (sin cobro real)' : esc(p.pasarela)}</dd>
    </dl>
    <p class="rc-seller">${esc(CONFIG.empresa.razonSocial)} · NIT ${esc(CONFIG.empresa.nit)}<br>${esc(CONFIG.empresa.direccion)}, ${esc(CONFIG.empresa.ciudad)} · ${esc(CONFIG.empresa.correo)}<br>Este comprobante no reemplaza la factura electrónica.</p>
    <div class="modal-actions"><button type="button" class="btn btn-ghost" data-print>Imprimir</button><button type="button" class="btn btn-primary" data-close>Cerrar</button></div>`;
  document.body.appendChild(dlg);
  dlg.showModal();
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg || e.target.closest('[data-close]')) dlg.close();
    if (e.target.closest('[data-print]')) window.print();
  });
  dlg.addEventListener('close', () => dlg.remove());
}


// ---------- Pagar un pedido pendiente (Mi cuenta) ----------
export async function pagarPendiente(pedido, comprador) {
  let guardados = [];
  try { guardados = await PG.misMetodos(); } catch { /* sin métodos */ }
  const dlg = document.createElement('dialog');
  dlg.className = 'modal modal-wide pp';
  dlg.innerHTML = `
    <h2>Pagar pedido ${esc(corto(pedido.id))}</h2>
    <p class="modal-sub">${esc(pedido.direccion.direccion)}, ${esc(pedido.direccion.municipio)} · Total ${peso.format(pedido.total)} (IVA incluido)</p>
    <div class="pm-picker" id="pp-picker"></div>
    <div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>Cancelar</button><button type="button" class="btn btn-primary" data-pay>Pagar ${peso.format(pedido.total)}</button></div>`;
  document.body.appendChild(dlg);
  const picker = mountPicker(dlg.querySelector('#pp-picker'), { guardados, name: 'pp-metodo' });
  dlg.showModal();
  return new Promise((resolve) => {
    dlg.addEventListener('close', () => { dlg.remove(); resolve(dlg.returnValue === 'pagado'); });
    dlg.addEventListener('click', async (e) => {
      if (e.target === dlg || e.target.closest('[data-close]')) { dlg.close(dlg.returnValue || ''); return; }
      const b = e.target.closest('[data-pay]'); if (!b || b.disabled) return;
      const sel = picker.seleccion(); if (!sel) return;
      b.disabled = true;
      try {
        const r = await PG.pagar({ pedido, metodo: sel.metodo, guardado: sel.guardado, comprador });
        if (r.estado === 'cancelado') return;
        dlg.innerHTML = resultadoHTML(r, pedido) + '<div class="modal-actions"><button type="button" class="btn btn-primary" data-close>Listo</button></div>';
        dlg.returnValue = 'pagado';
      } catch (err) { b.insertAdjacentHTML('beforebegin', `<small class="au-error">${esc(err.message)}</small>`); }
      finally { b.disabled = false; }
    });
  });
}
