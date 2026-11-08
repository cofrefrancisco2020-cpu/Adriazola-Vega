import {test} from 'node:test';import assert from 'node:assert/strict';
import {startPhoneChange,finishPhoneChange} from '../catalog-phone.js';
const ok=data=>({data,error:null});
await test('Un código nuevo incorrecto no retira ningún autenticador anterior',async()=>{
  let removed=0;const client={auth:{mfa:{challengeAndVerify:async()=>({error:new Error('invalid code')}),unenroll:async()=>{removed++;return ok({});}}}};
  const replacement={factor:{id:'new'},oldIds:['old'],verified:false};await assert.rejects(()=>finishPhoneChange(client,replacement,'123456'));assert.equal(removed,0);assert.equal(replacement.verified,false);
});
await test('Verifica el teléfono nuevo antes de retirar anteriores y puede reintentar una interrupción',async()=>{
  const events=[];let once=true;const client={auth:{mfa:{challengeAndVerify:async()=>{events.push('verified');return ok({});},unenroll:async({factorId})=>{events.push(factorId);if(factorId==='old2'&&once){once=false;return {error:new Error('network')};}return ok({});}}}};
  const replacement={factor:{id:'new'},oldIds:['old1','old2'],verified:false};await assert.rejects(()=>finishPhoneChange(client,replacement,'123456'));assert.deepEqual(events,['verified','old1','old2']);assert.deepEqual(replacement.oldIds,['old2']);
  await finishPhoneChange(client,replacement,'');assert.deepEqual(events,['verified','old1','old2','old2']);assert.deepEqual(replacement.oldIds,[]);
});
await test('No inicia un cambio de teléfono con contraseña sola',async()=>{
  let enrolled=false;const client={auth:{mfa:{listFactors:async()=>ok({totp:[{id:'old',status:'verified'}]}),getAuthenticatorAssuranceLevel:async()=>ok({currentLevel:'aal1'}),enroll:async()=>{enrolled=true;}}}};
  await assert.rejects(()=>startPhoneChange(client),/NO_AUTORIZADO/);assert.equal(enrolled,false);
});
