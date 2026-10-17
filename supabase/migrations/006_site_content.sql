-- Textos editables del sitio (portada, menú principal, pie de página…).
create table if not exists public.site_content (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint site_content_key_length check (char_length(key) between 1 and 60),
  constraint site_content_value_object check (jsonb_typeof(value) = 'object')
);

drop trigger if exists site_content_set_updated_at on public.site_content;
create trigger site_content_set_updated_at before update on public.site_content
for each row execute function public.set_updated_at();

alter table public.site_content enable row level security;
revoke all on table public.site_content from anon, authenticated;
grant select on table public.site_content to anon, authenticated;
grant insert, update, delete on table public.site_content to authenticated;

drop policy if exists "site_content_public_read" on public.site_content;
create policy "site_content_public_read" on public.site_content for select to anon, authenticated
using (true);
drop policy if exists "site_content_admin_insert" on public.site_content;
create policy "site_content_admin_insert" on public.site_content for insert to authenticated
with check ((select private.is_admin()));
drop policy if exists "site_content_admin_update" on public.site_content;
create policy "site_content_admin_update" on public.site_content for update to authenticated
using ((select private.is_admin())) with check ((select private.is_admin()));
drop policy if exists "site_content_admin_delete" on public.site_content;
create policy "site_content_admin_delete" on public.site_content for delete to authenticated
using ((select private.is_admin()));
