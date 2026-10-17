create extension if not exists pgcrypto;

create type public.user_role as enum ('customer', 'admin');
create type public.product_availability as enum ('in_stock', 'out_of_stock', 'made_to_order');
create type public.price_mode as enum ('fixed', 'from');
create type public.order_status as enum (
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'shipped',
  'completed',
  'cancelled'
);
create type public.delivery_method as enum ('pickup', 'delivery');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  email text,
  phone text,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (char_length(display_name) <= 120),
  constraint profiles_phone_length check (char_length(phone) <= 30)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories (id) on delete restrict,
  slug text not null unique,
  name text not null,
  description text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint categories_name_length check (char_length(name) between 1 and 100),
  constraint categories_not_self_parent check (parent_id is null or parent_id <> id)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  category_id uuid not null references public.categories (id) on delete restrict,
  slug text not null unique,
  name text not null,
  description text not null default '',
  price numeric(12, 2) not null,
  price_mode public.price_mode not null default 'fixed',
  price_max numeric(12, 2),
  availability public.product_availability not null default 'in_stock',
  stock_quantity integer,
  customizable boolean not null default false,
  featured boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint products_name_length check (char_length(name) between 1 and 180),
  constraint products_price_non_negative check (price >= 0),
  constraint products_price_max_valid check (price_max is null or price_max >= price),
  constraint products_stock_non_negative check (stock_quantity is null or stock_quantity >= 0)
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  storage_path text,
  source_url text,
  alt_text text not null default '',
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  constraint product_images_has_source check (storage_path is not null or source_url is not null),
  constraint product_images_storage_path_length check (char_length(storage_path) <= 500),
  constraint product_images_source_url_length check (char_length(source_url) <= 2048),
  constraint product_images_alt_text_length check (char_length(alt_text) <= 240),
  unique nulls not distinct (product_id, storage_path)
);

create unique index product_images_one_primary_per_product
  on public.product_images (product_id)
  where is_primary;

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  sku text unique,
  name text not null,
  options jsonb not null default '{}'::jsonb,
  price_adjustment numeric(12, 2) not null default 0,
  stock_quantity integer,
  availability public.product_availability not null default 'in_stock',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_variants_name_length check (char_length(name) between 1 and 120),
  constraint product_variants_options_object check (jsonb_typeof(options) = 'object'),
  constraint product_variants_stock_non_negative check (stock_quantity is null or stock_quantity >= 0)
);

create table public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity unique,
  user_id uuid references auth.users (id) on delete set null,
  status public.order_status not null default 'pending',
  customer_name text not null,
  customer_email text,
  customer_phone text not null,
  delivery_method public.delivery_method not null,
  delivery_address text,
  payment_method text,
  customer_notes text,
  subtotal numeric(12, 2) not null default 0,
  shipping_amount numeric(12, 2),
  total numeric(12, 2),
  whatsapp_recipient text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_customer_name_length check (char_length(customer_name) between 1 and 120),
  constraint orders_customer_email_length check (char_length(customer_email) <= 320),
  constraint orders_customer_phone_length check (char_length(customer_phone) between 6 and 30),
  constraint orders_delivery_address_required check (
    delivery_method <> 'delivery' or nullif(btrim(delivery_address), '') is not null
  ),
  constraint orders_amounts_non_negative check (
    subtotal >= 0
    and (shipping_amount is null or shipping_amount >= 0)
    and (total is null or total >= 0)
  )
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  variant_id uuid references public.product_variants (id) on delete set null,
  product_name text not null,
  variant_name text,
  unit_price numeric(12, 2) not null,
  quantity integer not null,
  line_total numeric(12, 2) generated always as (unit_price * quantity) stored,
  created_at timestamptz not null default now(),
  constraint order_items_product_name_length check (char_length(product_name) between 1 and 180),
  constraint order_items_unit_price_non_negative check (unit_price >= 0),
  constraint order_items_quantity_valid check (quantity between 1 and 99)
);

create table public.order_item_customizations (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references public.order_items (id) on delete cascade,
  label text not null,
  value text not null,
  created_at timestamptz not null default now(),
  constraint order_item_customizations_label_length check (char_length(label) between 1 and 80),
  constraint order_item_customizations_value_length check (char_length(value) between 1 and 500)
);

create index categories_parent_id_idx on public.categories (parent_id);
create index products_category_id_idx on public.products (category_id);
create index products_public_catalog_idx on public.products (published, availability, category_id);
create index product_images_product_id_idx on public.product_images (product_id, sort_order);
create index product_variants_product_id_idx on public.product_variants (product_id, active);
create index favorites_product_id_idx on public.favorites (product_id);
create index orders_user_id_created_at_idx on public.orders (user_id, created_at desc);
create index orders_status_created_at_idx on public.orders (status, created_at desc);
create index order_items_order_id_idx on public.order_items (order_id);
create index order_item_customizations_item_id_idx on public.order_item_customizations (order_item_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create trigger product_variants_set_updated_at
before update on public.product_variants
for each row execute function public.set_updated_at();

create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.email
  )
  on conflict (id) do update
    set display_name = coalesce(excluded.display_name, public.profiles.display_name),
        email = excluded.email;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create trigger on_auth_user_updated
after update of email, raw_user_meta_data on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (id, display_name, email)
select
  id,
  coalesce(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name'),
  email
from auth.users
on conflict (id) do update
set display_name = coalesce(excluded.display_name, public.profiles.display_name),
    email = excluded.email;

comment on table public.products is 'Catálogo comercial. No contiene datos inventados; se poblará desde una fuente validada.';
comment on column public.products.external_id is 'Identificador de la fuente original para importaciones idempotentes.';
comment on column public.product_images.source_url is 'URL de procedencia temporal, conservada para trazabilidad de la importación.';
comment on column public.orders.total is 'Nulo cuando el costo de entrega aún requiere cotización.';
