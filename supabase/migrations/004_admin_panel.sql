-- Panel de administración: administradores por correo, promociones y medios.

-- 1. Correos autorizados como administradores (se aplican al iniciar sesión con Google)
create table if not exists private.admin_emails (
  email text primary key check (email = lower(btrim(email)) and position('@' in email) > 1),
  added_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
revoke all on table private.admin_emails from public, anon, authenticated;

insert into private.admin_emails (email) values
  ('tatianalisbethherrerasuarez@gmail.com'),
  ('arismartintj@gmail.com')
on conflict do nothing;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_is_admin boolean := exists (select 1 from private.admin_emails where email = lower(new.email));
begin
  insert into public.profiles (id, display_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.email,
    case when v_is_admin then 'admin'::public.user_role else 'customer'::public.user_role end
  )
  on conflict (id) do update
    set display_name = coalesce(excluded.display_name, public.profiles.display_name),
        email = excluded.email,
        role = case when v_is_admin then 'admin'::public.user_role else public.profiles.role end;
  return new;
end;
$$;

-- Si ya existían esas cuentas, se promueven ahora
update public.profiles p set role = 'admin'
where lower(p.email) in (select email from private.admin_emails);

-- Un administrador puede invitar a otro por correo
create or replace function public.grant_admin(p_email text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(btrim(p_email));
begin
  if not (select private.is_admin()) then
    raise exception 'Solo un administrador puede invitar a otros.' using errcode = '42501';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Correo no válido.' using errcode = '22023';
  end if;
  insert into private.admin_emails (email, added_by) values (v_email, auth.uid()) on conflict do nothing;
  update public.profiles set role = 'admin' where lower(email) = v_email;
  return v_email;
end;
$$;

create or replace function public.list_admins()
returns table (email text, has_logged_in boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select a.email, exists (select 1 from public.profiles p where lower(p.email) = a.email)
  from private.admin_emails a
  where (select private.is_admin())
  order by a.created_at;
$$;

create or replace function public.revoke_admin(p_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(btrim(p_email));
begin
  if not (select private.is_admin()) then
    raise exception 'Solo un administrador puede quitar accesos.' using errcode = '42501';
  end if;
  if v_email = lower((select email from public.profiles where id = auth.uid())) then
    raise exception 'No puedes quitarte tu propio acceso.' using errcode = '22023';
  end if;
  delete from private.admin_emails where email = v_email;
  update public.profiles set role = 'customer' where lower(email) = v_email;
end;
$$;

revoke execute on function public.grant_admin(text), public.list_admins(), public.revoke_admin(text) from public, anon;
grant execute on function public.grant_admin(text), public.list_admins(), public.revoke_admin(text) to authenticated;

-- 2. Promociones administrables
create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  body text not null default '' check (char_length(body) <= 2000),
  media_url text check (char_length(media_url) <= 2048),
  media_type text check (media_type in ('image', 'video')),
  starts_on date not null default current_date,
  ends_on date not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint promotions_dates_valid check (ends_on >= starts_on)
);

drop trigger if exists promotions_set_updated_at on public.promotions;
create trigger promotions_set_updated_at before update on public.promotions
for each row execute function public.set_updated_at();

alter table public.promotions enable row level security;
revoke all on table public.promotions from anon, authenticated;
grant select on table public.promotions to anon, authenticated;
grant insert, update, delete on table public.promotions to authenticated;

drop policy if exists "promotions_public_read" on public.promotions;
create policy "promotions_public_read" on public.promotions for select to anon, authenticated
using (active = true);
drop policy if exists "promotions_admin_read" on public.promotions;
create policy "promotions_admin_read" on public.promotions for select to authenticated
using ((select private.is_admin()));
drop policy if exists "promotions_admin_insert" on public.promotions;
create policy "promotions_admin_insert" on public.promotions for insert to authenticated
with check ((select private.is_admin()));
drop policy if exists "promotions_admin_update" on public.promotions;
create policy "promotions_admin_update" on public.promotions for update to authenticated
using ((select private.is_admin())) with check ((select private.is_admin()));
drop policy if exists "promotions_admin_delete" on public.promotions;
create policy "promotions_admin_delete" on public.promotions for delete to authenticated
using ((select private.is_admin()));

-- Promociones actuales (tomadas de la tienda de referencia)
insert into public.promotions (title, body, media_url, media_type, starts_on, ends_on, sort_order)
select * from (values
  ('Caja Halloween', 'Caja sorpresa de Halloween: incluye sorpresas, 1 squishy, caramelos y chocolates a montón.', 'https://jhos-importaciones-tienda.wigglyemu17.chatgpt.site/api/promo-media/3e005e85-f3da-4f13-a3ce-146955698d3f.mp4', 'video', date '2026-10-16', date '2026-10-31', 1),
  ('Caja exclusiva', 'Caja negra exclusiva para todo tipo de ocasión.', 'https://jhos-importaciones-tienda.wigglyemu17.chatgpt.site/api/promo-media/d2eb09e0-a696-44a0-b0ae-9709933508b3.mp4', 'video', date '2026-10-16', date '2026-12-15', 2),
  ('Regalos mensuales', E'¿Quieres participar? Es muy fácil: síguenos en todas nuestras redes sociales, dale like a esta publicación, etiqueta a dos amigos en los comentarios y comparte.\nPremios:\n1. Parlantes RGB\n2. Reloj smartwatch\n3. Audífono inalámbrico\n4. Vale de compra de S/150 en productos JHOS', 'https://jhos-importaciones-tienda.wigglyemu17.chatgpt.site/api/promo-media/ab88ce6d-7997-45e5-89d4-470d51118709.mp4', 'video', date '2026-10-01', date '2026-10-31', 3),
  ('Regalos semanales', '¿Quieres participar? Es muy fácil: síguenos en todas nuestras redes sociales, dale like a esta publicación, etiqueta a dos amigos en los comentarios y comparte.', 'https://jhos-importaciones-tienda.wigglyemu17.chatgpt.site/api/promo-media/8623c9fd-ff91-413f-a302-eb28f5c1aa98.mp4', 'video', date '2026-10-12', date '2026-10-18', 4),
  ('¡Compra y gana!', E'¿Quieres llevarlo? Compra desde S/100 en JHOS y participa con un ticket: a más tickets, más opciones. ¡No te quedes sin vivir la experiencia!\n1. Redmi 14C\n2. Smartwatch\n3. Tablet de 10"\n4. Freidora de aire\n5. TV de 43 pulgadas\n6. Caja sorpresa', 'https://jhos-importaciones-tienda.wigglyemu17.chatgpt.site/api/promo-media/7526f6a5-b468-48e5-bd24-3848a8f2fa4c.mp4', 'video', date '2026-10-16', date '2026-12-15', 5)
) as seed(title, body, media_url, media_type, starts_on, ends_on, sort_order)
where not exists (select 1 from public.promotions);

-- 3. Espacio para videos e imágenes de promociones
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('promo-media', 'promo-media', true, 52428800, array['video/mp4', 'video/webm', 'video/quicktime', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "promo_media_admin_insert" on storage.objects;
create policy "promo_media_admin_insert" on storage.objects for insert to authenticated
with check (bucket_id = 'promo-media' and (select private.is_admin()));
drop policy if exists "promo_media_admin_update" on storage.objects;
create policy "promo_media_admin_update" on storage.objects for update to authenticated
using (bucket_id = 'promo-media' and (select private.is_admin())) with check (bucket_id = 'promo-media' and (select private.is_admin()));
drop policy if exists "promo_media_admin_delete" on storage.objects;
create policy "promo_media_admin_delete" on storage.objects for delete to authenticated
using (bucket_id = 'promo-media' and (select private.is_admin()));

-- Los administradores también pueden leer los objetos (para reemplazarlos)
drop policy if exists "product_media_admin_select" on storage.objects;
create policy "product_media_admin_select" on storage.objects for select to authenticated
using (bucket_id in ('product-images', 'promo-media') and (select private.is_admin()));
