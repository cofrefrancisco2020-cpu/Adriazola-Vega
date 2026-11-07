import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const library=await fs.readFile(new URL('../vendor/supabase.js',import.meta.url),'utf8');
const context=vm.createContext({URL,URLSearchParams,Headers,Request,Response,fetch:(...args)=>globalThis.fetch(...args),WebSocket,console,TextEncoder,TextDecoder,AbortController,setTimeout,clearTimeout,setInterval,clearInterval,crypto,atob,btoa,Blob,FormData});
vm.runInContext(library,context);
class MemoryStorage{items=new Map();getItem(k){return this.items.get(k)??null;}setItem(k,v){this.items.set(k,v);}removeItem(k){this.items.delete(k);}}
globalThis.sessionStorage=new MemoryStorage();globalThis.localStorage=new MemoryStorage();
globalThis.window={ADRIAZOLA_CONFIG:{supabaseUrl:'https://catalog-test.supabase.co',supabasePublishableKey:'sb_publishable_test_only'},supabase:context.supabase};
const calls=[];const realFetch=globalThis.fetch;
const token=btoa(JSON.stringify({alg:'HS256',typ:'JWT'}))+'.'+btoa(JSON.stringify({sub:'11111111-1111-4111-8111-111111111111',role:'authenticated',exp:Math.floor(Date.now()/1000)+3600}))+'.test';
globalThis.fetch=async(input,init={})=>{
  const url=new URL(typeof input==='string'?input:input.url);const body=init.body;calls.push({url,init,body});
  const reply=data=>new Response(JSON.stringify(data),{status:200,headers:{'Content-Type':'application/json'}});
  if(url.pathname==='/auth/v1/token')return reply({access_token:token,refresh_token:'test-refresh',expires_in:3600,token_type:'bearer',user:{id:'11111111-1111-4111-8111-111111111111',email:'admin@example.test'}});
  if(url.pathname==='/auth/v1/logout')return reply({});
  if(url.pathname==='/auth/v1/recover')return reply({});
  if(url.pathname.endsWith('/catalog_products'))return reply([{id:'p1',name:'Filtro',image_path:'products/test.webp',published:true}]);
  if(url.pathname.endsWith('/catalog_categories'))return reply([{id:'c1',name:'Repuestos'}]);
  if(url.pathname.endsWith('/catalog_settings'))return reply({max_products:100,max_categories:20});
  if(url.pathname.endsWith('/catalog_admins'))return reply([{user_id:'11111111-1111-4111-8111-111111111111'}]);
  if(url.pathname.endsWith('/is_catalog_admin'))return reply(true);
  if(url.pathname.includes('/rpc/'))return reply(url.pathname.endsWith('catalog_delete_product')?'products/old.webp':null);
  if(url.pathname.startsWith('/storage/v1/'))return reply({Key:'catalog-photos/products/test.webp'});
  throw new Error('Unexpected test request: '+url.pathname);
};
const {api,client}=await import('../catalog-api.js?test-sdk');
await test('El SDK oficial inicia sesión y conserva el token solo en la pestaña',async()=>{
  assert.ok(client);const {error}=await client.auth.signInWithPassword({email:'admin@example.test',password:'test-only-not-real'});assert.ifError(error);
  assert.ok(sessionStorage.getItem('adriazola-catalog-auth'));assert.equal(localStorage.getItem('adriazola-catalog-auth'),null);
});
await test('El adaptador consulta productos, categorías y límites, y construye imágenes públicas',async()=>{
  const data=await api.load();assert.equal(data.products.length,1);assert.equal(data.settings.max_products,100);
  assert.equal(data.products[0].image_url,'https://catalog-test.supabase.co/storage/v1/object/public/catalog-photos/products/test.webp');
  assert.equal(await api.isAdmin(),true);
  assert.equal(await api.isMember(),true);
});
await test('Ediciones y bajas envían la fecha de la versión leída al procedimiento protegido',async()=>{
  await api.saveProduct({name:'Filtro'},'2026-01-01T00:00:00Z');let last=calls.at(-1);assert.equal(last.url.pathname,'/rest/v1/rpc/catalog_save_product');
  assert.equal(JSON.parse(last.body).p_expected_updated_at,'2026-01-01T00:00:00Z');
  assert.equal(await api.deleteProduct('p1','v1'),'products/old.webp');
  await api.saveCategory({name:'Nissan'},null);await api.deleteCategory('c1','v2');await api.reorder('products',['p1']);
  assert.deepEqual(JSON.parse(calls.at(-1).body),{p_kind:'products',p_ids:['p1']});
});
await test('Las fotos se suben con nombre aleatorio, tipo WebP y sin sobrescribir',async()=>{
  const key=await api.uploadPhoto(new Blob(['test fixture'],{type:'image/webp'}));assert.match(key,/^products\/[a-f0-9-]{36}\.webp$/);
  const req=calls.at(-1);assert.equal(req.init.method,'POST');assert.equal(new Headers(req.init.headers).get('x-upsert'),'false');
  await api.removePhoto(key);assert.equal(calls.at(-1).init.method,'DELETE');
  await assert.rejects(()=>api.uploadPhoto(new Blob(['bad'],{type:'text/html'})),/VALIDACION_FOTO/);
  await assert.rejects(()=>api.uploadPhoto(new Blob([new Uint8Array(409601)],{type:'image/webp'})),/VALIDACION_FOTO/);
});
await test('La recuperación mantiene su verificador entre pestañas sin persistir tokens allí',async()=>{
  const {error}=await client.auth.resetPasswordForEmail('admin@example.test',{redirectTo:'https://ejemplo.cl/admin.html'});assert.ifError(error);
  assert.ok([...localStorage.items.keys()].some(key=>key.endsWith('-code-verifier')));
  assert.equal(localStorage.getItem('adriazola-catalog-auth'),null);
  await client.auth.signOut({scope:'local'});assert.equal(sessionStorage.getItem('adriazola-catalog-auth'),null);
});
client.auth.stopAutoRefresh();globalThis.fetch=realFetch;
