-- Ejecutar después de 01-instalar.sql y 02-autorizar-administrador.sql.
-- Solo inspecciona configuración. No crea ni elimina productos.
do $$
declare t text;
begin
  foreach t in array array['catalog_admins','catalog_settings','catalog_categories','catalog_products'] loop
    if not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname=t and c.relrowsecurity) then raise exception 'Falta RLS en %',t; end if;
    if has_table_privilege('anon','public.'||t,'INSERT,UPDATE,DELETE') or has_table_privilege('authenticated','public.'||t,'INSERT,UPDATE,DELETE') then raise exception 'Hay permisos de escritura directa en %',t; end if;
  end loop;
  if not exists(select 1 from storage.buckets where id='catalog-photos' and public and file_size_limit=409600 and allowed_mime_types=array['image/webp']) then raise exception 'Revisar configuración del bucket catalog-photos'; end if;
  if position('aal2' in pg_get_functiondef('public.is_catalog_admin()'::regprocedure))=0 then raise exception 'Falta exigir doble factor en el servidor'; end if;
  if has_function_privilege('anon','public.catalog_save_product(jsonb,timestamptz)','EXECUTE') then raise exception 'Un visitante puede ejecutar escritura'; end if;
  if not has_function_privilege('authenticated','public.catalog_save_product(jsonb,timestamptz)','EXECUTE') then raise exception 'Falta permiso para guardar con una cuenta autorizada'; end if;
end $$;
select 'Configuración básica verificada' as resultado,
  (select count(*) from public.catalog_admins) as administradores,
  case when exists(select 1 from public.catalog_admins) then 'Administrador autorizado; requiere código MFA' else 'Seguro: acceso cerrado hasta autorizar correos' end as estado_acceso,
  (select max_products from public.catalog_settings where id) as limite_productos,
  (select max_categories from public.catalog_settings where id) as limite_categorias;
