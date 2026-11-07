import {test} from 'node:test';
import assert from 'node:assert/strict';
import {securityState,enrollAuthenticator,verifyAuthenticator,qrSource} from '../catalog-security.js';
const reply=data=>({data,error:null});
const clientFor=(current,next,factors)=>({auth:{mfa:{getAuthenticatorAssuranceLevel:async()=>reply({currentLevel:current,nextLevel:next}),listFactors:async()=>reply({totp:factors})}}});
test('Una cuenta no autorizada no pasa a configurar el segundo factor',async()=>{const state=await securityState(null,async()=>false);assert.equal(state.authorized,false);assert.equal(state.verified,false);});
test('El primer factor exige código aunque el administrador ya tenga una aplicación registrada',async()=>{const state=await securityState(clientFor('aal1','aal2',[{id:'f1',status:'verified'}]),async()=>true);assert.equal(state.authorized,true);assert.equal(state.verified,false);assert.equal(state.factors.length,1);});
test('Solo una sesión aal2 con TOTP verificado puede continuar',async()=>{
  assert.equal((await securityState(clientFor('aal2','aal2',[{id:'f1',status:'verified'}]),async()=>true)).verified,true);
  assert.equal((await securityState(clientFor('aal2','aal1',[{id:'f1',status:'verified'}]),async()=>true)).verified,false);
  assert.equal((await securityState(clientFor('aal2','aal2',[]),async()=>true)).verified,false);
});
test('Volver a configurar solo descarta factores temporales de esta aplicación',async()=>{
  const removed=[];
  const client={auth:{mfa:{listFactors:async()=>reply({all:[{id:'old',factor_type:'totp',status:'unverified',friendly_name:'Adriazola 4WD'},{id:'verified',factor_type:'totp',status:'verified',friendly_name:'Adriazola 4WD'},{id:'other',factor_type:'totp',status:'unverified',friendly_name:'Otra aplicación'}]}),unenroll:async({factorId})=>{removed.push(factorId);return reply({});},enroll:async args=>reply({id:'new',...args})}}};
  assert.equal((await enrollAuthenticator(client)).id,'new');assert.deepEqual(removed,['old']);
});
test('El código se verifica con Supabase y nunca se acepta solo por tener seis números',async()=>{
  let called=0;const client={auth:{mfa:{challengeAndVerify:async args=>{called++;assert.deepEqual(args,{factorId:'f1',code:'123456'});return {data:null,error:new Error('mfa_verification_failed')};}}}};
  await assert.rejects(()=>verifyAuthenticator(client,'f1','123'),/CODIGO_MFA_INVALIDO/);assert.equal(called,0);
  await assert.rejects(()=>verifyAuthenticator(client,'f1','123456'),/mfa_verification_failed/);assert.equal(called,1);
});
test('El QR solo admite imágenes SVG y rechaza direcciones de script o externas',()=>{
  assert.ok(qrSource('<svg xmlns="http://www.w3.org/2000/svg"></svg>').startsWith('data:image/svg+xml;'));
  assert.throws(()=>qrSource('javascript:alert(1)'));
  assert.throws(()=>qrSource('https://otro.example/qr.svg'));
});
