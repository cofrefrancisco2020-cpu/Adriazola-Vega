-- Adriazola 4WD · Catálogo v11. Ejecutar completo en SQL Editor.
-- No contiene contraseñas ni crea administradores automáticamente.
begin;

create table if not exists public.catalog_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.catalog_settings (
  id boolean primary key default true check(id),
  max_products integer not null default 100 check(max_products between 1 and 500),
  max_categories integer not null default 20 check(max_categories between 1 and 100)
);
insert into public.catalog_settings(id) values(true) on conflict do nothing;

create table if not exists public.catalog_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check(length(trim(name)) between 2 and 60),
  position integer not null default 0 check(position>=0),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);
create unique index if not exists catalog_categories_name_unique on public.catalog_categories(lower(trim(name)));
create table if not exists public.catalog_products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.catalog_categories(id) on delete restrict,
  name text not null check(length(trim(name)) between 1 and 100),
  description text not null check(length(trim(description)) between 1 and 2000),
  sku text not null default '' check(length(sku)<=60),
  price bigint check(price between 0 and 999999999),
  image_path text check(image_path ~ '^products/[0-9a-f-]{36}\.webp$'),
  published boolean not null default false,
  in_stock boolean not null default true,
  position integer not null default 0 check(position>=0),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  constraint catalog_published_photo check(not published or image_path is not null)
);
create index if not exists catalog_products_category on public.catalog_products(category_id);
create index if not exists catalog_products_public_order on public.catalog_products(position,created_at) where published;

alter table public.catalog_admins enable row level security;
alter table public.catalog_settings enable row level security;
alter table public.catalog_categories enable row level security;
alter table public.catalog_products enable row level security;

create or replace function public.is_catalog_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.catalog_admins where user_id=(select auth.uid()))
    and coalesce((select auth.jwt()->>'aal')='aal2',false)
    and exists(select 1 from auth.mfa_factors where user_id=(select auth.uid()) and status='verified' and factor_type='totp');
$$;
revoke all on function public.is_catalog_admin() from public;
grant execute on function public.is_catalog_admin() to authenticated;
revoke execute on function public.is_catalog_admin() from anon;

revoke all on public.catalog_admins,public.catalog_settings,public.catalog_categories,public.catalog_products from anon,authenticated;
grant select on public.catalog_admins to authenticated;
grant select on public.catalog_settings,public.catalog_categories,public.catalog_products to anon,authenticated;

drop policy if exists catalog_admin_self on public.catalog_admins;
create policy catalog_admin_self on public.catalog_admins for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists catalog_settings_read on public.catalog_settings;
create policy catalog_settings_read on public.catalog_settings for select to anon,authenticated using(true);
drop policy if exists catalog_categories_read on public.catalog_categories;
create policy catalog_categories_read on public.catalog_categories for select to anon,authenticated using(true);
drop policy if exists catalog_products_read on public.catalog_products;
drop policy if exists catalog_products_public_read on public.catalog_products;
drop policy if exists catalog_products_authenticated_read on public.catalog_products;
create policy catalog_products_public_read on public.catalog_products for select to anon using(published);
create policy catalog_products_authenticated_read on public.catalog_products for select to authenticated using(published or (select public.is_catalog_admin()));

-- Todas las escrituras pasan por funciones que comprueban al administrador.
-- El mismo bloqueo transaccional serializa altas, bajas, cambios y límites.
create or replace function public.catalog_save_product(p_product jsonb,p_expected_updated_at timestamptz default null)
returns public.catalog_products language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_old public.catalog_products; v_new public.catalog_products; v_path text;
begin
  if not public.is_catalog_admin() then raise exception 'NO_AUTORIZADO' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(987413,11);
  v_id := nullif(p_product->>'id','')::uuid;
  v_path := nullif(p_product->>'image_path','');
  if v_path is not null and not exists(select 1 from storage.objects where bucket_id='catalog-photos' and name=v_path) then
    raise exception 'VALIDACION_FOTO';
  end if;
  if v_id is null then
    if (select count(*) from public.catalog_products)>=(select max_products from public.catalog_settings where id) then raise exception 'LIMITE_PRODUCTOS'; end if;
    insert into public.catalog_products(category_id,name,description,sku,price,image_path,published,in_stock,position)
    values((p_product->>'category_id')::uuid,trim(p_product->>'name'),trim(p_product->>'description'),coalesce(trim(p_product->>'sku'),''),
      nullif(p_product->>'price','')::bigint,v_path,coalesce((p_product->>'published')::boolean,false),coalesce((p_product->>'in_stock')::boolean,true),
      coalesce((select max(position)+1 from public.catalog_products),0)) returning * into v_new;
  else
    select * into v_old from public.catalog_products where id=v_id for update;
    if not found or p_expected_updated_at is null or v_old.updated_at<>p_expected_updated_at then raise exception 'CONFLICTO_EDICION'; end if;
    update public.catalog_products set category_id=(p_product->>'category_id')::uuid,name=trim(p_product->>'name'),description=trim(p_product->>'description'),
      sku=coalesce(trim(p_product->>'sku'),''),price=nullif(p_product->>'price','')::bigint,image_path=v_path,
      published=coalesce((p_product->>'published')::boolean,false),in_stock=coalesce((p_product->>'in_stock')::boolean,true),updated_at=clock_timestamp()
      where id=v_id returning * into v_new;
  end if;
  return v_new;
end; $$;

create or replace function public.catalog_delete_product(p_id uuid,p_expected_updated_at timestamptz)
returns text language plpgsql security definer set search_path = '' as $$
declare v_old public.catalog_products;
begin
  if not public.is_catalog_admin() then raise exception 'NO_AUTORIZADO' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(987413,11);
  select * into v_old from public.catalog_products where id=p_id for update;
  if not found or p_expected_updated_at is null or v_old.updated_at<>p_expected_updated_at then raise exception 'CONFLICTO_EDICION'; end if;
  delete from public.catalog_products where id=p_id;
  return v_old.image_path;
end; $$;

create or replace function public.catalog_save_category(p_id uuid,p_name text,p_expected_updated_at timestamptz default null)
returns public.catalog_categories language plpgsql security definer set search_path = '' as $$
declare v_old public.catalog_categories; v_new public.catalog_categories;
begin
  if not public.is_catalog_admin() then raise exception 'NO_AUTORIZADO' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(987413,11);
  if p_id is null then
    if (select count(*) from public.catalog_categories)>=(select max_categories from public.catalog_settings where id) then raise exception 'LIMITE_CATEGORIAS'; end if;
    insert into public.catalog_categories(name,position) values(trim(p_name),coalesce((select max(position)+1 from public.catalog_categories),0)) returning * into v_new;
  else
    select * into v_old from public.catalog_categories where id=p_id for update;
    if not found or p_expected_updated_at is null or v_old.updated_at<>p_expected_updated_at then raise exception 'CONFLICTO_EDICION'; end if;
    update public.catalog_categories set name=trim(p_name),updated_at=clock_timestamp() where id=p_id returning * into v_new;
  end if;
  return v_new;
end; $$;

create or replace function public.catalog_delete_category(p_id uuid,p_expected_updated_at timestamptz)
returns void language plpgsql security definer set search_path = '' as $$
declare v_old public.catalog_categories;
begin
  if not public.is_catalog_admin() then raise exception 'NO_AUTORIZADO' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(987413,11);
  select * into v_old from public.catalog_categories where id=p_id for update;
  if not found or p_expected_updated_at is null or v_old.updated_at<>p_expected_updated_at then raise exception 'CONFLICTO_EDICION'; end if;
  if exists(select 1 from public.catalog_products where category_id=p_id) then raise exception 'CATEGORIA_CON_PRODUCTOS'; end if;
  delete from public.catalog_categories where id=p_id;
end; $$;

create or replace function public.catalog_reorder(p_kind text,p_ids uuid[])
returns void language plpgsql security definer set search_path = '' as $$
declare v_count integer;
begin
  if not public.is_catalog_admin() then raise exception 'NO_AUTORIZADO' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(987413,11);
  if p_ids is null or cardinality(p_ids)<>(select count(distinct x) from unnest(p_ids) x) then raise exception 'CONFLICTO_EDICION'; end if;
  if p_kind='products' then
    select count(*) into v_count from public.catalog_products;
    if cardinality(p_ids)<>v_count or exists(select 1 from unnest(p_ids) x where not exists(select 1 from public.catalog_products p where p.id=x)) then raise exception 'CONFLICTO_EDICION'; end if;
    update public.catalog_products p set position=(o.n-1)::integer,updated_at=clock_timestamp() from unnest(p_ids) with ordinality o(id,n) where p.id=o.id;
  elsif p_kind='categories' then
    select count(*) into v_count from public.catalog_categories;
    if cardinality(p_ids)<>v_count or exists(select 1 from unnest(p_ids) x where not exists(select 1 from public.catalog_categories c where c.id=x)) then raise exception 'CONFLICTO_EDICION'; end if;
    update public.catalog_categories c set position=(o.n-1)::integer,updated_at=clock_timestamp() from unnest(p_ids) with ordinality o(id,n) where c.id=o.id;
  else raise exception 'VALIDACION_ORDEN';
  end if;
end; $$;

revoke all on function public.catalog_save_product(jsonb,timestamptz),public.catalog_delete_product(uuid,timestamptz),
  public.catalog_save_category(uuid,text,timestamptz),public.catalog_delete_category(uuid,timestamptz),public.catalog_reorder(text,uuid[]) from public,anon;
grant execute on function public.catalog_save_product(jsonb,timestamptz),public.catalog_delete_product(uuid,timestamptz),
  public.catalog_save_category(uuid,text,timestamptz),public.catalog_delete_category(uuid,timestamptz),public.catalog_reorder(text,uuid[]) to authenticated;

-- Máximo 120 imágenes de 400 KiB (menos de 47 MiB), incluidas las pendientes.
-- El bloqueo se mantiene hasta confirmar la transacción de subida.
create or replace function public.catalog_photo_capacity() returns boolean
language plpgsql volatile security definer set search_path = '' as $$
begin
  if not public.is_catalog_admin() then return false; end if;
  perform pg_advisory_xact_lock(987413,12);
  if (select count(*) from storage.objects where bucket_id='catalog-photos')>=120 then
    raise exception 'LIMITE_IMAGENES';
  end if;
  return true;
end; $$;
revoke all on function public.catalog_photo_capacity() from public,anon;
grant execute on function public.catalog_photo_capacity() to authenticated;

-- Fotos públicas de productos; solo administradores con doble factor pueden subir y borrar.
-- Nombres aleatorios y sin sobrescritura: una edición no modifica la foto anterior.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('catalog-photos','catalog-photos',true,409600,array['image/webp'])
on conflict(id) do update set public=true,file_size_limit=409600,allowed_mime_types=array['image/webp'];
drop policy if exists catalog_photos_insert on storage.objects;
create policy catalog_photos_insert on storage.objects for insert to authenticated with check(
  bucket_id='catalog-photos' and (select public.is_catalog_admin()) and name ~ '^products/[0-9a-f-]{36}\.webp$'
  and public.catalog_photo_capacity()
);
drop policy if exists catalog_photos_select on storage.objects;
create policy catalog_photos_select on storage.objects for select to authenticated using(bucket_id='catalog-photos' and (select public.is_catalog_admin()));
drop policy if exists catalog_photos_delete on storage.objects;
create policy catalog_photos_delete on storage.objects for delete to authenticated using(
  bucket_id='catalog-photos' and (select public.is_catalog_admin())
  and not exists(select 1 from public.catalog_products where image_path=storage.objects.name)
);

-- Categorías iniciales, editables. No se crean productos ficticios.
insert into public.catalog_categories(name,position) values ('Repuestos',0),('Equipamiento 4x4',1),('Lubricantes y filtros',2),('Accesorios',3)
on conflict do nothing;
commit;
