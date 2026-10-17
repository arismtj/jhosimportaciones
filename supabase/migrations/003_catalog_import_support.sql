create type public.catalog_import_status as enum ('running', 'succeeded', 'partial', 'failed');

create table public.catalog_import_runs (
  id uuid primary key default gen_random_uuid(),
  source_url text not null,
  source_sha256 text not null,
  source_product_count integer not null,
  status public.catalog_import_status not null default 'running',
  imported_product_count integer not null default 0,
  imported_image_count integer not null default 0,
  failed_image_count integer not null default 0,
  summary jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users (id) on delete set null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  constraint catalog_import_runs_source_url_length check (char_length(source_url) <= 2048),
  constraint catalog_import_runs_sha256_format check (source_sha256 ~ '^[a-f0-9]{64}$'),
  constraint catalog_import_runs_counts_non_negative check (
    source_product_count >= 0
    and imported_product_count >= 0
    and imported_image_count >= 0
    and failed_image_count >= 0
  ),
  constraint catalog_import_runs_summary_object check (jsonb_typeof(summary) = 'object')
);

create table public.catalog_import_issues (
  id uuid primary key default gen_random_uuid(),
  import_run_id uuid not null references public.catalog_import_runs (id) on delete cascade,
  external_id text,
  stage text not null,
  code text not null,
  message text not null,
  source_url text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint catalog_import_issues_stage_length check (char_length(stage) between 1 and 60),
  constraint catalog_import_issues_code_length check (char_length(code) between 1 and 80),
  constraint catalog_import_issues_message_length check (char_length(message) between 1 and 1000),
  constraint catalog_import_issues_source_url_length check (char_length(source_url) <= 2048),
  constraint catalog_import_issues_details_object check (jsonb_typeof(details) = 'object')
);

alter table public.products
  add column price_verified boolean not null default false,
  add column source_system text,
  add column source_version integer,
  add column source_updated_at timestamptz,
  add column source_metadata jsonb not null default '{}'::jsonb,
  add column latest_import_run_id uuid references public.catalog_import_runs (id) on delete set null,
  add constraint products_source_system_length check (char_length(source_system) <= 80),
  add constraint products_source_version_non_negative check (source_version is null or source_version >= 0),
  add constraint products_source_metadata_object check (jsonb_typeof(source_metadata) = 'object');

alter table public.product_images
  add column source_sha256 text,
  add column source_mime_type text,
  add column import_run_id uuid references public.catalog_import_runs (id) on delete set null,
  add constraint product_images_source_sha256_format check (
    source_sha256 is null or source_sha256 ~ '^[a-f0-9]{64}$'
  ),
  add constraint product_images_source_mime_type_length check (char_length(source_mime_type) <= 120);

create index products_source_system_idx on public.products (source_system, external_id);
create index catalog_import_runs_started_at_idx on public.catalog_import_runs (started_at desc);
create index catalog_import_issues_run_id_idx on public.catalog_import_issues (import_run_id, created_at);

alter table public.catalog_import_runs enable row level security;
alter table public.catalog_import_issues enable row level security;

revoke all on table public.catalog_import_runs from anon, authenticated;
revoke all on table public.catalog_import_issues from anon, authenticated;
grant select on table public.catalog_import_runs, public.catalog_import_issues to authenticated;
grant all on table public.catalog_import_runs, public.catalog_import_issues to service_role;
grant select, insert, update, delete on table public.categories, public.products, public.product_images to service_role;

create policy "catalog_import_runs_admin_read"
on public.catalog_import_runs for select to authenticated
using ((select private.is_admin()));

create policy "catalog_import_issues_admin_read"
on public.catalog_import_issues for select to authenticated
using ((select private.is_admin()));

create or replace function private.enforce_verified_order_price()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.product_id is not null and not exists (
    select 1
    from public.products
    where id = new.product_id
      and price_verified = true
  ) then
    raise exception 'The product price must be verified before creating an order.' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke execute on function private.enforce_verified_order_price() from public, anon, authenticated;

create trigger order_items_require_verified_price
before insert on public.order_items
for each row execute function private.enforce_verified_order_price();

create or replace function public.replace_product_images(
  p_product_id uuid,
  p_images jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_images is null or jsonb_typeof(p_images) <> 'array' or jsonb_array_length(p_images) = 0 then
    raise exception 'At least one product image is required.' using errcode = '22023';
  end if;

  if jsonb_array_length(p_images) > 30 then
    raise exception 'A product cannot contain more than 30 images.' using errcode = '22023';
  end if;

  delete from public.product_images where product_id = p_product_id;

  insert into public.product_images (
    product_id,
    storage_path,
    source_url,
    alt_text,
    sort_order,
    is_primary,
    source_sha256,
    source_mime_type,
    import_run_id
  )
  select
    p_product_id,
    image.storage_path,
    image.source_url,
    image.alt_text,
    image.sort_order,
    image.is_primary,
    image.source_sha256,
    image.source_mime_type,
    image.import_run_id
  from jsonb_to_recordset(p_images) as image(
    storage_path text,
    source_url text,
    alt_text text,
    sort_order integer,
    is_primary boolean,
    source_sha256 text,
    source_mime_type text,
    import_run_id uuid
  );

  if (select count(*) from public.product_images where product_id = p_product_id and is_primary) <> 1 then
    raise exception 'Exactly one primary product image is required.' using errcode = '22023';
  end if;
end;
$$;

revoke execute on function public.replace_product_images(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.replace_product_images(uuid, jsonb) to service_role;

comment on table public.catalog_import_runs is 'Auditoría de cada importación del catálogo de referencia.';
comment on table public.catalog_import_issues is 'Errores y advertencias detectados sin ocultarlos durante una importación.';
comment on column public.products.source_metadata is 'Metadatos originales que no forman parte del modelo comercial normalizado.';
comment on column public.products.price_verified is 'Impide usar un precio importado en pedidos reales hasta su confirmación administrativa.';
