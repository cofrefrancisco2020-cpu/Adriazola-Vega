import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createActivationHandler} from '../supabase/functions/catalog-activate/handler.js';
import {invitationSecret,invitationLink} from '../catalog-team.js';
const token='a'.repeat(64),password='SoloParaPruebas-2026';
function fixture(overrides={}){
  const calls=[];const admin={rpc:async(name,args)=>{calls.push([name,args]);return {data:name==='catalog_activation_lookup'?{id:'invite-1',email:'person@example.test',existing_id:null}:null,error:null};},auth:{admin:{createUser:async data=>{calls.push(['createUser',data]);return {data:{user:{id:'user-1'}},error:null};}}},...overrides};
  const handler=createActivationHandler({admin,login:async()=>({data:{user:{id:'user-1'}},error:null})});return {calls,handler};
}
const req=(body={token,password},headers={})=>new Request('https://example.test/activate',{method:'POST',headers:{origin:'https://mecanicadriazola.cl','content-type':'application/json',...headers},body:JSON.stringify(body)});
await test('Los enlaces secretos son de 256 bits, distintos y solo usan el fragmento',async()=>{
  const a=await invitationSecret(),b=await invitationSecret();assert.match(a.token,/^[a-f0-9]{64}$/);assert.notEqual(a.token,b.token);assert.notEqual(a.token,a.hash);
  const u=new URL(invitationLink(a.token,'https://mecanicadriazola.cl/admin.html?old=1'));assert.equal(u.pathname,'/activar.html');assert.equal(u.search,'');assert.equal(u.hash,'#'+a.token);
});
await test('La activación crea solo el correo autorizado y no devuelve claves ni sesiones',async()=>{
  const {handler,calls}=fixture();const response=await handler(req({token,password,email:'attacker@example.test'}));assert.equal(response.status,200);assert.deepEqual(await response.json(),{email:'person@example.test'});
  const create=calls.find(c=>c[0]==='createUser')[1];assert.equal(create.email,'person@example.test');assert.equal(create.email_confirm,true);assert.deepEqual(create.app_metadata,{catalog_invitation_id:'invite-1'});
  assert.notEqual(calls[0][1].p_hash,token);assert.equal(response.headers.get('cache-control'),'no-store');
});
await test('Enlace inválido, contraseña débil u origen ajeno nunca crean usuarios',async()=>{
  const {handler,calls}=fixture();assert.equal((await handler(req({token,password:'short'}))).status,400);assert.equal((await handler(req(undefined,{origin:'https://evil.example'}))).status,403);assert.equal((await handler(req({token:'invalid',password}))).status,400);assert.equal(calls.length,0);
  const blocked=fixture({rpc:async()=>({data:{error:'INVITACION_INVALIDA'},error:null})});assert.equal((await blocked.handler(req())).status,400);assert.equal(blocked.calls.length,0);
});
await test('No se modifica una cuenta existente y exige demostrar la misma contraseña al reintentar',async()=>{
  let creates=0,finishes=0;
  const admin={rpc:async name=>{if(name==='catalog_activation_lookup')return {data:{id:'invite-1',email:'person@example.test',existing_id:'user-1'},error:null};finishes++;return {data:null,error:null};},auth:{admin:{createUser:async()=>{creates++;}}}};
  const bad=createActivationHandler({admin,login:async()=>({data:null,error:new Error('wrong')})});assert.equal((await bad(req())).status,400);assert.equal(finishes,0);
  const good=createActivationHandler({admin,login:async()=>({data:{user:{id:'user-1'}},error:null})});assert.equal((await good(req())).status,200);assert.equal(creates,0);assert.equal(finishes,1);
});
await test('Limita tamaño, no expone errores internos y respeta la cuota de intentos',async()=>{
  const {handler,calls}=fixture();assert.equal((await handler(req({token,password,padding:'x'.repeat(5000)}))).status,413);assert.equal(calls.length,0);
  const limited=fixture({rpc:async()=>({data:{error:'ESPERA_ACTIVACION'},error:null})});assert.equal((await limited.handler(req())).status,429);
  const broken=fixture({rpc:async()=>{throw new Error('private backend data');}});const response=await broken.handler(req());assert.equal(response.status,503);assert.equal((await response.text()).includes('private backend'),false);
});
