// firmar-pago — calcula la firma de integridad que exige Wompi para abrir el widget de pago.
// La firma usa el SECRETO DE INTEGRIDAD del comercio, que nunca puede estar en el navegador.
// Variables de entorno (Supabase → Edge Functions → Secrets):
//   WOMPI_INTEGRITY_SECRET   secreto de integridad (test_integrity_... o prod_integrity_...)
// Desplegar: supabase functions deploy firmar-pago
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };

async function sha256(texto: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const { referencia, montoCentavos, moneda, pedido_id } = await req.json();
    if (!/^[A-Z0-9-]{8,60}$/.test(referencia) || !Number.isInteger(montoCentavos) || moneda !== 'COP') throw new Error('datos');

    // El monto se toma de la base de datos, no del navegador: así nadie puede pagar menos de lo debido.
    const supa = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const auth = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
    const { data: { user } } = await supa.auth.getUser(auth);
    if (!user) return new Response(JSON.stringify({ error: 'sesion' }), { status: 401, headers: cors });
    const { data: pedido } = await supa.from('pedidos').select('id, total, usuario_id, estado').eq('id', pedido_id).single();
    if (!pedido || pedido.usuario_id !== user.id || pedido.estado === 'pagado') throw new Error('pedido');
    if (pedido.total * 100 !== montoCentavos) throw new Error('monto');

    const integridad = await sha256(`${referencia}${montoCentavos}${moneda}${Deno.env.get('WOMPI_INTEGRITY_SECRET')}`);
    return new Response(JSON.stringify({ integridad }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (_e) {
    return new Response(JSON.stringify({ error: 'solicitud invalida' }), { status: 400, headers: cors });
  }
});
