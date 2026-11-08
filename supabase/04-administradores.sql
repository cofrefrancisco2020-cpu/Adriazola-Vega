-- Altas por invitación privada. Ejecutar después de 01-instalar.sql.
-- No abre el registro público ni modifica contraseñas o autenticadores existentes.
begin;
create schema if not exists catalog_private;
revoke all on schema catalog_private from public,anon,authenticated;
create table if not exists catalog_private.invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null check(length(email) between 3 and 254 and email=lower(trim(email))),
  token_hash text unique check(token_hash ~ '^[0-9a-f]{64}$'),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null default clock_timestamp()+interval '24 hours',
  used_at timestamptz,revoked_at timestamptz,
  attempts integer not null default 0,
  attempt_window timestamptz not null default clock_timestamp()
);
alter table catalog_private.invitations enable row level security;
revoke all on catalog_private.invitations from public,anon,authenticated;
create index if not exists catalog_invites_email on catalog_private.invitations(email);
create table if not exists catalog_private.activation_budget (
  id boolean primary key default true check(id),
  minute_at timestamptz not null default clock_timestamp(),minute_count integer not null default 0,
  day_at timestamptz not null default clock_timestamp(),day_count integer not null default 0
);
insert into catalog_private.activation_budget(id) values(true) on conflict do nothing;
alter table catalog_private.activation_budget enable row level security;
revoke all on catalog_private.activation_budget from public,anon,authenticated;

create or replace function public.catalog_team_list() returns jsonb
language plpgsql security definer set search_path='' as $$
begin
  if not public.is_catalog_admin() then raise exception 'NO_AUTORIZADO'; end if;
  return jsonb_build_object('max_admins',10,'self_id',auth.uid(),
    'admins',coalesce((select jsonb_agg(jsonb_build_object('id',a.user_id,'email',u.email,'created_at',a.created_at,
      'mfa_ready',exists(select 1 from auth.mfa_factors f where f.user_id=a.user_id and f.status='verified' and f.factor_type='totp')) order by a.created_at)
      from public.catalog_admins a join auth.users u on u.id=a.user_id),'[]'::jsonb),
    'invitations',coalesce((select jsonb_agg(jsonb_build_object('id',i.id,'email',i.email,'expires_at',i.expires_at) order by i.created_at desc)
      from catalog_private.invitations i where i.used_at is null and i.revoked_at is null and i.expires_at>clock_timestamp()
      and exists(select 1 from public.catalog_admins a where a.user_id=i.created_by)),'[]'::jsonb));
end $$;

create or replace function public.catalog_invite_create(p_email text,p_token_hash text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_email text:=lower(trim(p_email)); v_invite catalog_private.invitations;
begin
  if not public.is_catalog_admin() then raise exception 'NO_AUTORIZADO'; end if;
  perform pg_advisory_xact_lock(841104);
  if v_email is null or length(v_email)>254 or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then raise exception 'INVITACION_DATOS'; end if;
  if exists(select 1 from auth.users where lower(email)=v_email) then raise exception 'CUENTA_EXISTENTE'; end if;
  if exists(select 1 from catalog_private.invitations where email=v_email and used_at is null and revoked_at is null and expires_at>clock_timestamp()) then raise exception 'INVITACION_PENDIENTE'; end if;
  if (select count(*) from public.catalog_admins)+(select count(*) from catalog_private.invitations where used_at is null and revoked_at is null and expires_at>clock_timestamp())>=10 then raise exception 'LIMITE_ADMINISTRADORES'; end if;
  if (select count(*) from auth.users)+(select count(*) from catalog_private.invitations where used_at is null and revoked_at is null and expires_at>clock_timestamp())>=20 then raise exception 'LIMITE_CUENTAS'; end if;
  if (select count(*) from catalog_private.invitations where created_at>clock_timestamp()-interval '24 hours')>=20 then raise exception 'LIMITE_INVITACIONES_DIA'; end if;
  -- Conserva un historial acotado; nunca se guarda el enlace secreto.
  delete from catalog_private.invitations where created_at<clock_timestamp()-interval '30 days' and (used_at is not null or revoked_at is not null or expires_at<clock_timestamp());
  insert into catalog_private.invitations(email,token_hash,created_by) values(v_email,p_token_hash,auth.uid()) returning * into v_invite;
  return jsonb_build_object('id',v_invite.id,'email',v_invite.email,'expires_at',v_invite.expires_at);
end $$;

create or replace function public.catalog_invite_cancel(p_id uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
  if not public.is_catalog_admin() then raise exception 'NO_AUTORIZADO'; end if;
  update catalog_private.invitations set revoked_at=clock_timestamp(),token_hash=null where id=p_id and used_at is null and revoked_at is null;
end $$;

create or replace function public.catalog_admin_revoke(p_user_id uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
  if not public.is_catalog_admin() then raise exception 'NO_AUTORIZADO'; end if;
  perform pg_advisory_xact_lock(841104);
  if p_user_id=auth.uid() then raise exception 'NO_REVOCAR_PROPIO_ACCESO'; end if;
  if (select count(*) from public.catalog_admins)<=1 then raise exception 'ULTIMO_ADMINISTRADOR'; end if;
  delete from public.catalog_admins where user_id=p_user_id;
  update catalog_private.invitations set revoked_at=clock_timestamp(),token_hash=null where created_by=p_user_id and used_at is null;
end $$;

-- Estas dos operaciones solo son accesibles desde la función de servidor.
create or replace function public.catalog_activation_lookup(p_hash text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_budget catalog_private.activation_budget; v_invite catalog_private.invitations; v_existing uuid;
begin
  select * into v_budget from catalog_private.activation_budget where id for update;
  if v_budget.minute_at<clock_timestamp()-interval '1 minute' then v_budget.minute_at:=clock_timestamp();v_budget.minute_count:=0;end if;
  if v_budget.day_at<clock_timestamp()-interval '24 hours' then v_budget.day_at:=clock_timestamp();v_budget.day_count:=0;end if;
  if v_budget.minute_count>=10 or v_budget.day_count>=100 then return jsonb_build_object('error','ESPERA_ACTIVACION'); end if;
  update catalog_private.activation_budget set minute_at=v_budget.minute_at,minute_count=v_budget.minute_count+1,day_at=v_budget.day_at,day_count=v_budget.day_count+1 where id;
  select * into v_invite from catalog_private.invitations where token_hash=p_hash and used_at is null and revoked_at is null and expires_at>clock_timestamp() for update;
  if not found or not exists(select 1 from public.catalog_admins where user_id=v_invite.created_by) then return jsonb_build_object('error','INVITACION_INVALIDA'); end if;
  if v_invite.attempt_window<clock_timestamp()-interval '15 minutes' then v_invite.attempt_window:=clock_timestamp();v_invite.attempts:=0;end if;
  if v_invite.attempts>=5 then return jsonb_build_object('error','ESPERA_ACTIVACION');end if;
  update catalog_private.invitations set attempts=v_invite.attempts+1,attempt_window=v_invite.attempt_window where id=v_invite.id;
  select id into v_existing from auth.users where lower(email)=v_invite.email and raw_app_meta_data->>'catalog_invitation_id'=v_invite.id::text;
  if exists(select 1 from auth.users where lower(email)=v_invite.email) and v_existing is null then return jsonb_build_object('error','CUENTA_EXISTENTE'); end if;
  return jsonb_build_object('id',v_invite.id,'email',v_invite.email,'existing_id',v_existing);
end $$;

create or replace function public.catalog_activation_finish(p_hash text,p_user_id uuid) returns void
language plpgsql security definer set search_path='' as $$
declare v_invite catalog_private.invitations;
begin
  perform pg_advisory_xact_lock(841104);
  select * into v_invite from catalog_private.invitations where token_hash=p_hash and used_at is null and revoked_at is null and expires_at>clock_timestamp() for update;
  if not found or not exists(select 1 from public.catalog_admins where user_id=v_invite.created_by) then raise exception 'INVITACION_INVALIDA'; end if;
  if not exists(select 1 from auth.users where id=p_user_id and lower(email)=v_invite.email and raw_app_meta_data->>'catalog_invitation_id'=v_invite.id::text) then raise exception 'INVITACION_INVALIDA'; end if;
  if (select count(*) from public.catalog_admins)>=10 then raise exception 'LIMITE_ADMINISTRADORES';end if;
  insert into public.catalog_admins(user_id) values(p_user_id) on conflict do nothing;
  update catalog_private.invitations set used_at=clock_timestamp(),token_hash=null where id=v_invite.id;
end $$;

revoke all on function public.catalog_team_list(),public.catalog_invite_create(text,text),public.catalog_invite_cancel(uuid),public.catalog_admin_revoke(uuid),public.catalog_activation_lookup(text),public.catalog_activation_finish(text,uuid) from public,anon,authenticated;
grant execute on function public.catalog_team_list(),public.catalog_invite_create(text,text),public.catalog_invite_cancel(uuid),public.catalog_admin_revoke(uuid) to authenticated;
grant execute on function public.catalog_activation_lookup(text),public.catalog_activation_finish(text,uuid) to service_role;
commit;
