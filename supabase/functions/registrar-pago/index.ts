// registrar-pago — cuando el cliente cierra el widget, la página llama aquí para mostrar el resultado de inmediato.
// No confía en lo que dice el navegador: consulta la transacción directamente a Wompi antes de guardar.
// El estado definitivo lo sigue confirmando el webhook (wompi-eventos).
// Variables de entorno: WOMPI_ENV = 'sandbox' | 'production'
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const ESTADO: Record<string, string> = { APPROVED: 'aprobado', DECLINED: 'rechazado', VOIDED: 'rechazado', ERROR: 'error', PENDING: 'pendiente' };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const supa = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: { user } } = await supa.auth.getUser(req.headers.get('Authorization')?.replace('Bearer ', '') ?? '');
  if (!user) return new Response(JSON.stringify({ error: 'sesion' }), { status: 401, headers: cors });

  const body = await req.json();
  const id = body?.detalle?.transaccion;
  if (!id) return new Response(JSON.stringify({ error: 'transaccion' }), { status: 400, headers: cors });
  const base = Deno.env.get('WOMPI_ENV') === 'production' ? 'https://production.wompi.co' : 'https://sandbox.wompi.co';
  const { data: t } = await fetch(`${base}/v1/transactions/${encodeURIComponent(id)}`).then((r) => r.json());

  const { data: pedido } = await supa.from('pedidos').select('id, usuario_id, total').eq('id', body.pedido_id).single();
  if (!pedido || pedido.usuario_id !== user.id || pedido.total * 100 !== t.amount_in_cents) {
    return new Response(JSON.stringify({ error: 'no coincide' }), { status: 409, headers: cors });
  }
  const estado = ESTADO[t.status] ?? 'pendiente';
  const pm = t.payment_method ?? {};
  const fila = {
    pedido_id: pedido.id, usuario_id: user.id, pasarela: 'wompi', referencia: t.reference, transaccion: t.id,
    metodo: String(t.payment_method_type ?? '').toLowerCase(), monto: pedido.total, estado,
    detalle: { marca: pm.extra?.brand ?? null, ultimos4: pm.extra?.last_four ?? null, cuotas: pm.installments ?? null },
    mensaje: t.status_message ?? null, actualizado_at: new Date().toISOString()
  };
  await supa.from('pagos').upsert(fila, { onConflict: 'referencia' });
  if (estado === 'aprobado') await supa.from('pedidos').update({ estado: 'pagado' }).eq('id', pedido.id);
  return new Response(JSON.stringify(fila), { headers: { ...cors, 'Content-Type': 'application/json' } });
});
