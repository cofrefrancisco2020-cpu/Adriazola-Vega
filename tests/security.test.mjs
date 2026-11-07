import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {PGlite}=await import(process.env.PGLITE_PATH||'@electric-sql/pglite');
const admin='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222';
const db=new PGlite();
await db.exec(`
create role anon nologin;create role authenticated nologin;
create schema auth;create table auth.users(id uuid primary key,email text);
create table auth.mfa_factors(user_id uuid,status text,factor_type text);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create function auth.jwt() returns jsonb language sql stable as $$select jsonb_build_object('aal',current_setting('request.jwt.claim.aal',true))$$;
grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;
create schema storage;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text,unique(bucket_id,name));
alter table storage.objects enable row level security;
grant usage on schema storage to anon,authenticated;
grant select,insert,update,delete on storage.objects to anon,authenticated;
insert into auth.users values('${admin}','admin@example.test'),('${other}','other@example.test');
`);
const migration=await fs.readFile(new URL('../supabase/01-instalar.sql',import.meta.url),'utf8');
await db.exec(migration);
await db.exec(`insert into public.catalog_admins(user_id) values('${admin}');insert into auth.mfa_factors values('${admin}','verified','totp')`);
const q=(sql,params)=>db.query(sql,params);
async function as(role,id='',aal='aal2'){await db.exec(`reset role;set role ${role}`);await q("select set_config('request.jwt.claim.sub',$1,false)",[id]);await q("select set_config('request.jwt.claim.aal',$1,false)",[aal]);}
const expectFail=async(fn,pattern)=>{await assert.rejects(fn,pattern);};
let category,product,photo='products/33333333-3333-4333-8333-333333333333.webp';
const save=async(p,expected=null)=>(await q('select to_jsonb(public.catalog_save_product($1::jsonb,$2::timestamptz)) as data',[JSON.stringify(p),expected])).rows[0].data;
await test('Instalación repetible y lectura pública limitada a publicados',async()=>{
  await db.exec(migration);await as('anon');assert.equal((await q('select * from public.catalog_categories')).rows.length,4);
  assert.equal((await q('select * from public.catalog_products')).rows.length,0);
  await expectFail(()=>q('select public.is_catalog_admin() as ok'),/permission denied/);
  await expectFail(()=>q('select * from public.catalog_admins'),/permission denied/);
});
await test('Visitantes y cuentas sin autorización no pueden editar, subir imágenes ni hacerse administradores',async()=>{
  await expectFail(()=>q("insert into public.catalog_categories(name) values('Ataque')"),/permission denied/);
  await expectFail(()=>save({name:'Ataque'}),/permission denied/);
  await as('authenticated',other);
  assert.equal((await q('select public.is_catalog_admin() as ok')).rows[0].ok,false);
  await expectFail(()=>save({name:'Ataque'}),/NO_AUTORIZADO/);
  await expectFail(()=>q('insert into public.catalog_admins(user_id) values($1)',[other]),/permission denied/);
  await expectFail(()=>q('update public.catalog_settings set max_products=500'),/permission denied/);
  await expectFail(()=>q('insert into storage.objects(bucket_id,name) values($1,$2)',['catalog-photos',photo]),/row-level security/);
});
await test('Administrador autorizado crea borradores, publica y protege la fotografía referenciada',async()=>{
  await as('authenticated',admin);assert.equal((await q('select public.is_catalog_admin() as ok')).rows[0].ok,true);
  category=(await q('select * from public.catalog_categories order by position limit 1')).rows[0];
  await q('insert into storage.objects(bucket_id,name) values($1,$2)',['catalog-photos',photo]);
  product=await save({name:'Filtro Nissan',description:'Descripción real',category_id:category.id,price:19990,sku:'F-1',published:false,in_stock:true,image_path:photo});
  await as('anon');assert.equal((await q('select * from public.catalog_products')).rows.length,0);
  await as('authenticated',other);assert.equal((await q('select * from public.catalog_products')).rows.length,0);
  await as('authenticated',admin);product=await save({...product,published:true},product.updated_at);
  const deletion=await q('delete from storage.objects where name=$1 returning name',[photo]);assert.equal(deletion.rows.length,0);
  await as('anon');assert.equal((await q('select name from public.catalog_products')).rows[0].name,'Filtro Nissan');
});
await test('Una contraseña correcta no permite editar ni ver borradores sin el segundo código',async()=>{
  await as('authenticated',admin);
  const draft=await save({name:'Borrador protegido por MFA',description:'No debe leerse con contraseña sola',category_id:category.id,published:false});
  await as('authenticated',admin,'aal1');
  assert.equal((await q('select * from public.catalog_admins')).rows.length,1);
  assert.equal((await q('select public.is_catalog_admin() as ok')).rows[0].ok,false);
  assert.equal((await q('select * from public.catalog_products where id=$1',[draft.id])).rows.length,0);
  await expectFail(()=>save({...product,price:1},product.updated_at),/NO_AUTORIZADO/);
  await expectFail(()=>q('insert into storage.objects(bucket_id,name) values($1,$2)',['catalog-photos','products/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.webp']),/row-level security/);
  await as('authenticated',admin);
  await q('select public.catalog_delete_product($1,$2)',[draft.id,draft.updated_at]);
});
await test('Un token antiguo aal2 pierde permiso si se elimina el factor TOTP verificado',async()=>{
  await db.exec("reset role;update auth.mfa_factors set status='unverified'");await as('authenticated',admin);
  assert.equal((await q('select public.is_catalog_admin() as ok')).rows[0].ok,false);
  await expectFail(()=>save({...product,price:1},product.updated_at),/NO_AUTORIZADO/);
  await db.exec("reset role;update auth.mfa_factors set status='verified'");await as('authenticated',admin);
});
await test('El almacenamiento rechaza la imagen 121 y libera espacio al borrar fotos sin uso',async()=>{
  for(let i=1;i<120;i++)await q("insert into storage.objects(bucket_id,name) values('catalog-photos','products/'||gen_random_uuid()::text||'.webp')");
  await expectFail(()=>q("insert into storage.objects(bucket_id,name) values('catalog-photos','products/'||gen_random_uuid()::text||'.webp')"),/LIMITE_IMAGENES/);
  assert.equal((await q("select count(*)::int as n from storage.objects where bucket_id='catalog-photos'")).rows[0].n,120);
  await q('delete from storage.objects where name<>$1',[photo]);
  assert.equal((await q('select count(*)::int as n from storage.objects')).rows[0].n,1);
  await db.exec('reset role');assert.equal((await q("select file_size_limit from storage.buckets where id='catalog-photos'")).rows[0].file_size_limit,409600);await as('authenticated',admin);
});
await test('Una edición atrasada no sobrescribe cambios y los precios inválidos son rechazados en la base',async()=>{
  await as('authenticated',admin);const old=product;product=await save({...old,price:20990},old.updated_at);
  await expectFail(()=>save({...old,price:999},old.updated_at),/CONFLICTO_EDICION/);
  await expectFail(()=>q('select public.catalog_delete_product($1,$2)',[old.id,old.updated_at]),/CONFLICTO_EDICION/);
  await expectFail(()=>save({...product,price:-1},product.updated_at),/check constraint/);
  await expectFail(()=>save({...product,published:true,image_path:null},product.updated_at),/check constraint/);
  await expectFail(()=>save({...product,image_path:'products/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.webp'},product.updated_at),/VALIDACION_FOTO/);
});
await test('Mover, ordenar, renombrar y borrar categorías respetan integridad y permisos',async()=>{
  const created=(await q('select to_jsonb(public.catalog_save_category(null,$1,null)) as data',['Repuestos Nissan'])).rows[0].data;
  product=await save({...product,category_id:created.id},product.updated_at);
  await expectFail(()=>q('select public.catalog_delete_category($1,$2)',[created.id,created.updated_at]),/CATEGORIA_CON_PRODUCTOS/);
  await expectFail(()=>q('select public.catalog_save_category(null,$1,null)',['REPUESTOS NISSAN']),/unique constraint/);
  await q('select public.catalog_save_category($1,$2,$3)',[created.id,'Nissan y Toyota',created.updated_at]);
  await q('select public.catalog_reorder($1,$2)',['products',[product.id]]);
  product=(await q('select * from public.catalog_products where id=$1',[product.id])).rows[0];
  await expectFail(()=>q('select public.catalog_reorder($1,$2)',['products',[product.id,product.id]]),/CONFLICTO_EDICION/);
});
await test('El límite de 100 incluye borradores, y una edición sigue permitida al llegar al máximo',async()=>{
  for(let i=1;i<100;i++)await save({name:`Borrador ${i}`,description:'Prueba de límite',category_id:category.id,price:null,published:false,in_stock:true});
  assert.equal((await q('select count(*)::int as n from public.catalog_products')).rows[0].n,100);
  await expectFail(()=>save({name:'Número 101',description:'No debe guardarse',category_id:category.id}),/LIMITE_PRODUCTOS/);
  product=await save({...product,description:'Editado al llegar al límite'},product.updated_at);
});
await test('Límite de categorías aplicado en el servidor',async()=>{
  let n=(await q('select count(*)::int as n from public.catalog_categories')).rows[0].n;
  for(;n<20;n++)await q('select public.catalog_save_category(null,$1,null)',[`Categoría ${n}`]);
  await expectFail(()=>q("select public.catalog_save_category(null,'Número 21',null)"),/LIMITE_CATEGORIAS/);
});
await test('Revocar administrador corta inmediatamente las escrituras y acceso a borradores',async()=>{
  await db.exec(`reset role;delete from public.catalog_admins where user_id='${admin}'`);await as('authenticated',admin);
  assert.equal((await q('select public.is_catalog_admin() as ok')).rows[0].ok,false);
  await expectFail(()=>save({...product,price:1},product.updated_at),/NO_AUTORIZADO/);
  assert.equal((await q('select * from public.catalog_products')).rows.length,1);
  await db.exec(`reset role;insert into public.catalog_admins(user_id) values('${admin}')`);await as('authenticated',admin);
});
await test('Borrar producto libera capacidad y permite limpiar solo su foto sin referencias',async()=>{
  const result=await q('select public.catalog_delete_product($1,$2) as path',[product.id,product.updated_at]);assert.equal(result.rows[0].path,photo);
  const deletion=await q('delete from storage.objects where name=$1 returning name',[photo]);assert.equal(deletion.rows.length,1);
  await save({name:'Nuevo producto',description:'Capacidad liberada',category_id:category.id});
  assert.equal((await q('select count(*)::int as n from public.catalog_products')).rows[0].n,100);
});
await test('La verificación de instalación real termina sin alterar los productos',async()=>{
  await db.exec('reset role');
  const verify=await fs.readFile(new URL('../supabase/03-verificar.sql',import.meta.url),'utf8');
  await db.exec(verify);assert.equal((await q('select count(*)::int as n from public.catalog_products')).rows[0].n,100);
});
await db.close();
