// wompi-eventos — recibe las notificaciones (webhook) de Wompi y registra el estado REAL de cada pago.
// Es la única fuente de verdad: un pedido solo pasa a "pagado" cuando Wompi lo confirma aquí.
// Variables de entorno:
//   WOMPI_EVENTS_SECRET   secreto de eventos (test_events_... o prod_events_...)
// En el panel de Wompi, URL de eventos: https://<proyecto>.supabase.co/functions/v1/wompi-eventos
// Desplegar sin verificación JWT (Wompi no envía sesión): supabase functions deploy wompi-eventos --no-verify-jwt
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

async function sha256(texto: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
const valor = (obj: Record<string, unknown>, ruta: string) => ruta.split('.').reduce((o: any, k) => (o == null ? o : o[k]), obj);
const ESTADO: Record<string, string> = { APPROVED: 'aprobado', DECLINED: 'rechazado', VOIDED: 'rechazado', ERROR: 'error', PENDING: 'pendiente' };

Deno.serve(async (req) => {
  const evento = await req.json();
  // 1. Verificar que el evento viene de Wompi (checksum con el secreto de eventos).
  const props: string[] = evento?.signature?.properties ?? [];
  const cadena = props.map((p) => String(valor(evento.data, p))).join('') + evento.timestamp + Deno.env.get('WOMPI_EVENTS_SECRET');
  if ((await sha256(cadena)).toUpperCase() !== String(evento?.signature?.checksum).toUpperCase()) {
    return new Response('firma invalida', { status: 401 });
  }
  if (evento.event !== 'transaction.updated') return new Response('ignorado');

  const t = evento.data.transaction;
  const supa = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  // La referencia es VK-<id del pedido>-<marca de tiempo> (ver js/payments.js).
  const pedidoId = String(t.reference).slice(3, 39).toLowerCase();
  const { data: p } = await supa.from('pedidos').select('id, usuario_id, total').eq('id', pedidoId).maybeSingle();
  if (!p) return new Response('pedido no encontrado', { status: 404 });
  if (p.total * 100 !== t.amount_in_cents) return new Response('monto no coincide', { status: 409 });

  const estado = ESTADO[t.status] ?? 'pendiente';
  const pm = t.payment_method ?? {};
  await supa.from('pagos').upsert({
    pedido_id: p.id, usuario_id: p.usuario_id, pasarela: 'wompi', referencia: t.reference, transaccion: t.id,
    metodo: String(t.payment_method_type ?? '').toLowerCase(), monto: p.total, estado,
    detalle: { marca: pm.extra?.brand ?? null, ultimos4: pm.extra?.last_four ?? null, cuotas: pm.installments ?? null, banco: pm.financial_institution_code ?? null },
    mensaje: t.status_message ?? null, actualizado_at: new Date().toISOString()
  }, { onConflict: 'referencia' });
  if (estado === 'aprobado') await supa.from('pedidos').update({ estado: 'pagado' }).eq('id', p.id);
  return new Response('ok');
});
