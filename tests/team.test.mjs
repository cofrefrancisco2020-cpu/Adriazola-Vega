import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const {PGlite}=await import(process.env.PGLITE_PATH||'@electric-sql/pglite');
const db=new PGlite();
const owner='11111111-1111-4111-8111-111111111111',second='22222222-2222-4222-8222-222222222222';
await db.exec(`create role anon;create role authenticated;create role service_role;
create schema auth;create table auth.users(id uuid primary key,email text,raw_app_meta_data jsonb default '{}');
create table auth.mfa_factors(user_id uuid,status text,factor_type text);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create function auth.jwt() returns jsonb language sql stable as $$select jsonb_build_object('aal',current_setting('request.jwt.claim.aal',true))$$;
grant usage on schema auth to anon,authenticated;grant execute on function auth.uid(),auth.jwt() to anon,authenticated;
create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text,unique(bucket_id,name));alter table storage.objects enable row level security;
grant usage on schema storage to anon,authenticated;grant select,insert,update,delete on storage.objects to anon,authenticated;
insert into auth.users(id,email) values('${owner}','owner@example.test');`);
await db.exec(await fs.readFile(new URL('../supabase/01-instalar.sql',import.meta.url),'utf8'));
const migration=await fs.readFile(new URL('../supabase/04-administradores.sql',import.meta.url),'utf8');
await db.exec(migration);
await db.exec(`insert into public.catalog_admins(user_id) values('${owner}');insert into auth.mfa_factors values('${owner}','verified','totp');`);
const query=(sql,args)=>db.query(sql,args);
async function as(role='authenticated',id=owner,aal='aal2'){
  await db.exec(`reset role;set role ${role}`);await query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claim.aal',$2,false)",[id,aal]);
}
const rpc=async(name,args=[],casts=[])=>{const p=args.map((_,i)=>`$${i+1}${casts[i]?'::'+casts[i]:''}`).join(',');return (await query(`select public.${name}(${p}) as value`,args)).rows[0].value;};
let sequence=0;const hash=()=>createHash('sha256').update('private-test-link-'+(++sequence)).digest('hex');
async function invite(email){await as();const secret=hash();const data=await rpc('catalog_invite_create',[email,secret]);return {...data,hash:secret};}
async function budgetReset(){await db.exec("reset role;update catalog_private.activation_budget set minute_count=0,day_count=0;update catalog_private.invitations set attempts=0;");}
await test('Visitantes, cuentas ajenas y sesiones sin segundo factor no administran accesos',async()=>{
  await as('anon','');await assert.rejects(()=>rpc('catalog_team_list'),/permission denied/);
  await as('authenticated',second);await assert.rejects(()=>rpc('catalog_invite_create',['a@example.test',hash()]),/NO_AUTORIZADO/);
  await as('authenticated',owner,'aal1');await assert.rejects(()=>rpc('catalog_team_list'),/NO_AUTORIZADO/);
  await assert.rejects(()=>rpc('catalog_invite_create',['a@example.test',hash()]),/NO_AUTORIZADO/);
  await as();await assert.rejects(()=>query('select * from catalog_private.invitations'),/permission denied/);
  await assert.rejects(()=>rpc('catalog_activation_lookup',[hash()]),/permission denied/);
  await assert.rejects(()=>rpc('catalog_activation_finish',[hash(),second]),/permission denied/);
});
let first;
await test('Solo se guarda el hash; se limita la validez y no se duplican invitaciones',async()=>{
  first=await invite(' Second@Example.Test ');assert.equal(first.email,'second@example.test');
  const list=await rpc('catalog_team_list');assert.equal(list.invitations[0].email,'second@example.test');assert.equal(JSON.stringify(list).includes(first.hash),false);
  await assert.rejects(()=>rpc('catalog_invite_create',['second@example.test',hash()]),/INVITACION_PENDIENTE/);
  await assert.rejects(()=>rpc('catalog_invite_create',['owner@example.test',hash()]),/CUENTA_EXISTENTE/);
  await assert.rejects(()=>rpc('catalog_invite_create',['<img onerror=evil>',hash()]),/INVITACION_DATOS/);
  assert.ok(new Date(first.expires_at)-Date.now()<86401000);
});
await test('Activación exige la identidad y metadatos privados correctos; el enlace es de un uso',async()=>{
  await as('service_role');const lookup=await rpc('catalog_activation_lookup',[first.hash]);assert.equal(lookup.email,'second@example.test');
  await db.exec('reset role');await query('insert into auth.users(id,email) values($1,$2)',[second,'second@example.test']);
  await as('service_role');await assert.rejects(()=>rpc('catalog_activation_finish',[first.hash,second]),/INVITACION_INVALIDA/);
  await db.exec('reset role');await query('update auth.users set raw_app_meta_data=$1 where id=$2',[JSON.stringify({catalog_invitation_id:first.id}),second]);
  await as('service_role');assert.equal((await rpc('catalog_activation_lookup',[first.hash])).existing_id,second);
  await rpc('catalog_activation_finish',[first.hash,second]);
  await assert.rejects(()=>rpc('catalog_activation_finish',[first.hash,second]),/INVITACION_INVALIDA/);
  assert.equal((await rpc('catalog_activation_lookup',[first.hash])).error,'INVITACION_INVALIDA');
  await as('authenticated',second);assert.equal(await rpc('is_catalog_admin'),false);
  await assert.rejects(()=>rpc('catalog_team_list'),/NO_AUTORIZADO/);
  await db.exec(`reset role;insert into auth.mfa_factors values('${second}','verified','totp')`);
  await as('authenticated',second);assert.equal((await rpc('catalog_team_list')).admins.length,2);
});
await test('Cancelar o caducar un enlace impide activar; se puede generar otro',async()=>{
  const cancelled=await invite('cancel@example.test');await rpc('catalog_invite_cancel',[cancelled.id]);
  await as('service_role');assert.equal((await rpc('catalog_activation_lookup',[cancelled.hash])).error,'INVITACION_INVALIDA');
  const replacement=await invite('cancel@example.test');await db.exec('reset role');await query("update catalog_private.invitations set expires_at=clock_timestamp()-interval '1 second' where id=$1",[replacement.id]);
  await as('service_role');assert.equal((await rpc('catalog_activation_lookup',[replacement.hash])).error,'INVITACION_INVALIDA');
});
await test('Revocar acceso invalida operaciones incluso con JWT aal2 y cancela invitaciones emitidas',async()=>{
  await as('authenticated',second);const invited=await rpc('catalog_invite_create',['delegated@example.test',hash()]);
  await as();await assert.rejects(()=>rpc('catalog_admin_revoke',[owner]),/NO_REVOCAR_PROPIO_ACCESO/);
  await rpc('catalog_admin_revoke',[second]);
  await as('authenticated',second);assert.equal(await rpc('is_catalog_admin'),false);await assert.rejects(()=>rpc('catalog_team_list'),/NO_AUTORIZADO/);
  await as();assert.equal((await rpc('catalog_team_list')).invitations.some(i=>i.id===invited.id),false);
  await db.exec('reset role');assert.equal((await query('select count(*)::int n from auth.users where id=$1',[second])).rows[0].n,1);
});
await test('Máximo diez plazas contando pendientes; una contraseña sola tampoco puede invitar',async()=>{
  for(let i=0;i<9;i++)await invite(`slot${i}@example.test`);
  await assert.rejects(()=>rpc('catalog_invite_create',['overflow@example.test',hash()]),/LIMITE_ADMINISTRADORES/);
  await as('authenticated',owner,'aal1');await assert.rejects(()=>rpc('catalog_invite_cancel',[first.id]),/NO_AUTORIZADO/);
  await db.exec('reset role');await db.exec("update catalog_private.invitations set revoked_at=clock_timestamp() where used_at is null");
});
await test('El límite de intentos persiste aunque el enlace sea inválido',async()=>{
  await budgetReset();await as('service_role');for(let i=0;i<10;i++)assert.equal((await rpc('catalog_activation_lookup',[hash()])).error,'INVITACION_INVALIDA');
  assert.equal((await rpc('catalog_activation_lookup',[hash()])).error,'ESPERA_ACTIVACION');
  await db.exec('reset role');assert.equal((await query('select minute_count from catalog_private.activation_budget')).rows[0].minute_count,10);
  await db.exec('update catalog_private.activation_budget set minute_count=0,day_count=100');await as('service_role');assert.equal((await rpc('catalog_activation_lookup',[hash()])).error,'ESPERA_ACTIVACION');
});
await test('La migración es repetible sin abrir permisos ni perder cuentas',async()=>{
  await db.exec('reset role');await db.exec(migration);await as();assert.equal((await rpc('catalog_team_list')).admins.length,1);
  await as('anon','');await assert.rejects(()=>rpc('catalog_activation_lookup',[hash()]),/permission denied/);
});
await db.close();
