-- Menús (categorías) editables desde el panel y páginas de contenido.

-- Orden explícito de los menús principales (antes estaba fijo en el código)
update public.categories set sort_order = case slug when 'importaciones' then 0 when 'detalles' then 1 when 'sublimacion' then 2 else sort_order end
where parent_id is null and slug in ('importaciones', 'detalles', 'sublimacion');

create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  body text not null default '',
  image_url text,
  menu_id uuid references public.categories (id) on delete set null,
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pages_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint pages_title_length check (char_length(title) between 1 and 120),
  constraint pages_body_length check (char_length(body) <= 20000),
  constraint pages_image_url_length check (char_length(image_url) <= 2048)
);

create index if not exists pages_menu_id_idx on public.pages (menu_id, sort_order);

drop trigger if exists pages_set_updated_at on public.pages;
create trigger pages_set_updated_at before update on public.pages
for each row execute function public.set_updated_at();

alter table public.pages enable row level security;
revoke all on table public.pages from anon, authenticated;
grant select on table public.pages to anon, authenticated;
grant insert, update, delete on table public.pages to authenticated;

drop policy if exists "pages_public_read" on public.pages;
create policy "pages_public_read" on public.pages for select to anon, authenticated
using (published = true);
drop policy if exists "pages_admin_read" on public.pages;
create policy "pages_admin_read" on public.pages for select to authenticated
using ((select private.is_admin()));
drop policy if exists "pages_admin_insert" on public.pages;
create policy "pages_admin_insert" on public.pages for insert to authenticated
with check ((select private.is_admin()));
drop policy if exists "pages_admin_update" on public.pages;
create policy "pages_admin_update" on public.pages for update to authenticated
using ((select private.is_admin())) with check ((select private.is_admin()));
drop policy if exists "pages_admin_delete" on public.pages;
create policy "pages_admin_delete" on public.pages for delete to authenticated
using ((select private.is_admin()));
