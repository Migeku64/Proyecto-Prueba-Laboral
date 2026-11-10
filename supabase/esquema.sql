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
create index if not exists pedidos_usuario_idx on public.pedidos (usuario_id, creado_at desc);

alter table public.pedidos enable row level security;
drop policy if exists "ver mis pedidos" on public.pedidos;
create policy "ver mis pedidos" on public.pedidos for select to authenticated using ((select auth.uid()) = usuario_id);
-- Cada cliente crea pedidos solo a su nombre y en estado 'recibido'.
-- (Con "Confirm email" activo, nadie obtiene sesión sin verificar su correo.)
-- IMPORTANTE al agregar pagos: recalcular precios y total en el servidor, no confiar en los del navegador.
drop policy if exists "crear mis pedidos" on public.pedidos;
create policy "crear mis pedidos" on public.pedidos for insert to authenticated
  with check ((select auth.uid()) = usuario_id and estado = 'recibido');
-- Nadie modifica ni borra pedidos desde la web: eso lo hace la tienda desde el panel.

-- Mantiene actualizado_at al día en perfiles.
create or replace function public.tocar_actualizado()
returns trigger language plpgsql set search_path = '' as $$ begin new.actualizado_at = now(); return new; end; $$;
drop trigger if exists perfiles_actualizado on public.perfiles;
create trigger perfiles_actualizado before update on public.perfiles
  for each row execute function public.tocar_actualizado();
