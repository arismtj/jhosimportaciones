create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'::public.user_role
  );
$$;

revoke execute on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.favorites enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_item_customizations enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.categories from anon, authenticated;
revoke all on table public.products from anon, authenticated;
revoke all on table public.product_images from anon, authenticated;
revoke all on table public.product_variants from anon, authenticated;
revoke all on table public.favorites from anon, authenticated;
revoke all on table public.orders from anon, authenticated;
revoke all on table public.order_items from anon, authenticated;
revoke all on table public.order_item_customizations from anon, authenticated;

grant select on table public.categories, public.products, public.product_images, public.product_variants to anon;
grant select on table public.categories, public.products, public.product_images, public.product_variants to authenticated;
grant select on table public.profiles to authenticated;
grant update (display_name, phone) on table public.profiles to authenticated;
grant select, insert, delete on table public.favorites to authenticated;
grant select, update on table public.orders to authenticated;
grant select on table public.order_items, public.order_item_customizations to authenticated;
grant insert, update, delete on table public.categories, public.products, public.product_images, public.product_variants to authenticated;

create policy "profiles_select_own_or_admin"
on public.profiles for select to authenticated
using (id = (select auth.uid()) or (select private.is_admin()));

create policy "profiles_update_own_or_admin"
on public.profiles for update to authenticated
using (id = (select auth.uid()) or (select private.is_admin()))
with check (id = (select auth.uid()) or (select private.is_admin()));

create policy "categories_public_read"
on public.categories for select to anon, authenticated
using (active = true);

create policy "categories_admin_read"
on public.categories for select to authenticated
using ((select private.is_admin()));

create policy "categories_admin_insert"
on public.categories for insert to authenticated
with check ((select private.is_admin()));

create policy "categories_admin_update"
on public.categories for update to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "categories_admin_delete"
on public.categories for delete to authenticated
using ((select private.is_admin()));

create policy "products_public_read"
on public.products for select to anon, authenticated
using (
  published = true
  and exists (
    select 1 from public.categories
    where categories.id = products.category_id
      and categories.active = true
  )
);

create policy "products_admin_read"
on public.products for select to authenticated
using ((select private.is_admin()));

create policy "products_admin_insert"
on public.products for insert to authenticated
with check ((select private.is_admin()));

create policy "products_admin_update"
on public.products for update to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "products_admin_delete"
on public.products for delete to authenticated
using ((select private.is_admin()));

create policy "product_images_public_read"
on public.product_images for select to anon, authenticated
using (
  exists (
    select 1 from public.products
    where products.id = product_images.product_id
      and products.published = true
  )
);

create policy "product_images_admin_read"
on public.product_images for select to authenticated
using ((select private.is_admin()));

create policy "product_images_admin_insert"
on public.product_images for insert to authenticated
with check ((select private.is_admin()));

create policy "product_images_admin_update"
on public.product_images for update to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "product_images_admin_delete"
on public.product_images for delete to authenticated
using ((select private.is_admin()));

create policy "product_variants_public_read"
on public.product_variants for select to anon, authenticated
using (
  active = true
  and exists (
    select 1 from public.products
    where products.id = product_variants.product_id
      and products.published = true
  )
);

create policy "product_variants_admin_read"
on public.product_variants for select to authenticated
using ((select private.is_admin()));

create policy "product_variants_admin_insert"
on public.product_variants for insert to authenticated
with check ((select private.is_admin()));

create policy "product_variants_admin_update"
on public.product_variants for update to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "product_variants_admin_delete"
on public.product_variants for delete to authenticated
using ((select private.is_admin()));

create policy "favorites_select_own"
on public.favorites for select to authenticated
using (user_id = (select auth.uid()));

create policy "favorites_insert_own"
on public.favorites for insert to authenticated
with check (user_id = (select auth.uid()));

create policy "favorites_delete_own"
on public.favorites for delete to authenticated
using (user_id = (select auth.uid()));

create policy "orders_select_own_or_admin"
on public.orders for select to authenticated
using (user_id = (select auth.uid()) or (select private.is_admin()));

create policy "orders_admin_update"
on public.orders for update to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "order_items_select_owner_or_admin"
on public.order_items for select to authenticated
using (
  exists (
    select 1 from public.orders
    where orders.id = order_items.order_id
      and (orders.user_id = (select auth.uid()) or (select private.is_admin()))
  )
);

create policy "order_item_customizations_select_owner_or_admin"
on public.order_item_customizations for select to authenticated
using (
  exists (
    select 1
    from public.order_items
    join public.orders on orders.id = order_items.order_id
    where order_items.id = order_item_customizations.order_item_id
      and (orders.user_id = (select auth.uid()) or (select private.is_admin()))
  )
);

create or replace function private.create_order(
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_delivery_method public.delivery_method,
  p_delivery_address text,
  p_payment_method text,
  p_customer_notes text,
  p_items jsonb
)
returns table (order_id uuid, order_number bigint, subtotal numeric, total numeric)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_item jsonb;
  v_product public.products%rowtype;
  v_variant public.product_variants%rowtype;
  v_order_item_id uuid;
  v_quantity integer;
  v_unit_price numeric(12, 2);
  v_subtotal numeric(12, 2) := 0;
  v_customizations jsonb;
  v_customization record;
begin
  if nullif(btrim(p_customer_name), '') is null or char_length(btrim(p_customer_name)) > 120 then
    raise exception 'Customer name is required and must have at most 120 characters.' using errcode = '22023';
  end if;

  if nullif(btrim(p_customer_phone), '') is null
    or char_length(btrim(p_customer_phone)) not between 6 and 30 then
    raise exception 'Customer phone must have between 6 and 30 characters.' using errcode = '22023';
  end if;

  if p_customer_email is not null and char_length(p_customer_email) > 320 then
    raise exception 'Customer email is too long.' using errcode = '22023';
  end if;

  if p_delivery_method = 'delivery'::public.delivery_method
    and nullif(btrim(p_delivery_address), '') is null then
    raise exception 'Delivery address is required.' using errcode = '22023';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array'
    or jsonb_array_length(p_items) not between 1 and 50 then
    raise exception 'An order must contain between 1 and 50 items.' using errcode = '22023';
  end if;

  insert into public.orders (
    user_id,
    customer_name,
    customer_email,
    customer_phone,
    delivery_method,
    delivery_address,
    payment_method,
    customer_notes
  ) values (
    (select auth.uid()),
    btrim(p_customer_name),
    nullif(btrim(p_customer_email), ''),
    btrim(p_customer_phone),
    p_delivery_method,
    nullif(btrim(p_delivery_address), ''),
    nullif(btrim(p_payment_method), ''),
    nullif(btrim(p_customer_notes), '')
  ) returning * into v_order;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    if jsonb_typeof(v_item) <> 'object'
      or coalesce(v_item ->> 'quantity', '') !~ '^[1-9][0-9]*$' then
      raise exception 'Each order item must be a valid object with a positive quantity.' using errcode = '22023';
    end if;

    v_quantity := (v_item ->> 'quantity')::integer;
    if v_quantity > 99 then
      raise exception 'Item quantity cannot exceed 99.' using errcode = '22023';
    end if;

    begin
      select * into strict v_product
      from public.products
      where id = (v_item ->> 'product_id')::uuid
        and published = true
        and availability <> 'out_of_stock'::public.product_availability;
    exception
      when no_data_found or invalid_text_representation then
        raise exception 'One or more products are unavailable.' using errcode = '22023';
    end;

    v_unit_price := v_product.price;
    v_variant := null;

    if nullif(v_item ->> 'variant_id', '') is not null then
      begin
        select * into strict v_variant
        from public.product_variants
        where id = (v_item ->> 'variant_id')::uuid
          and product_id = v_product.id
          and active = true
          and availability <> 'out_of_stock'::public.product_availability;
      exception
        when no_data_found or invalid_text_representation then
          raise exception 'One or more product variants are unavailable.' using errcode = '22023';
      end;
      v_unit_price := v_unit_price + v_variant.price_adjustment;
    end if;

    if v_product.stock_quantity is not null and v_quantity > v_product.stock_quantity then
      raise exception 'Requested quantity exceeds available stock.' using errcode = '22023';
    end if;

    if v_variant.id is not null
      and v_variant.stock_quantity is not null
      and v_quantity > v_variant.stock_quantity then
      raise exception 'Requested quantity exceeds available variant stock.' using errcode = '22023';
    end if;

    v_customizations := coalesce(v_item -> 'customizations', '{}'::jsonb);
    if jsonb_typeof(v_customizations) <> 'object' then
      raise exception 'Customizations must be an object.' using errcode = '22023';
    end if;

    if (select count(*) from jsonb_object_keys(v_customizations)) > 20 then
      raise exception 'Customizations must contain at most 20 values.' using errcode = '22023';
    end if;

    if v_customizations <> '{}'::jsonb and not v_product.customizable then
      raise exception 'This product does not accept customizations.' using errcode = '22023';
    end if;

    insert into public.order_items (
      order_id,
      product_id,
      variant_id,
      product_name,
      variant_name,
      unit_price,
      quantity
    ) values (
      v_order.id,
      v_product.id,
      v_variant.id,
      v_product.name,
      v_variant.name,
      v_unit_price,
      v_quantity
    ) returning id into v_order_item_id;

    for v_customization in
      select key, value #>> '{}' as value
      from jsonb_each(v_customizations)
    loop
      if v_customization.value is null
        or char_length(v_customization.key) not between 1 and 80
        or char_length(v_customization.value) not between 1 and 500 then
        raise exception 'Customization labels or values are too long.' using errcode = '22023';
      end if;

      insert into public.order_item_customizations (order_item_id, label, value)
      values (v_order_item_id, v_customization.key, v_customization.value);
    end loop;

    v_subtotal := v_subtotal + (v_unit_price * v_quantity);
  end loop;

  update public.orders
  set subtotal = v_subtotal,
      total = case
        when p_delivery_method = 'pickup'::public.delivery_method then v_subtotal
        else null
      end
  where id = v_order.id
  returning * into v_order;

  return query
  select v_order.id, v_order.order_number, v_order.subtotal, v_order.total;
end;
$$;

revoke execute on function private.create_order(text, text, text, public.delivery_method, text, text, text, jsonb)
from public;
grant execute on function private.create_order(text, text, text, public.delivery_method, text, text, text, jsonb)
to anon, authenticated;

create or replace function public.create_order(
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_delivery_method public.delivery_method,
  p_delivery_address text,
  p_payment_method text,
  p_customer_notes text,
  p_items jsonb
)
returns table (order_id uuid, order_number bigint, subtotal numeric, total numeric)
language sql
security invoker
set search_path = ''
as $$
  select *
  from private.create_order(
    p_customer_name,
    p_customer_email,
    p_customer_phone,
    p_delivery_method,
    p_delivery_address,
    p_payment_method,
    p_customer_notes,
    p_items
  );
$$;

revoke execute on function public.create_order(text, text, text, public.delivery_method, text, text, text, jsonb)
from public;
grant execute on function public.create_order(text, text, text, public.delivery_method, text, text, text, jsonb)
to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "product_images_storage_admin_insert"
on storage.objects for insert to authenticated
with check (bucket_id = 'product-images' and (select private.is_admin()));

create policy "product_images_storage_admin_update"
on storage.objects for update to authenticated
using (bucket_id = 'product-images' and (select private.is_admin()))
with check (bucket_id = 'product-images' and (select private.is_admin()));

create policy "product_images_storage_admin_delete"
on storage.objects for delete to authenticated
using (bucket_id = 'product-images' and (select private.is_admin()));
