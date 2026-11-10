-- esquema.sql — tablas de clientes y pedidos de la tienda (PostgreSQL / Supabase).
-- Pégalo completo en Supabase → SQL Editor → New query → Run. Se puede ejecutar más de una vez.
-- Si el ingeniero entrega otra base PostgreSQL, las tablas y restricciones sirven igual;
-- las partes de "auth.users" y "auth.uid()" son propias de Supabase.

-- ===================== PERFILES =====================
create table if not exists public.perfiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  nombres         text not null check (char_length(nombres) between 2 and 40 and nombres ~ '^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ '' -]+$'),
  apellidos       text not null check (char_length(apellidos) between 2 and 40 and apellidos ~ '^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ '' -]+$'),
  tipo_documento  text not null check (tipo_documento in ('CC', 'CE', 'PPT', 'PA')),
  documento       text not null check (
                    (tipo_documento = 'CC'  and documento ~ '^[1-9][0-9]{5,9}$') or
                    (tipo_documento = 'CE'  and documento ~ '^[1-9][0-9]{5,6}$') or
                    (tipo_documento = 'PPT' and documento ~ '^[1-9][0-9]{5,7}$') or
                    (tipo_documento = 'PA'  and documento ~ '^[A-Z0-9]{6,10}$')),
  nacimiento      date not null check (nacimiento <= (current_date - interval '18 years') and nacimiento >= date '1925-01-01'),
  celular         text not null check (celular ~ '^3(0|1|2|3|5)[0-9]{8}$'),
  correo          text not null,
  correo_canonico text not null unique,          -- mismo buzón = misma cuenta (ver correo_canonico())
  pais            text not null default 'CO' check (pais = 'CO'),
  acepta_datos_at timestamptz not null,           -- autorización Ley 1581 de 2012
  creado_at       timestamptz not null default now(),
  actualizado_at  timestamptz not null default now(),
  unique (tipo_documento, documento),
  unique (celular)
);
comment on table public.perfiles is 'Un registro por cliente (auth.users). Solo Colombia.';

-- Forma única del correo: minúsculas, sin "+etiqueta" y, en Gmail, sin puntos.
create or replace function public.correo_canonico(correo text)
returns text language plpgsql immutable set search_path = '' as $$
declare loc text := split_part(lower(trim(correo)), '@', 1); dom text := split_part(lower(trim(correo)), '@', 2);
begin
  loc := split_part(loc, '+', 1);
  if dom in ('gmail.com', 'googlemail.com') then loc := replace(loc, '.', ''); dom := 'gmail.com'; end if;
  return loc || '@' || dom;
end; $$;

-- Crea el perfil al registrarse. Si los datos no cumplen las restricciones, el registro se rechaza completo.
create or replace function public.crear_perfil()
returns trigger language plpgsql security definer set search_path = '' as $$
declare m jsonb := new.raw_user_meta_data;
begin
  insert into public.perfiles (id, nombres, apellidos, tipo_documento, documento, nacimiento, celular, correo, correo_canonico, acepta_datos_at)
  values (new.id, m ->> 'nombres', m ->> 'apellidos', m ->> 'tipo_documento', m ->> 'documento',
          (m ->> 'nacimiento')::date, m ->> 'celular', new.email, public.correo_canonico(new.email),
          coalesce((m ->> 'acepta_datos')::timestamptz, now()));
  return new;
end; $$;

drop trigger if exists al_crear_usuario on auth.users;
create trigger al_crear_usuario after insert on auth.users
  for each row execute function public.crear_perfil();

alter table public.perfiles enable row level security;
drop policy if exists "ver mi perfil" on public.perfiles;
create policy "ver mi perfil" on public.perfiles for select to authenticated using ((select auth.uid()) = id);
drop policy if exists "editar mi perfil" on public.perfiles;
create policy "editar mi perfil" on public.perfiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- ===================== PEDIDOS =====================
create table if not exists public.pedidos (
  id          uuid primary key default gen_random_uuid(),
  usuario_id  uuid not null default auth.uid() references auth.users (id) on delete restrict,
  items       jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 50),
  subtotal    integer not null check (subtotal > 0),
  envio       integer not null default 0 check (envio >= 0),
  total       integer not null check (total = subtotal + envio),
  direccion   jsonb not null check (direccion ? 'departamento' and direccion ? 'municipio' and direccion ? 'direccion' and direccion ? 'barrio'),
  celular     text not null check (celular ~ '^3(0|1|2|3|5)[0-9]{8}$'),
  estado      text not null default 'recibido' check (estado in ('recibido', 'pago_pendiente', 'pagado', 'enviado', 'entregado', 'cancelado')),
  creado_at   timestamptz not null default now()
);
-- Facturación electrónica y aceptación de términos (Ley 1480, art. 50).
alter table public.pedidos add column if not exists facturacion jsonb
  check (facturacion is null or (facturacion ->> 'tipo' in ('persona', 'empresa') and facturacion ? 'correo'));
alter table public.pedidos add column if not exists acepta_terminos_at timestamptz;
create index if not exists pedidos_usuario_idx on public.pedidos (usuario_id, creado_at desc);

alter table public.pedidos enable row level security;
drop policy if exists "ver mis pedidos" on public.pedidos;
create policy "ver mis pedidos" on public.pedidos for select to authenticated using ((select auth.uid()) = usuario_id);
-- Cada cliente crea pedidos solo a su nombre y sin pagar ('recibido' o 'pago_pendiente').
-- Solo el servidor los pasa a 'pagado' cuando la pasarela confirma el pago.
-- (Con "Confirm email" activo, nadie obtiene sesión sin verificar su correo.)
-- IMPORTANTE al agregar pagos: recalcular precios y total en el servidor, no confiar en los del navegador.
drop policy if exists "crear mis pedidos" on public.pedidos;
create policy "crear mis pedidos" on public.pedidos for insert to authenticated
  with check ((select auth.uid()) = usuario_id and estado in ('recibido', 'pago_pendiente'));
-- Nadie modifica ni borra pedidos desde la web: eso lo hace la tienda desde el panel.

-- Mantiene actualizado_at al día en perfiles.
create or replace function public.tocar_actualizado()
returns trigger language plpgsql set search_path = '' as $$ begin new.actualizado_at = now(); return new; end; $$;
drop trigger if exists perfiles_actualizado on public.perfiles;
create trigger perfiles_actualizado before update on public.perfiles
  for each row execute function public.tocar_actualizado();

-- ===================== PAGOS =====================
-- Seguridad PCI DSS: aquí NUNCA se guarda el número completo de la tarjeta ni el CVV.
-- Solo la referencia de la pasarela (token), la marca y los últimos 4 dígitos.

create table if not exists public.metodos_pago (
  id             uuid primary key default gen_random_uuid(),
  usuario_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tipo           text not null check (tipo in ('tarjeta', 'nequi')),
  marca          text check (marca in ('Visa', 'Mastercard', 'American Express', 'Diners Club')),
  ultimos4       text check (ultimos4 ~ '^[0-9]{4}$'),
  vence          text check (vence ~ '^(0[1-9]|1[0-2])/[0-9]{2}$'),
  titular        text check (char_length(titular) <= 40),
  celular        text check (celular ~ '^3(0|1|2|3|5)[0-9]{8}$'),
  token          text,                 -- referencia de la pasarela (payment source / token)
  huella         text not null,        -- evita guardar dos veces el mismo método
  predeterminado boolean not null default false,
  creado_at      timestamptz not null default now(),
  unique (usuario_id, huella),
  check ((tipo = 'tarjeta' and marca is not null and ultimos4 is not null and vence is not null and token is not null)
      or (tipo = 'nequi' and celular is not null))
);
alter table public.metodos_pago enable row level security;
drop policy if exists "mis metodos" on public.metodos_pago;
create policy "mis metodos" on public.metodos_pago for all to authenticated
  using ((select auth.uid()) = usuario_id) with check ((select auth.uid()) = usuario_id);

-- Máximo 5 métodos por cliente.
create or replace function public.limite_metodos() returns trigger language plpgsql set search_path = '' as $$
begin
  if (select count(*) from public.metodos_pago where usuario_id = new.usuario_id) >= 5 then
    raise exception 'too_many_methods';
  end if;
  if not exists (select 1 from public.metodos_pago where usuario_id = new.usuario_id) then new.predeterminado := true; end if;
  return new;
end; $$;
drop trigger if exists metodos_limite on public.metodos_pago;
create trigger metodos_limite before insert on public.metodos_pago for each row execute function public.limite_metodos();

-- Cambia el método predeterminado del cliente.
create or replace function public.metodo_predeterminado(metodo uuid) returns void language sql security invoker set search_path = '' as $$
  update public.metodos_pago set predeterminado = (id = metodo) where usuario_id = auth.uid();
$$;

create table if not exists public.pagos (
  id          uuid primary key default gen_random_uuid(),
  pedido_id   uuid not null references public.pedidos (id) on delete restrict,
  usuario_id  uuid not null references auth.users (id) on delete restrict,
  pasarela    text not null,
  referencia  text not null unique,
  transaccion text unique,            -- id de la transacción en la pasarela
  metodo      text not null,
  monto       integer not null check (monto > 0),
  moneda      text not null default 'COP' check (moneda = 'COP'),
  estado      text not null check (estado in ('aprobado', 'rechazado', 'pendiente', 'error')),
  detalle     jsonb not null default '{}'::jsonb,   -- marca, últimos 4, banco, cuotas… (nunca datos completos)
  mensaje     text,
  creado_at   timestamptz not null default now(),
  actualizado_at timestamptz not null default now()
);
create index if not exists pagos_usuario_idx on public.pagos (usuario_id, creado_at desc);
alter table public.pagos enable row level security;
drop policy if exists "ver mis pagos" on public.pagos;
create policy "ver mis pagos" on public.pagos for select to authenticated using ((select auth.uid()) = usuario_id);
-- Sin políticas de insert/update: SOLO el servidor (Edge Functions con service_role) registra y cambia pagos,
-- después de confirmar el estado directamente con la pasarela.
