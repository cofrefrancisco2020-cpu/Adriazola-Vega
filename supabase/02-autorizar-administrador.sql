-- Primero crea la cuenta en Authentication > Users > Add user > Create new user.
-- Cambia SOLO este correo por el correo REAL de quien administrará el catálogo.
-- Ejecuta desde SQL Editor con tu cuenta de propietario del proyecto.
do $$
declare admin_email text := 'CAMBIAR-POR-CORREO-REAL'; admin_id uuid;
begin
  select id into admin_id from auth.users where lower(email)=lower(trim(admin_email));
  if admin_id is null then raise exception 'No existe ese usuario. Crea primero la cuenta en Authentication > Users y corrige el correo.'; end if;
  insert into public.catalog_admins(user_id) values(admin_id) on conflict do nothing;
end $$;

-- Para revocar el acceso de una persona, ejecutar por separado:
-- delete from public.catalog_admins where user_id=(select id from auth.users where email='correo-real');
-- La autorización se consulta en cada operación; no depende del botón ni de datos del perfil.
